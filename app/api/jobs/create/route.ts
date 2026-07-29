import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { sendNewJobAlert, sendAdminFlaggedNotice } from '@/lib/server/brevo';
import { sendTelegramJobPost } from '@/lib/server/telegram';
import { FieldValue } from '@/lib/firebase/admin';
import { containsProfanity } from '@/lib/server/moderation';

/**
 * POST /api/jobs/create
 *
 * Called by the front-end new-job page when a job provider submits a new job.
 * Creates the job directly as 'active' (auto-approved) unless flagged by profanity filter.
 *
 * Body: { title, companyName, location, specificArea, jobType, salaryRange, description, applyMethod, applyUrl, phone, category }
 */
export async function POST(req: NextRequest) {
  try {
    // ── 1. Auth check ────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });
    }

    const idToken = authHeader.slice(7);
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch {
      return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });
    }

    const providerId = decodedToken.uid;

    // ── 2. Upgrade user role if they are currently a seeker ──────────────────
    const userDocRef = adminDb.collection('users').doc(providerId);
    const userDocSnap = await userDocRef.get();

    if (userDocSnap.exists) {
      const profile = userDocSnap.data()!;
      if (profile.role === 'seeker') {
        await userDocRef.update({ role: 'provider' });
      }
    }

    // ── 3. Parse + validate body ─────────────────────────────────────────────
    const body = await req.json();
    const {
      title,
      companyName,
      location,
      specificArea,
      jobType,
      salaryRange,
      description,
      applyMethod,
      applyUrl,
      phone,
      category,
      tags,
    } = body;

    if (!title || !companyName || !location || !jobType || !description || !applyMethod || !category) {
      return NextResponse.json({ error: 'Missing required job fields' }, { status: 400 });
    }

    const hasProfanity =
      (await containsProfanity(title)) ||
      (await containsProfanity(companyName)) ||
      (await containsProfanity(description));

    const jobStatus = hasProfanity ? 'flagged' : 'active';

    // Create Job Doc
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days expiry

    const newJobData = {
      title,
      companyName,
      location,
      specificArea: specificArea || '',
      jobType,
      salaryRange: salaryRange || '',
      description,
      applyMethod,
      applyUrl: applyUrl || '',
      phone: phone || '',
      category,
      providerId,
      status: jobStatus,
      featured: false,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt,
      tags: tags || [],
    };

    const jobDocRef = await adminDb.collection('jobs').add(newJobData);
    const jobId = jobDocRef.id;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://karavali-jobs.com';
    const jobLink = `${siteUrl}/jobs/${jobId}`;

    let emailsSent = 0;
    let telegramOk = false;
    let telegramError: string | null = null;

    if (hasProfanity) {
      // Notify Admin via Brevo
      try {
        const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@karavali-jobs.com';
        await sendAdminFlaggedNotice(adminEmail, title, companyName, jobId);
      } catch (emailErr) {
        console.error('[createJob] Failed to send flagged job notification to admin:', emailErr);
      }
    } else {
      // ── 5. Telegram broadcast ──────────────────────────────────────────────
      try {
        await sendTelegramJobPost({
          title,
          companyName,
          location,
          jobType,
          salaryRange,
          link: jobLink,
          tags,
        });
        telegramOk = true;
      } catch (tgErr: any) {
        console.error('[createJob] Telegram broadcast failed:', tgErr);
        telegramError = tgErr?.message || String(tgErr);
      }

      // ── 6. Log broadcast attempt to Firestore ──────────────────────────────
      try {
        await adminDb.collection('broadcastLog').add({
          jobId,
          jobTitle: title,
          channel: 'telegram',
          status: telegramOk ? 'sent' : 'failed',
          lastError: telegramError,
          attempts: 1,
          createdAt: new Date(),
        });
      } catch (logErr) {
        console.error('[createJob] Failed to write broadcastLog:', logErr);
      }

      // ── 7. Send Job Alerts to Subscribed Seekers ──────────────────────────
      try {
        const subscribersSnap = await adminDb
          .collection('users')
          .where('subscribedToAlerts', '==', true)
          .get();

        const emails = subscribersSnap.docs
          .map((d: any) => d.data().email as string)
          .filter(Boolean);

        if (emails.length > 0) {
          await sendNewJobAlert(emails, title, companyName, jobId, location);
          emailsSent = emails.length;
        }
      } catch (emailErr) {
        console.error('[createJob] Seeker email alert sending failed:', emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      jobId,
      status: jobStatus,
      telegram: hasProfanity ? 'skipped_flagged' : (telegramOk ? 'sent' : 'failed'),
    });
  } catch (err: any) {
    console.error('[createJob] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

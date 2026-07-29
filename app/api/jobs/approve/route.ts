import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { sendNewJobAlert } from '@/lib/server/brevo';
import { sendTelegramJobPost } from '@/lib/server/telegram';

/**
 * POST /api/jobs/approve
 *
 * Called by the admin moderation page when an admin clicks "Approve".
 * Replaces the old client-side updateDoc call.
 *
 * Body: { jobId: string }
 *
 * What it does:
 * 1. Verifies the caller is authenticated as super_admin (via Firebase ID token).
 * 2. Sets jobs/{jobId} status → 'active' via Admin SDK.
 * 3. Fetches all users where subscribedToAlerts == true.
 * 4. Sends job alert email via Brevo (batched).
 * 5. Posts to Telegram channel.
 * 6. Logs broadcast attempt to broadcastLog collection.
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

    // Fetch user doc to verify super_admin role
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: super_admin role required' }, { status: 403 });
    }

    // ── 2. Parse + validate body ─────────────────────────────────────────────
    const body = await req.json();
    const { jobId } = body;
    if (!jobId || typeof jobId !== 'string') {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    }

    // ── 3. Fetch job document ────────────────────────────────────────────────
    const jobRef = adminDb.collection('jobs').doc(jobId);
    const jobSnap = await jobRef.get();

    if (!jobSnap.exists) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const jobData = jobSnap.data()!;

    if (jobData.status !== 'pending_review' && jobData.status !== 'flagged') {
      return NextResponse.json(
        { error: `Job status is '${jobData.status}', cannot be approved.` },
        { status: 409 }
      );
    }

    // ── 4. Approve: set status → active ─────────────────────────────────────
    await jobRef.update({ status: 'active' });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://karavali-jobs.com';
    const jobLink = `${siteUrl}/jobs/${jobId}`;

    // ── 5. Email alerts to subscribers ──────────────────────────────────────
    let emailsSent = 0;
    try {
      const subscribersSnap = await adminDb
        .collection('users')
        .where('subscribedToAlerts', '==', true)
        .get();

      const emails = subscribersSnap.docs
        .map((d: any) => d.data().email as string)
        .filter(Boolean);

      if (emails.length > 0) {
        await sendNewJobAlert(
          emails,
          jobData.title,
          jobData.companyName,
          jobId,
          jobData.location
        );
        emailsSent = emails.length;
      }
    } catch (emailErr) {
      // Non-fatal — log and continue
      console.error('[approve] Email alert sending failed:', emailErr);
    }

    // ── 6. Telegram broadcast ────────────────────────────────────────────────
    let telegramOk = false;
    let telegramError: string | null = null;
    try {
      await sendTelegramJobPost({
        title: jobData.title,
        companyName: jobData.companyName,
        location: jobData.location,
        jobType: jobData.jobType,
        salaryRange: jobData.salaryRange,
        link: jobLink,
      });
      telegramOk = true;
    } catch (tgErr: any) {
      console.error('[approve] Telegram broadcast failed:', tgErr);
      telegramError = tgErr?.message || String(tgErr);
    }

    // ── 7. Log broadcast attempt to Firestore ────────────────────────────────
    try {
      await adminDb.collection('broadcastLog').add({
        jobId,
        jobTitle: jobData.title,
        channel: 'telegram',
        status: telegramOk ? 'sent' : 'failed',
        lastError: telegramError,
        attempts: 1,
        createdAt: new Date(),
      });
    } catch (logErr) {
      console.error('[approve] Failed to write broadcastLog:', logErr);
    }

    return NextResponse.json({
      success: true,
      jobId,
      emailsSent,
      telegram: telegramOk ? 'sent' : 'failed',
    });
  } catch (err: any) {
    console.error('[approve] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

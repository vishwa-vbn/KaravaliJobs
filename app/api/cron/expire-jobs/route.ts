import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { sendExpiryNotice } from '@/lib/server/brevo';

export const dynamic = 'force-dynamic';


/**
 * GET /api/cron/expire-jobs
 *
 * Triggered by Vercel Cron (see vercel.json).
 * Protected by CRON_SECRET header — Vercel injects this automatically.
 *
 * What it does:
 * 1. Queries all active jobs where expiresAt <= now.
 * 2. Batch-updates their status to 'expired'.
 * 3. For each, fetches the provider's email and sends an expiry notice via Brevo.
 */
export async function GET(req: NextRequest) {
  // ── Auth: verify Vercel cron secret ────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const now = new Date();
  console.log(`[expire-jobs] Running at ${now.toISOString()}`);

  try {
    // ── 1. Find expired active jobs ───────────────────────────────────────────
    const expiredSnap = await adminDb
      .collection('jobs')
      .where('status', '==', 'active')
      .where('expiresAt', '<=', now)
      .get();

    if (expiredSnap.empty) {
      console.log('[expire-jobs] No active jobs found past expiry.');
      return NextResponse.json({ expired: 0, emailsSent: 0 });
    }

    console.log(`[expire-jobs] Found ${expiredSnap.size} expired listing(s).`);

    // ── 2. Batch-update status to 'expired' ───────────────────────────────────
    const batch = adminDb.batch();
    expiredSnap.docs.forEach((docSnap) => {
      batch.update(docSnap.ref, { status: 'expired' });
    });
    await batch.commit();

    // ── 3. Send expiry notices to providers ───────────────────────────────────
    let emailsSent = 0;
    for (const docSnap of expiredSnap.docs) {
      const jobData = docSnap.data();
      try {
        const userSnap = await adminDb.collection('users').doc(jobData.providerId).get();
        if (userSnap.exists) {
          const userData = userSnap.data()!;
          if (userData.email) {
            await sendExpiryNotice(
              userData.email,
              userData.displayName || 'Provider',
              jobData.title,
              docSnap.id
            );
            emailsSent++;
          }
        }
      } catch (emailErr) {
        // Non-fatal — log and continue to next job
        console.error(`[expire-jobs] Failed to send notice for job ${docSnap.id}:`, emailErr);
      }
    }

    console.log(`[expire-jobs] Done. Expired: ${expiredSnap.size}, Emails sent: ${emailsSent}`);
    return NextResponse.json({ expired: expiredSnap.size, emailsSent });
  } catch (err: any) {
    console.error('[expire-jobs] Fatal error:', err);
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}

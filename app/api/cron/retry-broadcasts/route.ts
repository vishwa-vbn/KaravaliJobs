import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { sendTelegramJobPost } from '@/lib/server/telegram';

export const dynamic = 'force-dynamic';


/**
 * GET /api/cron/retry-broadcasts
 *
 * Triggered by Vercel Cron (see vercel.json).
 * Protected by CRON_SECRET header.
 *
 * What it does:
 * 1. Queries broadcastLog where status == 'failed' and attempts < 5.
 * 2. Retries each failed Telegram broadcast.
 * 3. Updates status to 'sent' or increments attempts on continued failure.
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

  console.log('[retry-broadcasts] Running retry sweep...');

  try {
    // ── 1. Find failed broadcasts eligible for retry ──────────────────────────
    const failedSnap = await adminDb
      .collection('broadcastLog')
      .where('status', '==', 'failed')
      .where('attempts', '<', 5)
      .get();

    if (failedSnap.empty) {
      console.log('[retry-broadcasts] No failed broadcasts to retry.');
      return NextResponse.json({ retried: 0, recovered: 0 });
    }

    console.log(`[retry-broadcasts] Found ${failedSnap.size} failed broadcast(s) to retry.`);

    let recovered = 0;

    for (const docSnap of failedSnap.docs) {
      const logData = docSnap.data();
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://karavali-jobs.com';

      try {
        // Re-fetch job data for accurate details
        const jobSnap = await adminDb.collection('jobs').doc(logData.jobId).get();
        if (!jobSnap.exists) {
          // Job was deleted — mark as permanently failed
          await docSnap.ref.update({ status: 'skipped', lastError: 'Job document not found' });
          continue;
        }

        const jobData = jobSnap.data()!;

        await sendTelegramJobPost({
          title: jobData.title,
          companyName: jobData.companyName,
          location: jobData.location,
          jobType: jobData.jobType,
          salaryRange: jobData.salaryRange,
          link: `${siteUrl}/jobs/${logData.jobId}`,
        });

        await docSnap.ref.update({
          status: 'sent',
          lastError: null,
          attempts: (logData.attempts || 1) + 1,
          retriedAt: new Date(),
        });

        recovered++;
      } catch (retryErr: any) {
        const newAttempts = (logData.attempts || 1) + 1;
        await docSnap.ref.update({
          attempts: newAttempts,
          lastError: retryErr?.message || String(retryErr),
          status: newAttempts >= 5 ? 'permanently_failed' : 'failed',
          retriedAt: new Date(),
        });
        console.error(`[retry-broadcasts] Retry failed for log ${docSnap.id}:`, retryErr);
      }
    }

    console.log(`[retry-broadcasts] Done. Retried: ${failedSnap.size}, Recovered: ${recovered}`);
    return NextResponse.json({ retried: failedSnap.size, recovered });
  } catch (err: any) {
    console.error('[retry-broadcasts] Fatal error:', err);
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}

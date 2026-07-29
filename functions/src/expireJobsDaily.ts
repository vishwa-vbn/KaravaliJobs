import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { sendExpiryNotice } from './lib/brevoClient';

// Initialize firebase admin sdk inside functions context if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

export const expireJobsDaily = onSchedule('every 24 hours', async (_event) => {
  logger.info('Running expireJobsDaily lifecycle check...');
  const db = admin.firestore();
  const now = new Date();

  try {
    // 1. Query active jobs that have passed their expiresAt timestamp
    const expiredJobsQuery = db
      .collection('jobs')
      .where('status', '==', 'active')
      .where('expiresAt', '<=', now);

    const snapshot = await expiredJobsQuery.get();

    if (snapshot.empty) {
      logger.info('No active listings found past expiry bounds.');
      return;
    }

    logger.info(`Found ${snapshot.size} expired listings to update.`);
    const batch = db.batch();

    // 2. Queue batch updates and collect notification details
    snapshot.docs.forEach((docSnap) => {
      batch.update(docSnap.ref, { status: 'expired' });
    });

    await batch.commit();
    logger.info('Successfully marked jobs as expired.');

    // 3. For each expired listing, notify the provider (wrapped in try/catch to avoid halting)
    for (const docSnap of snapshot.docs) {
      const jobData = docSnap.data();
      const providerId = jobData.providerId;

      try {
        const userDoc = await db.collection('users').doc(providerId).get();
        if (userDoc.exists) {
          const userData = userDoc.data()!;
          const email = userData.email;
          const displayName = userData.displayName || 'Provider';

          if (email) {
            await sendExpiryNotice(email, displayName, jobData.title, docSnap.id);
          }
        }
      } catch (err) {
        logger.error(`Failed to send expiry notice for jobId: ${docSnap.id}`, err);
      }
    }
  } catch (error) {
    logger.error('Failed to execute expireJobsDaily task:', error);
  }
});

import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { sendNewJobAlert } from './lib/brevoClient';

// Initialize firebase admin sdk if not done
if (!admin.apps.length) {
  admin.initializeApp();
}

export const onNewJobCreated = onDocumentCreated('jobs/{jobId}', async (event) => {
  const jobId = event.params.jobId;
  const snap = event.data;

  if (!snap) {
    logger.warn(`Triggered onNewJobCreated for ${jobId} but document payload is missing.`);
    return;
  }

  const jobData = snap.data();
  const db = admin.firestore();

  logger.info(`Processing notifications for new job: ${jobData.title} (${jobId})`);

  try {
    // 1. Fetch user alerts list
    const subscribersSnap = await db
      .collection('users')
      .where('subscribedToAlerts', '==', true)
      .get();

    if (!subscribersSnap.empty) {
      const subscriberEmails = subscribersSnap.docs
        .map((doc) => doc.data().email)
        .filter((email): email is string => !!email);

      if (subscriberEmails.length > 0) {
        logger.info(`Sending alerts to ${subscriberEmails.length} subscribers.`);
        await sendNewJobAlert(
          subscriberEmails,
          jobData.title,
          jobData.companyName,
          jobId,
          jobData.location
        );
      }
    } else {
      logger.info('No active alert subscriptions found.');
    }

    // 2. Queue social broadcast payload
    const queueRef = db.collection('channelsQueue');
    const broadcastPayload = {
      jobId,
      channels: ['telegram', 'whatsapp', 'instagram'],
      status: 'pending',
      attempts: 0,
      lastError: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      payload: {
        title: jobData.title,
        companyName: jobData.companyName,
        location: jobData.location,
        link: `https://karavali-jobs.com/jobs/${jobId}`,
      },
    };

    await queueRef.add(broadcastPayload);
    logger.info(`Successfully queued social broadcast payload for jobId: ${jobId}`);
  } catch (error) {
    logger.error(`Error processing new job triggers for ${jobId}:`, error);
  }
});

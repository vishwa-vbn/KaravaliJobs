// retryFailedBroadcasts — Scheduled function (hourly)
// Phase 4 implementation
//
// Responsibilities (ARCHITECTURE.md §5):
// 1. Query channelsQueue where any channel status == 'failed' AND attempts < 5
// 2. Retry with exponential backoff
// 3. If attempts >= 5: mark permanently failed, log for manual review in /admin/broadcast-log
//
// AGENT.md §3 DoD: try/catch; failures don't throw unhandled.
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { sendTelegramMessage } from './lib/telegramClient';
import { sendWhatsAppMessage } from './lib/whatsappClient';
import { sendInstagramMessage } from './lib/instagramClient';

if (!admin.apps.length) {
  admin.initializeApp();
}

export const retryFailedBroadcasts = onSchedule('every 60 minutes', async (_event) => {
  const db = admin.firestore();
  logger.info('Running retryFailedBroadcasts scheduled task');

  try {
    const failedDocsSnap = await db
      .collection('channelsQueue')
      .where('status', '==', 'failed')
      .where('attempts', '<', 5)
      .get();

    if (failedDocsSnap.empty) {
      logger.info('No failed broadcasts to retry.');
      return;
    }

    for (const docSnap of failedDocsSnap.docs) {
      const data = docSnap.data();
      const payload = data.payload;
      const channels = data.channels || [];
      const statuses: Record<string, string> = data.channelStatuses || {};
      let overallSuccess = true;
      let errorMsg = '';

      logger.info(`Retrying broadcast for doc: ${docSnap.id}`);

      for (const channel of channels) {
        if (statuses[channel] === 'sent') {
          continue;
        }

        try {
          if (channel === 'telegram') {
            await sendTelegramMessage(payload);
          } else if (channel === 'whatsapp') {
            await sendWhatsAppMessage(payload);
          } else if (channel === 'instagram') {
            await sendInstagramMessage(payload);
          }
          statuses[channel] = 'sent';
        } catch (err: any) {
          logger.error(`Retry failed for channel ${channel} on doc ${docSnap.id}:`, err);
          statuses[channel] = 'failed';
          overallSuccess = false;
          errorMsg += `${channel}: ${err?.message || err}; `;
        }
      }

      await docSnap.ref.update({
        channelStatuses: statuses,
        status: overallSuccess ? 'sent' : 'failed',
        attempts: admin.firestore.FieldValue.increment(1),
        lastError: errorMsg || null,
      });
    }
  } catch (error) {
    logger.error('Error running retryFailedBroadcasts:', error);
  }
});

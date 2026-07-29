// broadcastNewJob — Firestore trigger on channelsQueue/{docId} create
// Phase 4 implementation
//
// Responsibilities (ARCHITECTURE.md §5):
// 1. For each channel in doc.channels: call the matching client
// 2. Per-channel try/catch — one channel failing must NOT block others
// 3. Update per-channel status independently in the channelsQueue doc
// 4. Instagram fallback: if Graph API not configured, send caption+image
//    to ADMIN_NOTIFY_TELEGRAM_CHAT_ID for manual posting (SKILLS.md §Social Broadcast)
//
// AGENT.md §3 DoD: failures don't throw unhandled — especially this function.
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { sendTelegramMessage } from './lib/telegramClient';
import { sendWhatsAppMessage } from './lib/whatsappClient';
import { sendInstagramMessage } from './lib/instagramClient';

if (!admin.apps.length) {
  admin.initializeApp();
}

export const broadcastNewJob = onDocumentCreated('channelsQueue/{docId}', async (event) => {
  const docId = event.params.docId;
  const snap = event.data;

  if (!snap) {
    logger.warn(`broadcastNewJob triggered for ${docId} but document payload is missing.`);
    return;
  }

  const data = snap.data();
  const payload = data.payload;
  const channels = data.channels || [];

  logger.info(`Starting broadcast for queue doc ${docId} with channels:`, channels);

  const db = admin.firestore();
  const docRef = db.collection('channelsQueue').doc(docId);

  const statuses: Record<string, string> = data.channelStatuses || {};
  let overallSuccess = true;
  let errorMsg = '';

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
      logger.error(`Failed to broadcast to channel ${channel}:`, err);
      statuses[channel] = 'failed';
      overallSuccess = false;
      errorMsg += `${channel}: ${err?.message || err}; `;
    }
  }

  await docRef.update({
    channelStatuses: statuses,
    status: overallSuccess ? 'sent' : 'failed',
    attempts: admin.firestore.FieldValue.increment(1),
    lastError: errorMsg || null,
  });
});

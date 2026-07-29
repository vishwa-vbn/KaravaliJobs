import { logger } from 'firebase-functions/v2';

export interface BroadcastPayload {
  title: string;
  companyName: string;
  location: string;
  link: string;
}

export async function sendWhatsAppMessage(job: BroadcastPayload): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const adminChatId = process.env.ADMIN_NOTIFY_TELEGRAM_CHAT_ID;

  if (!token || !adminChatId) {
    logger.warn('WhatsApp manual fallback skipped: TELEGRAM_BOT_TOKEN or ADMIN_NOTIFY_TELEGRAM_CHAT_ID not configured.');
    return;
  }

  const text = `📢 *WhatsApp Broadcast Ready* 📢\n\n` +
               `*Copy-Paste Content for WhatsApp Channel/Groups:*\n\n` +
               `🚨 New Job: *${job.title}* at *${job.companyName}* (${job.location})\n` +
               `👉 Apply here: ${job.link}`;

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: adminChatId,
      text: text,
      parse_mode: 'Markdown',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`WhatsApp fallback API responded with status ${response.status}: ${errorText}`);
  }
}

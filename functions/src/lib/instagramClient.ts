import { logger } from 'firebase-functions/v2';

export interface BroadcastPayload {
  title: string;
  companyName: string;
  location: string;
  link: string;
}

export async function sendInstagramMessage(job: BroadcastPayload): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const adminChatId = process.env.ADMIN_NOTIFY_TELEGRAM_CHAT_ID;

  if (!token || !adminChatId) {
    logger.warn('Instagram manual fallback skipped: TELEGRAM_BOT_TOKEN or ADMIN_NOTIFY_TELEGRAM_CHAT_ID not configured.');
    return;
  }

  const text = `📸 *Instagram Staged Post* 📸\n\n` +
               `*Suggested Caption for Instagram post/story:*\n\n` +
               `We are hiring! 🚀\n` +
               `Role: *${job.title}*\n` +
               `Company: *${job.companyName}*\n` +
               `Location: *${job.location}*\n\n` +
               `👉 Link in bio to apply: ${job.link}\n` +
               `#udupi #mangalore #karavalijobs #hiring`;

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
    throw new Error(`Instagram fallback API responded with status ${response.status}: ${errorText}`);
  }
}

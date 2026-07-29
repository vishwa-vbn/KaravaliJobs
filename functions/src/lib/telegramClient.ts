import { logger } from 'firebase-functions/v2';

export interface BroadcastPayload {
  title: string;
  companyName: string;
  location: string;
  link: string;
}

export async function sendTelegramMessage(job: BroadcastPayload): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const channelId = process.env.TELEGRAM_CHANNEL_ID;

  if (!token || !channelId) {
    logger.warn('Telegram broadcasting skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHANNEL_ID not configured.');
    return;
  }

  const text = `🚨 *New Job Posting* 🚨\n\n` +
               `*Title:* ${job.title}\n` +
               `*Company:* ${job.companyName}\n` +
               `*Location:* ${job.location}\n\n` +
               `👉 [Apply Here](${job.link})`;

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: channelId,
      text: text,
      parse_mode: 'Markdown',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Telegram API responded with status ${response.status}: ${errorText}`);
  }
}

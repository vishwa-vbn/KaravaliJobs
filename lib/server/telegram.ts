/**
 * Telegram Bot API Client — Server-side only
 * Ported from functions/src/lib/telegramClient.ts
 * Uses native fetch; no firebase-functions dependency.
 */

export interface BroadcastPayload {
  title: string;
  companyName: string;
  location: string;
  jobType?: string;
  salaryRange?: string;
  link: string;
  tags?: string[];
}

/**
 * Posts a new job notification to the configured Telegram channel.
 */
export async function sendTelegramJobPost(job: BroadcastPayload): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const channelId = process.env.TELEGRAM_CHANNEL_ID;

  if (!token || !channelId) {
    console.warn('[Telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_CHANNEL_ID not set — broadcast skipped.');
    return;
  }

  const salaryLine = job.salaryRange ? `💰 <b>Salary:</b> ${job.salaryRange}\n` : '';
  const typeLine = job.jobType ? `🕐 <b>Type:</b> ${job.jobType}\n` : '';

  // Escape HTML helper
  const esc = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const tagsLine = job.tags && job.tags.length > 0
    ? '\n' + job.tags.map(tag => `#${esc(tag.trim())}`).join(' ') + '\n'
    : '';

  const text =
    `🚨 <b>New Job Alert</b> 🚨\n\n` +
    `📌 <b>${esc(job.title)}</b>\n` +
    `🏢 <b>Company:</b> ${esc(job.companyName)}\n` +
    `📍 <b>Location:</b> ${esc(job.location)}\n` +
    esc(typeLine) +
    esc(salaryLine) +
    tagsLine +
    `\n👉 <a href="${job.link}">View & Apply</a>`;

  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: channelId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`[Telegram] API error ${response.status}: ${errText}`);
  }

  console.log(`[Telegram] Posted job "${job.title}" to channel ${channelId}.`);
}

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// Helper to escape HTML tags for Telegram HTML parse mode
function esc(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * POST /api/telegram/webhook
 *
 * Exposes a webhook endpoint for the Telegram Bot API.
 * Handles commands: /start, /latest, /search <query>
 */
export async function POST(req: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error('[Telegram Webhook] TELEGRAM_BOT_TOKEN not configured.');
    return NextResponse.json({ error: 'Telegram Bot Token not configured' }, { status: 500 });
  }

  try {
    const update = await req.json();
    console.log('[Telegram Webhook] Received update:', JSON.stringify(update));

    const message = update.message;
    if (!message || !message.text) {
      // Return 200 to acknowledge non-text or empty events from Telegram
      return NextResponse.json({ success: true, message: 'No text message to process' });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();

    let replyText = '';

    if (text.startsWith('/start')) {
      replyText = `Welcome to <b>Karavali Jobs</b> Bot! 🚀\n\n` +
                  `I can help you find localized job listings in the Udupi & Mangalore region.\n\n` +
                  `<b>Available Commands:</b>\n` +
                  `• /latest - View the 5 most recent job listings\n` +
                  `• /search [keyword] - Search active jobs (e.g. <code>/search developer</code>)\n\n` +
                  `Visit our website to browse all listings: <a href="https://karavali-jobs.com">karavali-jobs.com</a>`;
    } 
    else if (text.startsWith('/latest')) {
      try {
        const jobsSnap = await adminDb
          .collection('jobs')
          .where('status', '==', 'active')
          .orderBy('createdAt', 'desc')
          .limit(5)
          .get();

        if (jobsSnap.empty) {
          replyText = 'There are no active job listings at the moment. Check back later!';
        } else {
          replyText = `🔥 <b>Latest Job Listings:</b>\n\n`;
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://karavali-jobs.com';
          
          jobsSnap.docs.forEach((docSnap: any, index: number) => {
            const data = docSnap.data();
            replyText += `${index + 1}. <b>${esc(data.title)}</b>\n` +
                         `🏢 ${esc(data.companyName)} | 📍 ${esc(data.location)}\n` +
                         `👉 <a href="${siteUrl}/jobs/${docSnap.id}">View Details</a>\n\n`;
          });
        }
      } catch (dbErr: any) {
        console.error('[Telegram Webhook] Firestore query failed for /latest:', dbErr);
        replyText = 'Sorry, I encountered an error fetching the latest jobs. Please try again later.';
      }
    } 
    else if (text.startsWith('/search')) {
      const queryStr = text.substring(7).trim();
      if (!queryStr) {
        replyText = 'Please provide a search term. Example: <code>/search driver</code> or <code>/search manager</code>';
      } else {
        try {
          // Fetch active jobs (limit to 50 for in-memory filtering since firestore search is limited)
          const jobsSnap = await adminDb
            .collection('jobs')
            .where('status', '==', 'active')
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();

          const normalizedQuery = queryStr.toLowerCase();
          const matches = jobsSnap.docs
            .map((doc: any) => ({ id: doc.id, ...doc.data() }))
            .filter((job: any) => 
              job.title?.toLowerCase().includes(normalizedQuery) ||
              job.companyName?.toLowerCase().includes(normalizedQuery) ||
              job.description?.toLowerCase().includes(normalizedQuery)
            )
            .slice(0, 5); // Return top 5 matches

          if (matches.length === 0) {
            replyText = `No active jobs found matching "<b>${esc(queryStr)}</b>". Try searching for another keyword or check our website!`;
          } else {
            replyText = `🔍 <b>Search Results for "${esc(queryStr)}":</b>\n\n`;
            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://karavali-jobs.com';

            matches.forEach((job: any, index: number) => {
              replyText += `${index + 1}. <b>${esc(job.title)}</b>\n` +
                           `🏢 ${esc(job.companyName)} | 📍 ${esc(job.location)}\n` +
                           `👉 <a href="${siteUrl}/jobs/${job.id}">View Details</a>\n\n`;
            });
          }
        } catch (dbErr: any) {
          console.error('[Telegram Webhook] Firestore query failed for /search:', dbErr);
          replyText = 'Sorry, I encountered an error running the search. Please try again.';
        }
      }
    } 
    else {
      // Default fallback
      replyText = `Sorry, I didn't recognize that command.\n\n` +
                  `Try:\n` +
                  `• /latest - Get recent jobs\n` +
                  `• /search [keyword] - Find specific postings`;
    }

    // Send reply via Telegram sendMessage API
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: replyText,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Telegram Webhook] API response error: ${response.status}: ${errText}`);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Telegram Webhook] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

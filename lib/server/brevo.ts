/**
 * Brevo Transactional Email Client — Server-side only
 * Ported from functions/src/lib/brevoClient.ts
 * Uses native fetch; no firebase-functions dependency.
 */

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'no-reply@karavali-jobs.com';
const SENDER_NAME = 'Karavali Jobs';

async function sendEmail({
  to,
  subject,
  htmlContent,
}: {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
}): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    console.warn('[Brevo] BREVO_API_KEY not configured — email sending skipped.');
    return;
  }

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { email: SENDER_EMAIL, name: SENDER_NAME },
      to,
      subject,
      htmlContent,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`[Brevo] HTTP ${response.status}: ${errText}`);
  }

  console.log(`[Brevo] Sent "${subject}" to ${to.length} recipient(s).`);
}

/**
 * Sends a job expiry notice to a job provider.
 */
export async function sendExpiryNotice(
  toEmail: string,
  providerName: string,
  jobTitle: string,
  jobId: string
): Promise<void> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://karavali-jobs.com';
  const jobLink = `${siteUrl}/jobs/${jobId}`;
  const renewalLink = `${siteUrl}/dashboard`;

  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #f0f0f0; border-radius: 12px;">
      <h2 style="color: #4f46e5; margin-top: 0;">Your Job Listing Has Expired</h2>
      <p>Hello ${providerName},</p>
      <p>Your job listing for <strong>${jobTitle}</strong> on Karavali Jobs has expired after the standard 30-day lifecycle.</p>
      <p>If you are still hiring, you can renew this listing for another 30 days from your employer dashboard:</p>
      <a href="${renewalLink}" style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">
        Go to Dashboard &rarr;
      </a>
      <hr style="border:0;border-top:1px solid #f0f0f0;margin:24px 0;" />
      <p style="font-size:12px;color:#94a3b8;">
        View the expired listing: <a href="${jobLink}">${jobLink}</a><br/>
        You are receiving this because you posted a job on Karavali Jobs.
      </p>
    </div>
  `;

  await sendEmail({
    to: [{ email: toEmail, name: providerName }],
    subject: `Your listing "${jobTitle}" has expired — Karavali Jobs`,
    htmlContent,
  });
}

/**
 * Sends a new job alert to subscribed seekers (batched, 50 recipients per call).
 */
export async function sendNewJobAlert(
  toEmails: string[],
  jobTitle: string,
  companyName: string,
  jobId: string,
  location: string
): Promise<void> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://karavali-jobs.com';
  const jobLink = `${siteUrl}/jobs/${jobId}`;
  const unsubscribeLink = `${siteUrl}/alerts-signup`;

  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #f0f0f0; border-radius: 12px;">
      <h2 style="color: #4f46e5; margin-top: 0;">New Job Opportunity in Karavali</h2>
      <p>Hello,</p>
      <p>A new job matching local listings in your area has just been posted:</p>
      <div style="background:#f8fafc;padding:16px;border-radius:8px;margin:16px 0;border:1px solid #e2e8f0;">
        <h3 style="margin:0 0 4px 0;color:#0f172a;">${jobTitle}</h3>
        <p style="margin:0;color:#475569;font-weight:600;">${companyName} &bull; ${location}</p>
      </div>
      <a href="${jobLink}" style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:bold;">
        View Job &amp; Apply &rarr;
      </a>
      <hr style="border:0;border-top:1px solid #f0f0f0;margin:24px 0;" />
      <p style="font-size:11px;color:#94a3b8;">
        You are receiving this because you subscribed to job alerts on Karavali Jobs.<br/>
        <a href="${unsubscribeLink}" style="color:#94a3b8;">Unsubscribe from alerts</a>
      </p>
    </div>
  `;

  // Batch to stay within Brevo free-tier rate limits
  const batchSize = 50;
  for (let i = 0; i < toEmails.length; i += batchSize) {
    const chunk = toEmails.slice(i, i + batchSize).map((email) => ({ email }));
    await sendEmail({
      to: chunk,
      subject: `New Job Alert: ${jobTitle} in ${location} — Karavali Jobs`,
      htmlContent,
    });
  }
}

/**
 * Sends an email notification to the super admin when a job is flagged for explicit content.
 */
export async function sendAdminFlaggedNotice(
  adminEmail: string,
  jobTitle: string,
  companyName: string,
  jobId: string
): Promise<void> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://karavali-jobs.com';
  const adminModerationUrl = `${siteUrl}/admin/moderation`;

  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #fee2e2; border-radius: 12px; background: #fffafb;">
      <h2 style="color: #dc2626; margin-top: 0;">🚨 Alert: Job Flagged for Review</h2>
      <p>Hello Admin,</p>
      <p>A new job listing has been automatically flagged and suspended due to suspected explicit or restricted content:</p>
      <div style="background:#fef2f2;padding:16px;border-radius:8px;margin:16px 0;border:1px solid #fee2e2;">
        <h3 style="margin:0 0 4px 0;color:#991b1b;">${jobTitle}</h3>
        <p style="margin:0;color:#7f1d1d;font-weight:600;">Company: ${companyName}</p>
        <p style="margin:4px 0 0 0;font-size:12px;color:#b91c1c;">Job ID: ${jobId}</p>
      </div>
      <p>Please log in to the admin panel to review, edit, approve, or permanently delete this listing:</p>
      <a href="${adminModerationUrl}" style="display:inline-block;background:#dc2626;color:#fff;padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">
        Go to Admin Moderation &rarr;
      </a>
    </div>
  `;

  await sendEmail({
    to: [{ email: adminEmail, name: 'Admin' }],
    subject: `🚨 Flagged Job: "${jobTitle}" at ${companyName} — Karavali Jobs`,
    htmlContent,
  });
}


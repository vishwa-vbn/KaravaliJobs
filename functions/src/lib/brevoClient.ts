import { logger } from 'firebase-functions/v2';

/**
 * Brevo REST Email Client
 * Uses native fetch as per Phase 2 guidelines
 */
export async function sendEmail({
  to,
  subject,
  htmlContent,
}: {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
}): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'no-reply@karavali-jobs.com';

  if (!apiKey) {
    logger.warn('Brevo API key is not configured. Email sending skipped.');
    return;
  }

  const payload = {
    sender: { email: senderEmail, name: 'Karavali Jobs' },
    to,
    subject,
    htmlContent,
  };

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Brevo HTTP Error ${response.status}: ${errText}`);
    }

    logger.info(`Successfully dispatched email: "${subject}" to ${to.length} recipients.`);
  } catch (error) {
    logger.error('Failed to send email through Brevo API:', error);
    throw error;
  }
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
  const jobLink = `https://karavali-jobs.com/jobs/${jobId}`;
  const renewalLink = `https://karavali-jobs.com/dashboard`;

  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 12px;">
      <h2 style="color: #1e3a8a;">Your Job Listing Has Expired</h2>
      <p>Hello ${providerName},</p>
      <p>Your job listing for <strong>${jobTitle}</strong> on Karavali Jobs has expired after the standard 30-day lifecycle.</p>
      <p>If you are still hiring, you can renew this listing for another 30 days directly from your employer dashboard:</p>
      <a href="${renewalLink}" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 15px 0;">Go to Dashboard</a>
      <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">You can view the expired listing details at: <a href="${jobLink}">${jobLink}</a></p>
    </div>
  `;

  await sendEmail({
    to: [{ email: toEmail, name: providerName }],
    subject: `Expired: ${jobTitle} Listing on Karavali Jobs`,
    htmlContent,
  });
}

/**
 * Sends a job alert summary to subscribed candidate accounts.
 */
export async function sendNewJobAlert(
  toEmails: string[],
  jobTitle: string,
  companyName: string,
  jobId: string,
  location: string
): Promise<void> {
  const jobLink = `https://karavali-jobs.com/jobs/${jobId}`;

  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 12px;">
      <h2 style="color: #1e3a8a;">New Job Opportunity in Karavali</h2>
      <p>Hello,</p>
      <p>A new job matching your preferences has been posted on Karavali Jobs:</p>
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #e2e8f0;">
        <h3 style="margin: 0 0 5px 0; color: #0f172a;">${jobTitle}</h3>
        <p style="margin: 0; font-weight: bold; color: #475569;">${companyName} • ${location}</p>
      </div>
      <a href="${jobLink}" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;">View Job Details &amp; Apply</a>
      <hr style="border: 0; border-top: 1px solid #f0f0f0; margin-top: 30px;" />
      <p style="font-size: 11px; color: #94a3b8;">You are receiving this email because you subscribed to daily alerts. You can unsubscribe at any time from your alert preferences settings page.</p>
    </div>
  `;

  // We chunk batch sends to stay within rate limits if recipients exceed a threshold
  const batchSize = 50;
  for (let i = 0; i < toEmails.length; i += batchSize) {
    const chunk = toEmails.slice(i, i + batchSize).map((email) => ({ email }));
    await sendEmail({
      to: chunk,
      subject: `New Job Alert: ${jobTitle} in ${location}`,
      htmlContent,
    });
  }
}

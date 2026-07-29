export const metadata = {
  title: 'Privacy Policy',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen py-12 px-6 max-w-3xl mx-auto bg-white">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Privacy Policy</h1>
      <p className="text-sm text-slate-500 mb-8">Last Updated: July 2026</p>

      <div className="prose prose-slate max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold text-slate-800">1. Introduction</h2>
          <p className="text-slate-600 leading-relaxed">
            Welcome to Karavali Jobs. This Privacy Policy outlines how we collect, use, and protect your personal information in compliance with the Digital Personal Data Protection Act, 2023 (DPDP Act).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800">2. Information We Collect</h2>
          <p className="text-slate-600 leading-relaxed">
            <strong>When browsing:</strong> We do not require registration to browse jobs. We may collect non-identifiable usage data (such as pages visited).<br/><br/>
            <strong>When signing in:</strong> We use Firebase Authentication (Google Sign-In). We collect your name, email address, and profile picture to provide account functionality.<br/><br/>
            <strong>When applying:</strong> Applications occur outside our platform (via phone or direct email to the employer). We do not collect or store your resume or application data.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800">3. Cookies and Advertising</h2>
          <p className="text-slate-600 leading-relaxed">
            We partner with third-party advertising networks (such as Adsterra and Google AdSense) to keep this service free. These partners use cookies to serve personalized advertisements based on your prior visits to our website or other websites on the internet.
            <br/><br/>
            You can choose to accept or reject ad-tracking cookies using the consent banner on your first visit.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800">4. Third-Party Services</h2>
          <p className="text-slate-600 leading-relaxed">
            We use Brevo (Sendinblue) to deliver transactional emails (like job alerts). Your email address is shared with Brevo solely for the purpose of delivering these messages. You can unsubscribe from job alerts at any time using the link in the footer of our emails.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800">5. Your Rights</h2>
          <p className="text-slate-600 leading-relaxed">
            Under the DPDP Act, you have the right to request access to your data, request correction of your data, or request deletion of your account. You may exercise these rights by contacting us at privacy@karavali-jobs.com.
          </p>
        </section>
      </div>
    </main>
  );
}

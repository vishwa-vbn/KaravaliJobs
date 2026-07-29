export const metadata = {
  title: 'Terms of Service',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen py-12 px-6 max-w-3xl mx-auto bg-white">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Terms of Service</h1>
      <p className="text-sm text-slate-500 mb-8">Last Updated: July 2026</p>

      <div className="prose prose-slate max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold text-slate-800">1. Acceptance of Terms</h2>
          <p className="text-slate-600 leading-relaxed">
            By accessing and using Karavali Jobs, you accept and agree to be bound by the terms and provision of this agreement.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800">2. Service Description</h2>
          <p className="text-slate-600 leading-relaxed">
            Karavali Jobs is a local classifieds platform acting as a bridge between job providers and job seekers in the Udupi and Mangalore regions. We do not act as a recruitment agency, employer, or intermediary in the actual hiring process.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800">3. Job Listings and Liability</h2>
          <p className="text-slate-600 leading-relaxed">
            All job listings are posted by third-party providers. We do not verify the authenticity, safety, or legality of the jobs posted. Job seekers are advised to exercise caution and perform their own due diligence before sharing personal information or attending interviews.
            <br/><br/>
            <strong>Karavali Jobs is not liable for any financial loss, damages, or disputes arising from interactions initiated through our platform.</strong>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800">4. Provider Responsibilities</h2>
          <p className="text-slate-600 leading-relaxed">
            Job Providers agree not to post fake, misleading, or illegal job listings. We reserve the right to remove any job listing or suspend any account at our discretion without prior notice if we suspect fraud or policy violations.
          </p>
        </section>
      </div>
    </main>
  );
}

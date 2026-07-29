export const metadata = {
  title: 'About Us',
};

export default function AboutPage() {
  return (
    <main className="min-h-screen py-12 px-6 max-w-3xl mx-auto bg-white">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">About Karavali Jobs</h1>
      
      <div className="prose prose-slate max-w-none space-y-6">
        <p className="text-slate-600 leading-relaxed text-lg">
          Karavali Jobs was built with a simple mission: to connect local talent with local opportunities in the Udupi and Mangalore regions.
        </p>

        <section>
          <h2 className="text-xl font-semibold text-slate-800">The Problem</h2>
          <p className="text-slate-600 leading-relaxed">
            Finding a job in Tier-2 cities shouldn't require navigating complex national job portals designed for corporate tech hubs. Local businesses—from retail shops to regional IT firms and healthcare providers—need a direct, zero-friction way to reach candidates in their own backyard.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800">Our Solution</h2>
          <p className="text-slate-600 leading-relaxed">
            We built a hyper-local, fast, and free-to-browse platform. Job seekers can find part-time, remote, or permanent jobs and apply instantly without creating an account or uploading a resume. We also push these jobs directly to where the community already spends their time: WhatsApp and Telegram.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800">Supported by Ads</h2>
          <p className="text-slate-600 leading-relaxed">
            To keep this platform 100% free for both job seekers and local businesses, we utilize carefully placed, non-intrusive display advertisements. This allows us to cover our server and maintenance costs while keeping the core service accessible to everyone.
          </p>
        </section>
      </div>
    </main>
  );
}

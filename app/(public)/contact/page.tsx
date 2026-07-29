export const metadata = {
  title: 'Contact Us',
};

export default function ContactPage() {
  return (
    <main className="min-h-screen py-12 px-6 max-w-3xl mx-auto bg-white">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Contact Us</h1>
      
      <div className="prose prose-slate max-w-none space-y-6">
        <p className="text-slate-600 leading-relaxed text-lg">
          Have a question, feedback, or need help with a job listing? We're here to help.
        </p>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 mt-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-2 mt-0">General Support</h2>
          <p className="text-slate-600 mb-4">
            For general inquiries, account issues, or reporting a fraudulent job listing:
          </p>
          <a href="mailto:support@karavali-jobs.com" className="text-indigo-600 font-medium hover:underline">
            support@karavali-jobs.com
          </a>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 mt-4">
          <h2 className="text-lg font-semibold text-slate-800 mb-2 mt-0">Business & Advertising</h2>
          <p className="text-slate-600 mb-4">
            For partnership opportunities or direct advertising inquiries:
          </p>
          <a href="mailto:business@karavali-jobs.com" className="text-indigo-600 font-medium hover:underline">
            business@karavali-jobs.com
          </a>
        </div>
      </div>
    </main>
  );
}

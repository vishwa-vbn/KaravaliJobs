'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { 
  fetchLocalJobs, 
  createLocalJob,
  deleteLocalJob, 
  LocalJob 
} from '@/lib/jobs/localJobService';

export default function AdminLocalJobsPage() {
  // Existing local jobs list
  const [existingJobs, setExistingJobs] = useState<LocalJob[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(true);

  // Form for single manual entry
  const [manualTitle, setManualTitle] = useState('');
  const [manualCompany, setManualCompany] = useState('Classifieds');
  const [manualLocation, setManualLocation] = useState('Udupi');
  const [manualPhone, setManualPhone] = useState('');
  const [manualSalary, setManualSalary] = useState('');
  const [manualCategory, setManualCategory] = useState<'IT & Software' | 'Sales & Marketing' | 'Finance & Accounts' | 'Healthcare' | 'Office Admin' | 'Hospitality' | 'Retail' | 'Education' | 'Other'>('Other');
  const [manualDescription, setManualDescription] = useState('');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [submittingManual, setSubmittingManual] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadExistingJobs();
  }, []);

  async function loadExistingJobs() {
    setLoadingExisting(true);
    const jobs = await fetchLocalJobs();
    setExistingJobs(jobs);
    setLoadingExisting(false);
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingManual(true);
    setMessage(null);
    try {
      await createLocalJob({
        title: manualTitle,
        companyName: manualCompany,
        location: manualLocation,
        phone: manualPhone,
        salaryRange: manualSalary || undefined,
        category: manualCategory,
        description: manualDescription,
        dateString: manualDate,
      });

      setMessage({ type: 'success', text: 'Manual local job listing created successfully.' });
      setManualTitle('');
      setManualCompany('Classifieds');
      setManualDescription('');
      setManualPhone('');
      setManualSalary('');
      loadExistingJobs();
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Failed to create job manually.' });
    } finally {
      setSubmittingManual(false);
    }
  };

  const handleDeleteJob = async (id: string) => {
    if (!confirm('Are you sure you want to delete this local job?')) return;
    try {
      await deleteLocalJob(id);
      setMessage({ type: 'success', text: 'Local job listing deleted.' });
      loadExistingJobs();
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Failed to delete job.' });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header />

      <main className="flex-grow max-w-6xl w-full mx-auto px-6 py-8">
        {/* Navigation breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-4">
          <Link href="/" className="hover:text-black transition-colors">Home</Link>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <Link href="/admin" className="hover:text-black transition-colors">Admin Console</Link>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-neutral-600 font-medium">Local Jobs</span>
        </div>

        <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Local Newspaper Jobs</h1>
            <p className="text-sm text-slate-500 mt-1">Add and manage local newspaper classified job listings manually.</p>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-xl border text-sm font-semibold flex items-center justify-between ${
            message.type === 'success' 
              ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
              : 'bg-rose-50 border-rose-100 text-rose-800'
          }`}>
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="text-xs opacity-55 hover:opacity-100">✕</button>
          </div>
        )}

        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              Manually Add Local Job
            </h2>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Job Title</label>
                <input
                  type="text"
                  required
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="e.g. Multi-Cuisine Chef"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Company / Newspaper Reference</label>
                <input
                  type="text"
                  required
                  value={manualCompany}
                  onChange={(e) => setManualCompany(e.target.value)}
                  placeholder="Classifieds / Company Name"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Location</label>
                  <input
                    type="text"
                    required
                    value={manualLocation}
                    onChange={(e) => setManualLocation(e.target.value)}
                    placeholder="e.g. Mangalore"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Newspaper Date</label>
                  <input
                    type="date"
                    required
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Phone</label>
                  <input
                    type="text"
                    required
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    placeholder="Contact details"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Category</label>
                  <select
                    value={manualCategory}
                    onChange={(e) => setManualCategory(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none bg-white"
                  >
                    <option value="IT & Software">IT & Software</option>
                    <option value="Sales & Marketing">Sales & Marketing</option>
                    <option value="Finance & Accounts">Finance & Accounts</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Office Admin">Office Admin</option>
                    <option value="Hospitality">Hospitality</option>
                    <option value="Retail">Retail</option>
                    <option value="Education">Education</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Salary (Optional)</label>
                <input
                  type="text"
                  value={manualSalary}
                  onChange={(e) => setManualSalary(e.target.value)}
                  placeholder="e.g. 15,000 - 25,000"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Description & Details</label>
                <textarea
                  rows={4}
                  required
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                  placeholder="Provide full description of the job..."
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submittingManual}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submittingManual ? 'Adding...' : 'Add Job Listing'}
              </button>
            </form>
          </div>
        </div>

        {/* Existing Local Jobs List Table */}
        <div className="mt-8 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Existing Local Jobs ({existingJobs.length})
          </h2>

          {loadingExisting ? (
            <div className="py-6 text-center text-xs text-slate-400 font-semibold animate-pulse">Loading local jobs database...</div>
          ) : existingJobs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-2">Job Title</th>
                    <th className="py-3 px-2">Category</th>
                    <th className="py-3 px-2">Location</th>
                    <th className="py-3 px-2">Phone</th>
                    <th className="py-3 px-2">Newspaper Date</th>
                    <th className="py-3 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {existingJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-2 font-bold text-slate-800">{job.title}</td>
                      <td className="py-3 px-2 font-semibold text-slate-500">{job.category}</td>
                      <td className="py-3 px-2 text-slate-600">{job.location}</td>
                      <td className="py-3 px-2 text-slate-600 font-medium">{job.phone}</td>
                      <td className="py-3 px-2 text-slate-500 font-medium">{job.dateString}</td>
                      <td className="py-3 px-2 text-right">
                        <button
                          onClick={() => handleDeleteJob(job.id)}
                          className="text-red-500 hover:text-red-700 font-bold transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs font-semibold">No local jobs found in database.</div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

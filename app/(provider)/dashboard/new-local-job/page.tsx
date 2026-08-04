'use client';

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { createLocalJob } from '@/lib/jobs/localJobService';
import type { RootState } from '@/lib/redux/store';

export default function NewLocalJobPage() {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);

  // Form states
  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('Classifieds');
  const [location, setLocation] = useState('Udupi');
  const [phone, setPhone] = useState('');
  const [salary, setSalary] = useState('');
  const [category, setCategory] = useState<'IT & Software' | 'Sales & Marketing' | 'Finance & Accounts' | 'Healthcare' | 'Office Admin' | 'Hospitality' | 'Retail' | 'Education' | 'Other'>('Other');
  const [description, setDescription] = useState('');
  const [dateString, setDateString] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to post a local job listing.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await createLocalJob({
        title,
        companyName,
        location,
        phone,
        salaryRange: salary || undefined,
        category,
        description,
        dateString,
        providerId: user.uid, // attach providerId so they can manage it
      } as any);

      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to create local job listing.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header />

      <main className="flex-grow max-w-2xl w-full mx-auto px-6 py-8">
        <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-4">
          <Link href="/dashboard" className="hover:text-black transition-colors">Dashboard</Link>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-neutral-600 font-medium">Post Local Job</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <h1 className="text-xl font-black text-slate-900 tracking-tight mb-2">Post a Local / Newspaper Classified Job</h1>
          <p className="text-xs text-slate-500 mb-6">Create a quick manual listing for print newspaper classifieds or local offline vacancies.</p>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-sm font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Job Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Delivery Executive"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Company / Reference Name *</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Classifieds / Company Name"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Location *</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Mangalore"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Listing Date *</label>
                <input
                  type="date"
                  required
                  value={dateString}
                  onChange={(e) => setDateString(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Phone *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Contact details"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
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
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="e.g. 15,000 - 25,000"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Description & Details *</label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide full description of the job..."
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Posting...' : 'Post Local Job'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { onboardSeeker } from '@/lib/firebase/authService';
import type { RootState } from '@/lib/redux/store';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function SeekerOnboardingPage() {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);

  const [headline, setHeadline] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [experience, setExperience] = useState('');
  const [education, setEducation] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!headline || !skillsText || !experience || !education) {
      setError('Please fill in all details.');
      return;
    }

    setSubmitting(true);
    setError('');

    const skillsArray = skillsText
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    try {
      await onboardSeeker(user.uid, {
        headline,
        skills: skillsArray,
        experience,
        education,
      });
      // Force reload to update auth context state
      window.location.href = '/';
    } catch (err: any) {
      console.error('Failed to complete seeker profile:', err);
      setError(err?.message || 'Failed to complete registration.');
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      <Header />

      <main className="flex-grow max-w-xl w-full mx-auto px-4 py-12 sm:px-6">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Complete Candidate Profile</h1>
            <p className="text-gray-500 text-sm">Add your professional details to get targeted recommendations.</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-100 font-medium">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Profile Headline *</label>
              <input
                type="text"
                required
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Sales Associate with 2 years of local store experience"
                className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Key Skills * (Comma separated)</label>
              <input
                type="text"
                required
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                placeholder="e.g. Tally, Microsoft Excel, Customer Relations"
                className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Work Experience Details *</label>
              <textarea
                required
                rows={4}
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="Detail your past roles, companies, and responsibilities..."
                className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Education Background *</label>
              <textarea
                required
                rows={2}
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                placeholder="e.g. B.Com from St. Aloysius College, Mangalore"
                className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Saving Profile...' : 'Complete Registration'}
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}

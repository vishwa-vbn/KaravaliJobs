'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { onboardProvider } from '@/lib/firebase/authService';
import type { RootState } from '@/lib/redux/store';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function ProviderOnboardingPage() {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);

  const [companyName, setCompanyName] = useState('');
  const [providerType, setProviderType] = useState<'company' | 'individual'>('company');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [bio, setBio] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!companyName || !phone || !address || !bio) {
      setError('Please fill in all required details (*).');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await onboardProvider(user.uid, {
        companyName,
        providerType,
        phone,
        website,
        address,
        verificationId,
        bio,
      });
      // Force reload page to fetch fresh auth state
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error('Failed to submit onboarding:', err);
      setError(err?.message || 'Failed to complete registration.');
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      <main className="flex-grow max-w-xl w-full mx-auto px-4 py-12 sm:px-6">
        <div className="space-y-6 py-6">
          <div className="border-b border-neutral-100 pb-5">
            <h1 className="text-xl font-black text-black tracking-tight">Employer Profile Setup</h1>
            <p className="text-neutral-500 text-xs mt-1">Register your hiring credentials for Udupi &amp; Mangalore listings.</p>
          </div>

          {error && (
            <div className="bg-neutral-50 text-red-600 text-xs p-3 rounded-lg border border-neutral-100 font-semibold">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-neutral-400 mb-1.5 uppercase tracking-wider">Provider Entity</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setProviderType('company')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    providerType === 'company'
                      ? 'bg-black border-black text-white'
                      : 'border-neutral-200 text-neutral-600 bg-white hover:bg-neutral-50'
                  }`}
                >
                  🏢 Registered Company
                </button>
                <button
                  type="button"
                  onClick={() => setProviderType('individual')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    providerType === 'individual'
                      ? 'bg-black border-black text-white'
                      : 'border-neutral-200 text-neutral-600 bg-white hover:bg-neutral-50'
                  }`}
                >
                  👤 Individual Recruiter
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-neutral-400 mb-1 uppercase tracking-wider">
                  {providerType === 'company' ? 'Company Name *' : 'Recruiter Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder={providerType === 'company' ? 'e.g. Karavali Tech' : 'e.g. Rajesh Kumar'}
                  className="rounded-lg border border-neutral-200 px-3 py-2 text-xs text-black focus:border-black focus:outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-neutral-400 mb-1 uppercase tracking-wider">GSTIN / Verification ID (Optional)</label>
                <input
                  type="text"
                  value={verificationId}
                  onChange={(e) => setVerificationId(e.target.value)}
                  placeholder="e.g. 29AAAAA1111A1Z1"
                  className="rounded-lg border border-neutral-200 px-3 py-2 text-xs text-black focus:border-black focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-neutral-400 mb-1 uppercase tracking-wider">Contact Phone *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  className="rounded-lg border border-neutral-200 px-3 py-2 text-xs text-black focus:border-black focus:outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-neutral-400 mb-1 uppercase tracking-wider">Website URL (Optional)</label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="e.g. https://company.com"
                  className="rounded-lg border border-neutral-200 px-3 py-2 text-xs text-black focus:border-black focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-neutral-400 mb-1 uppercase tracking-wider">Office / Business Address *</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Hampankatta, Mangalore"
                className="rounded-lg border border-neutral-200 px-3 py-2 text-xs text-black focus:border-black focus:outline-none transition-colors"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-neutral-400 mb-1 uppercase tracking-wider">Company Description / Bio *</label>
              <textarea
                required
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Briefly describe your business and hiring domains..."
                className="rounded-lg border border-neutral-200 px-3 py-2 text-xs text-black focus:border-black focus:outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-black hover:bg-neutral-900 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Creating Profile...' : 'Complete Profile Setup'}
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}

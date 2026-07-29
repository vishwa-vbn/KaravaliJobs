// Cookie/Ad consent banner — required before loading any ad network scripts.
// On accept: dispatches adConsentSlice.setConsented(true) + persists to localStorage.
// On reject: ad scripts never load this session.
// India DPDP Act + required by Adsterra, AdSense, and all major ad networks.
'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setConsented } from '@/lib/redux/slices/adConsentSlice';
import type { RootState } from '@/lib/redux/store';
import Link from 'next/link';

const STORAGE_KEY = 'karavali_ad_consent';

export default function AdConsentBanner() {
  const dispatch = useDispatch();
  const consent = useSelector((state: RootState) => state.adConsent.hasConsented);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Restore saved preference from localStorage on first mount
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      dispatch(setConsented(stored === 'true'));
    } else {
      // No preference yet — show the banner
      setVisible(true);
    }
  }, [dispatch]);

  const handleConsent = (accepted: boolean) => {
    localStorage.setItem(STORAGE_KEY, accepted ? 'true' : 'false');
    dispatch(setConsented(accepted));
    setVisible(false);
  };

  // Don't render if consent already resolved or banner shouldn't show
  if (!visible || consent !== null) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 sm:pb-0"
      style={{ animation: 'slideUpBanner 0.35s cubic-bezier(0.16, 1, 0.3, 1)' }}
    >
      <div className="sm:max-w-2xl sm:mx-auto sm:mb-4 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
        {/* Top gradient accent */}
        <div
          className="h-[3px] w-full"
          style={{ background: 'linear-gradient(90deg, #4f46e5 0%, #7c3aed 50%, #0ea5e9 100%)' }}
        />

        <div className="px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Icon */}
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 border border-indigo-100">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 mb-0.5">
              This site uses cookies to stay free 🍪
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              We partner with ad networks to serve relevant ads — this is what keeps Karavali Jobs 100% free for job seekers and employers.{' '}
              <Link href="/privacy-policy" className="text-indigo-600 hover:underline font-semibold">
                Learn more
              </Link>
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
            <button
              onClick={() => handleConsent(false)}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Decline
            </button>
            <button
              onClick={() => handleConsent(true)}
              className="flex-1 sm:flex-none px-5 py-2 text-xs font-bold text-white rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md"
              style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
            >
              Accept All
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUpBanner {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

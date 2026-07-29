'use client';

import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setConsented } from '@/lib/redux/slices/adConsentSlice';
import Link from 'next/link';

const STORAGE_KEY = 'karavali_ad_consent';

export default function CookieConsentBanner() {
  const dispatch = useDispatch();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Read stored preference on mount
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'accepted') {
      dispatch(setConsented(true));
    } else if (stored === 'declined') {
      dispatch(setConsented(false));
    } else {
      // No preference stored — show the banner
      setVisible(true);
    }
  }, [dispatch]);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    dispatch(setConsented(true));
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(STORAGE_KEY, 'declined');
    dispatch(setConsented(false));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-0"
      style={{ animation: 'slideUpBanner 0.3s ease-out' }}
    >
      <div className="sm:max-w-2xl sm:mx-auto sm:mb-4 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
        {/* Top accent bar */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #4f46e5, #7c3aed)' }} />

        <div className="px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Icon */}
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 mb-0.5">We use cookies to keep this site free</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              We show ads via Adsterra and other networks. Accepting allows personalised ads that keep Karavali Jobs free for everyone.{' '}
              <Link href="/privacy-policy" className="text-indigo-600 hover:underline font-medium">
                Privacy Policy
              </Link>
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
            <button
              onClick={handleDecline}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
            >
              Accept All
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUpBanner {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

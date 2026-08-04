'use client';

import { useState, useEffect } from 'react';

export default function AdBlockDetector() {
  const [isAdBlockerActive, setIsAdBlockerActive] = useState(false);
  const [checking, setChecking] = useState(true);

  const checkAdBlocker = async () => {
    setChecking(true);
    let isBlocked = false;

    // Method 1: Check by inserting a bait element matching typical ad blocker filters
    const bait = document.createElement('div');
    bait.innerHTML = '&nbsp;';
    bait.className = 'adsbox ad-banner ad-placeholder doubleclick-ad';
    bait.style.position = 'absolute';
    bait.style.left = '-9999px';
    bait.style.top = '-9999px';
    bait.style.width = '1px';
    bait.style.height = '1px';
    bait.style.background = 'transparent';

    document.body.appendChild(bait);

    // Wait slightly to let the ad blocker extension modify the DOM
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (
      bait.offsetHeight === 0 ||
      bait.clientHeight === 0 ||
      window.getComputedStyle(bait).display === 'none' ||
      window.getComputedStyle(bait).visibility === 'hidden'
    ) {
      isBlocked = true;
    }

    document.body.removeChild(bait);

    // Method 2: Attempt to fetch a script from a common ad server (e.g. Google Adsense)
    if (!isBlocked) {
      try {
        const response = await fetch(
          new Request(
            'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
            { method: 'HEAD', mode: 'no-cors' }
          )
        );
        // If fetch returns opaque response or success, it's not blocked.
        // If it throws an error (e.g. network error / blocked by client), it's blocked.
      } catch (error) {
        isBlocked = true;
      }
    }

    setIsAdBlockerActive(isBlocked);
    setChecking(false);
  };

  useEffect(() => {
    // Run detection after component mounts
    checkAdBlocker();

    // Automatically check every 3 seconds to see if the ad blocker has been disabled
    const interval = setInterval(() => {
      checkAdBlocker();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  if (checking) return null;
  if (!isAdBlockerActive) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-md px-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl border border-slate-100 text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Shield Alert Icon */}
        <div className="w-16 h-16 bg-rose-50 border border-rose-100 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-slate-900 mb-3">
          Ad Blocker Detected
        </h2>
        
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          We keep <strong>Karavali Jobs</strong> 100% free for job seekers and local businesses by showing non-intrusive display ads. Please support us by disabling your ad blocker on this website.
        </p>

        <div className="w-full">
          <button
            onClick={checkAdBlocker}
            className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-indigo-200/50 cursor-pointer"
          >
            I've Disabled It
          </button>
        </div>
      </div>
    </div>
  );
}

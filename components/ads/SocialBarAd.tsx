'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/redux/store';
import { fetchAdConfig, type AdConfig } from '@/lib/ads';

function cleanUrl(val: string): string {
  if (!val) return '';
  const match = val.match(/src=["'](https?:\/\/[^"']+)["']/i);
  if (match) return match[1];
  return val.trim();
}

export default function SocialBarAd() {
  const consent = useSelector((state: RootState) => state.adConsent.hasConsented);
  const [adConfig, setAdConfig] = useState<AdConfig | null>(null);

  useEffect(() => {
    async function loadConfig() {
      const cfg = await fetchAdConfig();
      setAdConfig(cfg);
    }
    loadConfig();
  }, []);

  useEffect(() => {
    if (!consent || !adConfig || !adConfig.networks) return;

    const adsterra = adConfig.networks.adsterra;
    if (!adsterra || !adsterra.enabled || !adsterra.socialBarUrl) return;

    const url = cleanUrl(adsterra.socialBarUrl);
    if (!url) return;

    // Avoid injecting multiple times
    const existingScript = document.querySelector(`script[src="${url}"]`);
    if (existingScript) return;

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    script.async = true;
    
    document.body.appendChild(script);

    return () => {
      // Clean up script on unmount
      script.remove();
    };
  }, [consent, adConfig]);

  return null;
}

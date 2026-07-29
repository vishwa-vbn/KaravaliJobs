'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/redux/store';
import { fetchAdConfig, type AdConfig } from '@/lib/ads';

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

    // Avoid injecting multiple times
    const existingScript = document.querySelector(`script[src="${adsterra.socialBarUrl}"]`);
    if (existingScript) return;

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = adsterra.socialBarUrl;
    script.async = true;
    
    document.body.appendChild(script);

    return () => {
      // Clean up script on unmount
      script.remove();
    };
  }, [consent, adConfig]);

  return null;
}

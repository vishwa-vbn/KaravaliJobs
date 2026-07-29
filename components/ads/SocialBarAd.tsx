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
      console.log('[SocialBarAd] loaded config:', cfg);
      setAdConfig(cfg);
    }
    loadConfig();
  }, []);

  useEffect(() => {
    console.log('[SocialBarAd] consent:', consent, 'config:', adConfig);
    if (!consent || !adConfig || !adConfig.networks) return;

    const adsterra = adConfig.networks.adsterra;
    console.log('[SocialBarAd] Adsterra network details:', adsterra);
    if (!adsterra || !adsterra.enabled || !adsterra.socialBarUrl) return;

    const url = cleanUrl(adsterra.socialBarUrl);
    console.log('[SocialBarAd] Cleaned URL for social bar:', url);
    if (!url) return;

    // Avoid injecting multiple times
    const existingScript = document.querySelector(`script[src="${url}"]`);
    if (existingScript) {
      console.log('[SocialBarAd] Script already exists in DOM:', url);
      return;
    }

    console.log('[SocialBarAd] Injecting script tag for URL:', url);
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    script.async = true;
    
    document.body.appendChild(script);

    return () => {
      // Clean up script on unmount
      console.log('[SocialBarAd] Unmounting and removing script:', url);
      script.remove();
    };
  }, [consent, adConfig]);

  return null;
}

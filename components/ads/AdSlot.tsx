'use client';

import { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/redux/store';
import { fetchAdConfig, selectNetwork, type AdConfig } from '@/lib/ads';

function cleanKey(val: string): string {
  if (!val) return '';
  const match = val.match(/[a-f0-9]{32}/i);
  if (match) return match[0];
  return val.trim();
}

function cleanDomain(val: string): string {
  if (!val) return '';
  const match = val.match(/src=\\?["']?https?:\/\/([^/="'\s>\\]+)/i);
  if (match) return match[1];
  const urlMatch = val.match(/https?:\/\/([^/="'\s>\\]+)/i);
  if (urlMatch) return urlMatch[1];
  return val.trim();
}

interface AdSlotProps {
  slot: 'header' | 'native' | 'sidebar' | 'footer-sticky';
}

export default function AdSlot({ slot }: AdSlotProps) {
  const consent = useSelector((state: RootState) => state.adConsent.hasConsented);
  const [adConfig, setAdConfig] = useState<AdConfig | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadConfig() {
      const cfg = await fetchAdConfig();
      setAdConfig(cfg);
    }
    loadConfig();
  }, []);

  const [width, setWidth] = useState<number>(768);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWidth(window.innerWidth);
      const handleResize = () => setWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    if (!consent || !adConfig || !containerRef.current) return;

    const selected = selectNetwork(slot, adConfig);
    if (!selected) return;

    const { networkName, details } = selected;
    
    // Clear container
    containerRef.current.innerHTML = '';

    if (networkName === 'adsterra') {
      let zoneId = '';
      let adWidth = 320;
      let adHeight = 50;
      let isNative = false;
      let scriptDomain = 'www.highperformanceformat.com';

      if (slot === 'header') {
        const isMobile = width < 768;
        zoneId = cleanKey(isMobile 
          ? (details.headerMobileKey || details.zoneIds?.header || '')
          : (details.headerDesktopKey || details.zoneIds?.header || ''));
        adWidth = isMobile ? 320 : 468;
        adHeight = isMobile ? 50 : 60;
      } else if (slot === 'native') {
        zoneId = cleanKey(details.nativeKey || details.zoneIds?.native || '');
        scriptDomain = cleanDomain(details.nativeScriptDomain || 'pl30586630.effectivecpmnetwork.com');
        isNative = true;
      } else if (slot === 'sidebar') {
        const useTall = width >= 768;
        zoneId = cleanKey(useTall
          ? (details.sidebarTallKey || details.sidebarShortKey || details.zoneIds?.sidebar || '')
          : (details.sidebarShortKey || details.sidebarTallKey || details.zoneIds?.sidebar || ''));
        adWidth = 160;
        adHeight = (details.sidebarShortKey && !details.sidebarTallKey) || (!useTall && details.sidebarShortKey) ? 300 : 600;
      } else {
        // Fallback / default
        zoneId = cleanKey(details.zoneIds?.[slot] || '');
      }

      if (!zoneId) return;

      if (isNative) {
        // Native ad format: div container-ID + script
        const wrapperId = `container-${zoneId}`;
        const wrapperDiv = document.createElement('div');
        wrapperDiv.id = wrapperId;
        containerRef.current.appendChild(wrapperDiv);

        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.setAttribute('data-cfasync', 'false');
        script.src = `https://${scriptDomain}/${zoneId}/invoke.js`;
        containerRef.current.appendChild(script);
      } else {
        // Standard iframe banner format
        const configScript = document.createElement('script');
        configScript.type = 'text/javascript';
        configScript.innerHTML = `
          atOptions = {
            'key' : '${zoneId}',
            'format' : 'iframe',
            'height' : ${adHeight},
            'width' : ${adWidth},
            'params' : {}
          };
        `;
        containerRef.current.appendChild(configScript);

        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = `https://${scriptDomain}/${zoneId}/invoke.js`;
        containerRef.current.appendChild(script);
      }

    } else if (networkName === 'propellerads') {
      const zoneId = details.zoneId || '';
      if (!zoneId) return;

      const script = document.createElement('script');
      script.setAttribute('data-cfasync', 'false');
      script.async = true;
      script.src = `//plp.propellerads.com/zone?id=${zoneId}`;
      containerRef.current.appendChild(script);
    }
  }, [consent, adConfig, slot, width]);

  if (!consent) return null;

  return (
    <div className="flex justify-center my-4 overflow-hidden w-full">
      <div ref={containerRef} className="ad-slot-container min-h-[50px] flex items-center justify-center bg-gray-50 border border-gray-100 rounded-lg text-xs text-gray-400 select-none" style={{ minWidth: '300px' }}>
        Loading Advertisement...
      </div>
    </div>
  );
}

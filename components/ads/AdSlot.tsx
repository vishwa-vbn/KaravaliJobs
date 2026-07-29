'use client';

import { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/redux/store';
import { fetchAdConfig, selectNetwork, type AdConfig } from '@/lib/ads';

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

  useEffect(() => {
    if (!consent || !adConfig || !containerRef.current) return;

    const selected = selectNetwork(slot, adConfig);
    if (!selected) return;

    const { networkName, details } = selected;
    
    // Clear container
    containerRef.current.innerHTML = '';

    if (networkName === 'adsterra') {
      const zoneId = details.zoneIds?.[slot] || '';
      if (!zoneId) return;

      // Add wrapper div as expected by Adsterra script
      const wrapperId = `container-${zoneId}`;
      const wrapperDiv = document.createElement('div');
      wrapperDiv.id = wrapperId;
      containerRef.current.appendChild(wrapperDiv);

      const configScript = document.createElement('script');
      configScript.type = 'text/javascript';
      configScript.innerHTML = `
        atOptions = {
          'key' : '${zoneId}',
          'format' : 'iframe',
          'height' : ${slot === 'header' ? 90 : slot === 'sidebar' ? 250 : 50},
          'width' : ${slot === 'header' ? 728 : slot === 'sidebar' ? 300 : 320},
          'params' : {}
        };
      `;
      containerRef.current.appendChild(configScript);

      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = `//www.highcreativegate.com/${zoneId}/invoke.js`;
      containerRef.current.appendChild(script);

    } else if (networkName === 'propellerads') {
      const zoneId = details.zoneId || '';
      if (!zoneId) return;

      const script = document.createElement('script');
      script.setAttribute('data-cfasync', 'false');
      script.async = true;
      script.src = `//plp.propellerads.com/zone?id=${zoneId}`;
      containerRef.current.appendChild(script);
    }
  }, [consent, adConfig, slot]);

  if (!consent) return null;

  return (
    <div className="flex justify-center my-4 overflow-hidden w-full">
      <div ref={containerRef} className="ad-slot-container min-h-[50px] flex items-center justify-center bg-gray-50 border border-gray-100 rounded-lg text-xs text-gray-400 select-none" style={{ minWidth: '300px' }}>
        Loading Advertisement...
      </div>
    </div>
  );
}

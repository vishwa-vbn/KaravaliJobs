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

      // Create an iframe to isolate the script execution context and prevent atOptions collision
      const iframe = document.createElement('iframe');
      iframe.width = isNative ? '100%' : `${adWidth}`;
      iframe.height = isNative ? '280' : `${adHeight}`;
      iframe.style.border = 'none';
      iframe.style.overflow = 'hidden';
      iframe.style.display = 'block';
      iframe.style.margin = '0 auto';
      iframe.style.maxWidth = '100%';

      iframe.srcdoc = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                margin: 0;
                padding: 0;
                overflow: hidden;
                background: transparent;
                ${!isNative ? `
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                ` : ''}
              }
              #container-${zoneId} {
                width: 100%;
              }
            </style>
          </head>
          <body>
            ${isNative ? `
              <div id="container-${zoneId}"></div>
              <script async="async" data-cfasync="false" src="https://${scriptDomain}/${zoneId}/invoke.js"></script>
            ` : `
              <script type="text/javascript">
                var atOptions = {
                  'key' : '${zoneId}',
                  'format' : 'iframe',
                  'height' : ${adHeight},
                  'width' : ${adWidth},
                  'params' : {}
                };
              </script>
              <script type="text/javascript" src="https://${scriptDomain}/${zoneId}/invoke.js"></script>
            `}
          </body>
        </html>
      `;

      containerRef.current.appendChild(iframe);

    } else if (networkName === 'propellerads') {
      const zoneId = details.zoneId || '';
      if (!zoneId) return;

      const iframe = document.createElement('iframe');
      iframe.width = '100%';
      iframe.height = '250';
      iframe.style.border = 'none';
      iframe.style.overflow = 'hidden';
      iframe.style.display = 'block';

      iframe.srcdoc = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { margin: 0; padding: 0; overflow: hidden; background: transparent; }
            </style>
          </head>
          <body>
            <script data-cfasync="false" async src="//plp.propellerads.com/zone?id=${zoneId}"></script>
          </body>
        </html>
      `;
      containerRef.current.appendChild(iframe);
    }
  }, [consent, adConfig, slot, width]);

  if (!consent) return null;

  return (
    <div className="flex flex-col items-center justify-center my-3 overflow-hidden w-full">
      <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mb-1 select-none">
        Sponsored
      </span>
      <div 
        ref={containerRef} 
        className="ad-slot-container flex items-center justify-center bg-slate-50/30 border border-slate-100/50 rounded-lg text-[10px] text-slate-300 select-none" 
        style={{ minWidth: '300px', minHeight: '50px' }}
      >
        Loading ad...
      </div>
    </div>
  );
}


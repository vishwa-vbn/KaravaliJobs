'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';

export default function AdminAdsPage() {
  const [adsterraEnabled, setAdsterraEnabled] = useState(false);
  const [adsterraPriority, setAdsterraPriority] = useState(1);
  
  // Custom Adsterra Keys and configurations
  const [headerDesktopKey, setHeaderDesktopKey] = useState('');
  const [headerMobileKey, setHeaderMobileKey] = useState('');
  const [nativeKey, setNativeKey] = useState('');
  const [nativeScriptDomain, setNativeScriptDomain] = useState('pl30586630.effectivecpmnetwork.com');
  const [sidebarTallKey, setSidebarTallKey] = useState('');
  const [sidebarShortKey, setSidebarShortKey] = useState('');
  const [socialBarUrl, setSocialBarUrl] = useState('');

  const [propellerEnabled, setPropellerEnabled] = useState(false);
  const [propellerPriority, setPropellerPriority] = useState(2);
  const [propellerZoneId, setPropellerZoneId] = useState('');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadConfig() {
      try {
        const docRef = doc(db, 'config', 'ads');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const adsterra = data.networks?.adsterra || {};
          setAdsterraEnabled(adsterra.enabled || false);
          setAdsterraPriority(adsterra.priority || 1);
          
          // Load custom keys with backward compatibility fallbacks
          setHeaderDesktopKey(adsterra.headerDesktopKey || adsterra.zoneIds?.header || '');
          setHeaderMobileKey(adsterra.headerMobileKey || '');
          setNativeKey(adsterra.nativeKey || adsterra.zoneIds?.native || '');
          setNativeScriptDomain(adsterra.nativeScriptDomain || 'pl30586630.effectivecpmnetwork.com');
          setSidebarTallKey(adsterra.sidebarTallKey || adsterra.zoneIds?.sidebar || '');
          setSidebarShortKey(adsterra.sidebarShortKey || '');
          setSocialBarUrl(adsterra.socialBarUrl || '');

          const propeller = data.networks?.propellerads || {};
          setPropellerEnabled(propeller.enabled || false);
          setPropellerPriority(propeller.priority || 2);
          setPropellerZoneId(propeller.zoneId || '');
        }
      } catch (err) {
        console.error('Failed to load ad config:', err);
      }
    }
    loadConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const docRef = doc(db, 'config', 'ads');
      await setDoc(docRef, {
        networks: {
          adsterra: {
            enabled: adsterraEnabled,
            priority: Number(adsterraPriority),
            headerDesktopKey,
            headerMobileKey,
            nativeKey,
            nativeScriptDomain,
            sidebarTallKey,
            sidebarShortKey,
            socialBarUrl,
            // Fallbacks for backward compatibility
            zoneIds: {
              header: headerDesktopKey || headerMobileKey,
              native: nativeKey,
              sidebar: sidebarTallKey || sidebarShortKey,
            }
          },
          propellerads: {
            enabled: propellerEnabled,
            priority: Number(propellerPriority),
            zoneId: propellerZoneId,
          },
        },
        maxSlotsPerViewport: 3,
        mobileStickyEnabled: true,
      });
      setMessage('Configuration saved successfully.');
    } catch (err: any) {
      console.error('Failed to save config:', err);
      setMessage(`Error: ${err?.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      <main className="flex-grow">
        {/* Page header */}
        <div className="border-b border-neutral-200">
          <div className="max-w-4xl mx-auto px-6 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-2">
                <Link href="/" className="hover:text-black transition-colors">Home</Link>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-neutral-600">Admin Console</span>
              </div>
              <h1 className="text-xl font-bold text-black">Ad Network Configuration</h1>
              <p className="text-sm text-neutral-500 mt-0.5">Configure keys for banners, native ads, popunders and skyscrapers.</p>
            </div>
            <Link href="/admin/broadcast-log" className="btn-secondary flex-shrink-0 text-xs">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Broadcast Logs
            </Link>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-8">
          {message && (
            <div className="mb-6 px-4 py-3 border border-neutral-200 rounded-lg bg-neutral-50 text-sm text-neutral-700 font-medium">
              {message}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-8">
            {/* Adsterra */}
            <section className="space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <h2 className="text-sm font-bold text-black">Adsterra Settings</h2>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={adsterraEnabled}
                    onChange={(e) => setAdsterraEnabled(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-300"
                  />
                  <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Enabled</span>
                </label>
              </div>

              {adsterraEnabled && (
                <div className="space-y-6">
                  {/* Priority & Global Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-label text-neutral-500">Priority (lower is higher)</label>
                      <input
                        type="number"
                        value={adsterraPriority}
                        onChange={(e) => setAdsterraPriority(Number(e.target.value))}
                        className="field-input"
                      />
                    </div>
                  </div>

                  {/* Header Banner Unit */}
                  <div className="border border-neutral-100 rounded-xl p-4 space-y-4 bg-neutral-50/50">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">Header Banner (Responsive)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-label text-neutral-500 font-medium">Desktop Key (468x60)</label>
                        <input
                          type="text"
                          value={headerDesktopKey}
                          onChange={(e) => setHeaderDesktopKey(e.target.value)}
                          placeholder="e.g. 603552d7231182f5d6caaf4a4ebb6d66"
                          className="field-input bg-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-label text-neutral-500 font-medium">Mobile Key (320x50)</label>
                        <input
                          type="text"
                          value={headerMobileKey}
                          onChange={(e) => setHeaderMobileKey(e.target.value)}
                          placeholder="e.g. 3dbc938a0f9b8451191aba194e7aff21"
                          className="field-input bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Native / Smart Banner Unit */}
                  <div className="border border-neutral-100 rounded-xl p-4 space-y-4 bg-neutral-50/50">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">Native Smart Banner</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-label text-neutral-500 font-medium">Native Banner Key</label>
                        <input
                          type="text"
                          value={nativeKey}
                          onChange={(e) => setNativeKey(e.target.value)}
                          placeholder="e.g. 7df8ffe48a03b7855291efe8da95f932"
                          className="field-input bg-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-label text-neutral-500 font-medium">Script Domain</label>
                        <input
                          type="text"
                          value={nativeScriptDomain}
                          onChange={(e) => setNativeScriptDomain(e.target.value)}
                          placeholder="pl30586630.effectivecpmnetwork.com"
                          className="field-input bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sidebar Skyscrapers */}
                  <div className="border border-neutral-100 rounded-xl p-4 space-y-4 bg-neutral-50/50">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">Sidebar Skyscrapers</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-label text-neutral-500 font-medium">Tall Skyscraper Key (160x600)</label>
                        <input
                          type="text"
                          value={sidebarTallKey}
                          onChange={(e) => setSidebarTallKey(e.target.value)}
                          placeholder="e.g. 82742751d41e0f7da01a93661983efcd"
                          className="field-input bg-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-label text-neutral-500 font-medium">Half Skyscraper Key (160x300)</label>
                        <input
                          type="text"
                          value={sidebarShortKey}
                          onChange={(e) => setSidebarShortKey(e.target.value)}
                          placeholder="e.g. 205f71969bc1b67eba19921b47a8239f"
                          className="field-input bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Social Bar (Popunder) */}
                  <div className="border border-neutral-100 rounded-xl p-4 space-y-4 bg-neutral-50/50">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">Social Bar (Global Script)</h3>
                    <div className="space-y-1.5">
                      <label className="text-label text-neutral-500 font-medium">Full Script URL</label>
                      <input
                        type="text"
                        value={socialBarUrl}
                        onChange={(e) => setSocialBarUrl(e.target.value)}
                        placeholder="https://pl30586637.effectivecpmnetwork.com/c6/fb/9c/c6fb9ce58b5f494394d99cd2cbd656c3.js"
                        className="field-input bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* PropellerAds */}
            <section className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <h2 className="text-sm font-bold text-black">PropellerAds Settings</h2>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={propellerEnabled}
                    onChange={(e) => setPropellerEnabled(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-300"
                  />
                  <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Enabled</span>
                </label>
              </div>

              {propellerEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-label text-neutral-500">Priority</label>
                    <input
                      type="number"
                      value={propellerPriority}
                      onChange={(e) => setPropellerPriority(Number(e.target.value))}
                      className="field-input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-label text-neutral-500">Zone ID</label>
                    <input
                      type="text"
                      value={propellerZoneId}
                      onChange={(e) => setPropellerZoneId(e.target.value)}
                      placeholder="e.g. 1234567"
                      className="field-input"
                    />
                  </div>
                </div>
              )}
            </section>

            {/* Actions */}
            <div className="flex justify-end pt-4 border-t border-neutral-100">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}

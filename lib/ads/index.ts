import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/client';

export interface AdNetworkConfig {
  enabled: boolean;
  priority: number;
  zoneIds?: Record<string, string>; // e.g., { header: 'xxxx', native: 'xxxx' }
  siteId?: string;
  zoneId?: string;
  publisherId?: string;
  
  // Custom Adsterra Keys
  headerDesktopKey?: string;      // 468x60
  headerMobileKey?: string;       // 320x50
  nativeKey?: string;             // Native banner code
  nativeScriptDomain?: string;    // e.g., pl30586630.effectivecpmnetwork.com
  sidebarTallKey?: string;        // 160x600
  sidebarShortKey?: string;       // 160x300
  socialBarUrl?: string;          // Global social bar script url
}

export interface AdConfig {
  networks: Record<string, AdNetworkConfig>;
  maxSlotsPerViewport: number;
  mobileStickyEnabled: boolean;
}

export async function fetchAdConfig(): Promise<AdConfig | null> {
  try {
    const configDocRef = doc(db, 'config', 'ads');
    const docSnap = await getDoc(configDocRef);
    if (docSnap.exists()) {
      return docSnap.data() as AdConfig;
    }
  } catch (err) {
    console.error('Failed to fetch ad config from firestore:', err);
  }
  return null;
}

export function selectNetwork(slot: string, config: AdConfig): { networkName: string; details: AdNetworkConfig } | null {
  if (!config || !config.networks) return null;

  // Filter networks that are enabled and sort by priority (lower number = higher priority)
  const sortedNetworks = Object.entries(config.networks)
    .filter(([_, netConfig]) => netConfig.enabled)
    .sort(([_, a], [__, b]) => a.priority - b.priority);

  if (sortedNetworks.length === 0) return null;

  // Return the first enabled network
  const [networkName, details] = sortedNetworks[0];
  return { networkName, details };
}

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ReduxProvider from '@/components/providers/ReduxProvider';
import AuthInit from '@/components/providers/AuthInit';
import AdConsentBanner from '@/components/ads/AdConsentBanner';
import SocialBarAd from '@/components/ads/SocialBarAd';
import { UIProvider } from '@/components/ui/UIContext';

import AdBlockDetector from '@/components/ads/AdBlockDetector';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Karavali Jobs',
    template: '%s | Karavali Jobs',
  },
  description:
    'Find part-time, permanent, and remote jobs in the Karavali region (Udupi & Mangalore). New listings every day — no login required to browse and apply.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://karavali-jobs.com'
  ),
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <ReduxProvider>
          <AuthInit>
            <UIProvider>
              <AdConsentBanner />
              <SocialBarAd />
              <AdBlockDetector />
              {children}
            </UIProvider>
          </AuthInit>
        </ReduxProvider>
      </body>
    </html>
  );
}

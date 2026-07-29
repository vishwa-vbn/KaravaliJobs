import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ReduxProvider from '@/components/providers/ReduxProvider';
import AuthInit from '@/components/providers/AuthInit';
import AdConsentBanner from '@/components/ads/AdConsentBanner';
import { UIProvider } from '@/components/ui/UIContext';

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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <ReduxProvider>
          <AuthInit>
            <UIProvider>
              {/* AdConsentBanner renders null until Phase 3 — keeps this import ready */}
              <AdConsentBanner />
              {children}
            </UIProvider>
          </AuthInit>
        </ReduxProvider>
      </body>
    </html>
  );
}

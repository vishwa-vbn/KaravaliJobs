'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/redux/store';

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useSelector((state: RootState) => state.auth);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || loading) return;

    if (!user) {
      router.replace('/');
      return;
    }

    const currentPath = window.location.pathname;
    const isOnboarding = currentPath === '/provider/onboarding';

    if (!user.onboarded) {
      if (!isOnboarding) {
        router.replace('/provider/onboarding');
      }
    } else {
      if (isOnboarding) {
        router.replace('/dashboard');
      }
      if (user.role !== 'provider' && user.role !== 'super_admin') {
        router.replace('/');
      }
    }
  }, [user, loading, mounted, router]);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <span className="text-gray-400 font-medium">Verifying access rights...</span>
      </div>
    );
  }

  // Double safety guard
  if (!user) return null;

  return <>{children}</>;
}

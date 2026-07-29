'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/redux/store';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useSelector((state: RootState) => state.auth);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || loading) return;

    // Strict gate access to Super Admin role
    if (!user || user.role !== 'super_admin') {
      router.replace('/');
    }
  }, [user, loading, mounted, router]);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <span className="text-gray-400 font-medium">Authorizing admin console...</span>
      </div>
    );
  }

  if (!user || user.role !== 'super_admin') return null;

  return <>{children}</>;
}

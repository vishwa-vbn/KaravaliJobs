'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { updateProfile } from '@/lib/firebase/authService';
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/redux/store';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function AlertsSignupPage() {
  const { user, loading } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  
  const [subscribed, setSubscribed] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Seeker onboarding redirect guard
    if (user.role === 'seeker' && !user.onboarded) {
      router.replace('/seeker/onboarding');
      return;
    }

    // Realtime sync of opt-in values
    const docRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSubscribed(!!data.subscribedToAlerts);
      }
    });

    return () => unsubscribe();
  }, [user, router]);

  const handleToggleAlerts = async () => {
    if (!user) return;
    setUpdating(true);
    try {
      await updateProfile(user.uid, {
        subscribedToAlerts: !subscribed,
      });
    } catch (err) {
      console.error('Failed to update email alert subscription:', err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      <Header />

      <main className="flex-grow max-w-xl w-full mx-auto px-4 py-12 sm:px-6">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Email Alerts</h1>
            <p className="text-gray-500 text-sm">
              Get notified immediately whenever a new job matches local listings in the Karavali region (Udupi &amp; Mangalore).
            </p>
          </div>

          {loading ? (
            <div className="text-center py-6 text-gray-400 font-medium">Checking auth status...</div>
          ) : user ? (
            <div className="space-y-4 border-t border-gray-50 pt-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <h3 className="font-bold text-gray-900">Email Alerts</h3>
                  <p className="text-gray-500 text-xs">{user.email}</p>
                </div>
                <button
                  onClick={handleToggleAlerts}
                  disabled={updating}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                    subscribed
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {subscribed ? 'Unsubscribe' : 'Subscribe'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 border-t border-gray-50 pt-6 space-y-4">
              <p className="text-sm font-medium text-gray-600">Please sign in with Google to manage email alerts.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

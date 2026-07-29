'use client';

import { useState } from 'react';
import { signInWithGoogle } from '@/lib/firebase/authService';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRoleSelect = async (selectedRole: 'seeker' | 'provider') => {
    setLoading(true);
    setError('');
    try {
      const profile = await signInWithGoogle();
      
      // If user is already onboarded, redirect straight to their dashboard or home
      if (profile.onboarded) {
        if (profile.role === 'provider' || profile.role === 'super_admin') {
          router.push('/dashboard');
        } else {
          router.push('/');
        }
      } else {
        // Redirect to their specific onboarding details form
        if (selectedRole === 'provider') {
          router.push('/provider/onboarding');
        } else {
          router.push('/seeker/onboarding');
        }
      }
    } catch (err: any) {
      console.error('Registration failed:', err);
      setError('Authentication failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Header />

      <main className="flex-grow flex items-center justify-center py-16 px-4">
        <div className="max-w-4xl w-full space-y-8 text-center">
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
              Join <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Karavali Jobs</span>
            </h1>
            <p className="text-gray-500 max-w-md mx-auto text-sm sm:text-base">
              Create your account using Google and choose your portal to get started.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-100 font-medium max-w-md mx-auto">
              ⚠️ {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto pt-6">
            {/* Seeker Card */}
            <button
              onClick={() => handleRoleSelect('seeker')}
              disabled={loading}
              className="group text-left bg-white border border-gray-100 rounded-3xl p-8 shadow-sm hover:shadow-xl hover:border-blue-500/30 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-6 cursor-pointer disabled:opacity-50"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  🎯
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-900">Job Seeker</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    I want to find local jobs in Udupi & Mangalore, build my profile, and receive instant alert notifications.
                  </p>
                </div>
              </div>
              <div className="text-blue-600 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                Create Candidate Profile &rarr;
              </div>
            </button>

            {/* Provider Card */}
            <button
              onClick={() => handleRoleSelect('provider')}
              disabled={loading}
              className="group text-left bg-white border border-gray-100 rounded-3xl p-8 shadow-sm hover:shadow-xl hover:border-blue-500/30 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-6 cursor-pointer disabled:opacity-50"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  💼
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-900">Employer / Provider</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    I want to list jobs, manage postings, renew listings, and hire talent across the local Karavali region.
                  </p>
                </div>
              </div>
              <div className="text-indigo-600 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                Register as Employer &rarr;
              </div>
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

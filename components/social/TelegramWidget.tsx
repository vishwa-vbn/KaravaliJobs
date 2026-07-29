'use client';

import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile } from '@/lib/firebase/authService';
import { setUser } from '@/lib/redux/slices/authSlice';
import type { RootState } from '@/lib/redux/store';

export default function TelegramWidget() {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const telegramUrl = process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_URL || 'https://t.me/UdupiMangaloreJobs';

  const handleJoin = async () => {
    // Open Telegram channel in a new tab
    window.open(telegramUrl, '_blank', 'noopener,noreferrer');

    if (user && !user.hasJoinedTelegram) {
      setLoading(true);
      try {
        await updateProfile(user.uid, { hasJoinedTelegram: true });
        dispatch(
          setUser({
            ...user,
            hasJoinedTelegram: true,
          })
        );
      } catch (err) {
        console.error('Failed to update Telegram subscription status:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const hasJoined = !!user?.hasJoinedTelegram;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-neutral-100 p-6 transition-all duration-300 hover:shadow-md bg-gradient-to-br from-sky-50/70 via-sky-50/30 to-indigo-50/20">
      {/* Background soft glow */}
      <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-sky-200/20 blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
        <div className="flex gap-4 items-start">
          {/* Telegram Icon */}
          <div className="w-12 h-12 rounded-2xl bg-white border border-sky-100 flex items-center justify-center shadow-sm text-sky-500 flex-shrink-0">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.944 0A12 12 0 1 0 24 12 12 12 0 0 0 11.944 0zm5.563 8.267-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.932z" />
            </svg>
          </div>

          <div>
            <h3 className="text-sm font-extrabold text-neutral-800 flex items-center gap-1.5 leading-snug">
              Join Our Telegram Channel
              {hasJoined && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500 text-white uppercase tracking-wider">
                  Active
                </span>
              )}
            </h3>
            <p className="text-neutral-500 text-xs mt-1 leading-normal max-w-lg">
              Get instant, real-time alerts on your phone the moment new jobs are posted in Udupi, Mangalore, and surrounding areas.
            </p>
          </div>
        </div>

        <button
          onClick={handleJoin}
          disabled={loading}
          className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 shadow-sm cursor-pointer border flex items-center justify-center gap-2 flex-shrink-0 ${
            hasJoined
              ? 'bg-white hover:bg-neutral-50 border-neutral-200 text-neutral-600'
              : 'bg-sky-500 hover:bg-sky-600 text-white border-sky-400 hover:shadow-md'
          }`}
        >
          {hasJoined ? (
            <>
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Channel Joined
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.944 0A12 12 0 1 0 24 12 12 12 0 0 0 11.944 0zm5.563 8.267-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.932z" />
              </svg>
              {loading ? 'Subscribing...' : 'Join Telegram Channel'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

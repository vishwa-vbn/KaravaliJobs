'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useDispatch } from 'react-redux';
import { auth } from '@/lib/firebase/client';
import { getOrCreateProfile } from '@/lib/firebase/authService';
import { setUser, setLoading, clearUser } from '@/lib/redux/slices/authSlice';

export default function AuthInit({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setLoading(true));
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const profile = await getOrCreateProfile(user);
          dispatch(
            setUser({
              uid: profile.uid,
              email: profile.email,
              displayName: profile.displayName,
              photoURL: profile.photoURL || null,
              role: profile.role,
              onboarded: profile.onboarded,
              companyName: profile.providerProfile?.companyName || null,
              providerType: profile.providerProfile?.providerType || null,
              hasJoinedTelegram: !!profile.hasJoinedTelegram,
            })
          );
        } catch (error) {
          console.error('Error fetching/creating user profile:', error);
          dispatch(clearUser());
        }
      } else {
        dispatch(clearUser());
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  return <>{children}</>;
}

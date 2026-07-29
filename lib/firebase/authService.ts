import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './client';

export interface EducationDetail {
  school: string;
  degree: string;
  fieldOfStudy: string;
  startYear: string;
  endYear: string;
}

export interface ExperienceDetail {
  company: string;
  role: string;
  description: string;
  startYear: string;
  endYear: string;
  current: boolean;
}

export interface SeekerProfile {
  headline: string;
  skills: string[];
  experience: string;
  education: string;
  educationDetails?: EducationDetail[];
  experienceDetails?: ExperienceDetail[];
  phone?: string;
  portfolioUrl?: string;
}

export interface ProviderProfile {
  providerType: 'company' | 'individual';
  companyName: string;
  phone: string;
  website?: string;
  address: string;
  verificationId?: string;
  bio: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: 'seeker' | 'provider' | 'super_admin';
  subscribedToAlerts: boolean;
  whatsappOptIn: boolean;
  phone: string | null;
  createdAt: any;
  onboarded: boolean;
  seekerProfile?: SeekerProfile | null;
  providerProfile?: ProviderProfile | null;
  hasJoinedTelegram?: boolean;
}

/**
 * Sign in with Google Popup and retrieve/create the user profile doc.
 */
export async function signInWithGoogle(): Promise<UserProfile> {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  return await getOrCreateProfile(user);
}

/**
 * Log out of Firebase Auth.
 */
export async function logOut(): Promise<void> {
  await signOut(auth);
}

/**
 * Fetches or creates a user profile in Firestore `users` collection.
 */
export async function getOrCreateProfile(user: FirebaseUser): Promise<UserProfile> {
  const userDocRef = doc(db, 'users', user.uid);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    const existing = userDocSnap.data() as UserProfile;
    // Keep photoURL updated if changed in Google
    if (user.photoURL && existing.photoURL !== user.photoURL) {
      await setDoc(userDocRef, { photoURL: user.photoURL }, { merge: true });
      existing.photoURL = user.photoURL;
    }
    return existing;
  }

  // Create default profile for first-time sign-in
  const newProfile: UserProfile = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || 'User',
    photoURL: user.photoURL || null,
    role: 'seeker', // default role
    subscribedToAlerts: false,
    whatsappOptIn: false,
    phone: null,
    createdAt: serverTimestamp(),
    onboarded: false,
    hasJoinedTelegram: false,
  };

  // We write the new document
  await setDoc(userDocRef, newProfile);
  return newProfile;
}

/**
 * Submits the provider onboarding step and transitions user to provider role.
 */
export async function onboardProvider(
  uid: string,
  data: ProviderProfile
): Promise<void> {
  const userDocRef = doc(db, 'users', uid);
  await setDoc(
    userDocRef,
    {
      providerProfile: data,
      role: 'provider',
      onboarded: true,
      phone: data.phone,
    },
    { merge: true }
  );
}

/**
 * Submits the seeker onboarding step.
 */
export async function onboardSeeker(
  uid: string,
  data: SeekerProfile
): Promise<void> {
  const userDocRef = doc(db, 'users', uid);
  await setDoc(
    userDocRef,
    {
      seekerProfile: data,
      role: 'seeker',
      onboarded: true,
    },
    { merge: true }
  );
}

/**
 * Updates a user profile.
 */
export async function updateProfile(uid: string, data: Partial<Omit<UserProfile, 'uid' | 'createdAt'>>): Promise<void> {
  const userDocRef = doc(db, 'users', uid);
  await setDoc(userDocRef, data, { merge: true });
}

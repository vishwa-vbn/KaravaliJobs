// Firebase Admin SDK — SERVER-SIDE ONLY
// Used in: Next.js API route handlers that need elevated Firestore access.
// NEVER import this file from client components or from the functions/ package.
//
// Credentials loaded from environment variables (never hardcoded or committed):
//   FIREBASE_ADMIN_PROJECT_ID      — from Firebase Console → Service Accounts → Generate Key
//   FIREBASE_ADMIN_CLIENT_EMAIL    — from the downloaded JSON
//   FIREBASE_ADMIN_PRIVATE_KEY     — from the downloaded JSON (contains literal \n)
//
// See SETUP.md §4 and ARCHITECTURE.md §8.
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      // Vercel stores the private key with literal \n — replace at runtime
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export { admin, FieldValue };

import { adminDb } from '@/lib/firebase/admin';

/**
 * Explicit Content Moderation Helper — Server-side only
 */

// A curated list of explicit words, regional slangs, and terms to flag.
// Can be expanded as needed.
const EXPLICIT_WORDS = [
  // Standard English profanities
  'abuse', 'bastard', 'bitch', 'bullshit', 'crap', 'cunt', 'dick', 'fuck', 'motherfucker', 'piss', 'shit', 'asshole', 'whore',
  // Regional slangs / offensive terms (Udupi/Mangalore context & common Indian slang)
  'bhadwa', 'chutiya', 'harami', 'kamina', 'randi', 'sala', 'saala', 'shana', 'bosa', 'bolimagane', 'sule', 'lofar', 'laude', 'gaand', 'choot'
];

/**
 * Checks if a string contains any explicit or restricted words.
 * Performs a case-insensitive check and matches word boundaries to avoid false positives.
 */
export async function containsProfanity(text: string): Promise<boolean> {
  if (!text) return false;

  const normalizedText = text.toLowerCase();

  // Fetch custom admin-configured words list from Firestore
  let dbWords: string[] = [];
  try {
    const docSnap = await adminDb.collection('config').doc('moderation').get();
    if (docSnap.exists) {
      dbWords = docSnap.data()?.flaggedWords || [];
    }
  } catch (err) {
    console.error('[Moderation] Failed to load custom flagged words from DB:', err);
  }

  // Combine both default statically compiled list and dynamically updated DB list
  const combinedWords = Array.from(new Set([
    ...EXPLICIT_WORDS,
    ...dbWords.map(w => w.trim().toLowerCase())
  ])).filter(Boolean);

  for (const word of combinedWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(normalizedText)) {
      console.warn(`[Moderation] Flagged word found: "${word}"`);
      return true;
    }
  }

  return false;
}

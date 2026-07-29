'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { useUI } from '@/components/ui/UIContext';

export default function FlaggedWordsPage() {
  const [words, setWords] = useState<string[]>([]);
  const [newWord, setNewWord] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { confirm, toast, showAlert } = useUI();

  async function loadWords() {
    setLoading(true);
    try {
      const docRef = doc(db, 'config', 'moderation');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setWords(snap.data().flaggedWords || []);
      } else {
        // Initialize empty moderation config document if it doesn't exist
        await setDoc(docRef, { flaggedWords: [] });
        setWords([]);
      }
    } catch (err) {
      console.error('Failed to load flagged words:', err);
      showAlert('Error', 'Failed to retrieve flagged words from configuration database.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWords();
  }, []);

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanWord = newWord.trim().toLowerCase();
    if (!cleanWord) return;

    if (cleanWord.includes(' ')) {
      showAlert('Invalid Word', 'Please enter a single word only (no spaces).');
      return;
    }

    if (words.includes(cleanWord)) {
      showAlert('Duplicate', 'This word is already on the flagged list.');
      return;
    }

    setSaving(true);
    const updated = [...words, cleanWord].sort();
    try {
      const docRef = doc(db, 'config', 'moderation');
      await setDoc(docRef, { flaggedWords: updated }, { merge: true });
      setWords(updated);
      setNewWord('');
      toast(`"${cleanWord}" added to flagged words list.`, 'success');
    } catch (err) {
      console.error('Failed to add word:', err);
      showAlert('Save Failed', 'Error updating configuration in Firestore.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveWord = async (wordToRemove: string) => {
    const ok = await confirm(
      'Remove Flagged Word',
      `Are you sure you want to remove "${wordToRemove}"? Submissions containing this word will no longer be auto-flagged.`,
      { confirmLabel: 'Remove Word', type: 'danger' }
    );
    if (!ok) return;

    setSaving(true);
    const updated = words.filter((w) => w !== wordToRemove);
    try {
      const docRef = doc(db, 'config', 'moderation');
      await setDoc(docRef, { flaggedWords: updated }, { merge: true });
      setWords(updated);
      toast(`"${wordToRemove}" removed from list.`, 'info');
    } catch (err) {
      console.error('Failed to remove word:', err);
      showAlert('Remove Failed', 'Error updating database configuration.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      <main className="flex-grow">
        {/* Page header */}
        <div className="border-b border-neutral-200">
          <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-2">
                <Link href="/admin" className="hover:text-black transition-colors">Admin Console</Link>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <Link href="/admin/moderation" className="hover:text-black transition-colors">Moderation</Link>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-neutral-600">Words Manager</span>
              </div>
              <h1 className="text-xl font-bold text-black">Explicit Words Manager</h1>
              <p className="text-sm text-neutral-500 mt-0.5">Configure words that will automatically flag job postings for manual review.</p>
            </div>
            <Link href="/admin/moderation" className="btn-secondary text-xs flex-shrink-0">
              Back to Moderation Queue
            </Link>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
          {/* Add Word Form */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-black mb-3">Add Custom Flagged Word</h2>
            <form onSubmit={handleAddWord} className="flex gap-3">
              <input
                type="text"
                required
                disabled={loading || saving}
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                placeholder="Type a word (e.g. gambling, spam, lottery)"
                className="flex-grow rounded-lg border border-neutral-200 px-3.5 py-2 text-xs text-black focus:border-black focus:outline-none bg-white transition-colors"
              />
              <button
                type="submit"
                disabled={loading || saving || !newWord.trim()}
                className="btn-primary text-xs flex-shrink-0 cursor-pointer"
              >
                {saving ? 'Adding...' : 'Add Word'}
              </button>
            </form>
            <p className="text-[10px] text-neutral-400 mt-2 leading-relaxed">
              * Note: The portal also contains a core, hardcoded default profanity filter for common Indian regional slangs and standard English abuse terms. Custom words added here will complement the default list.
            </p>
          </div>

          {/* Words List */}
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-neutral-100 pb-2">
              <h3 className="text-sm font-bold text-black">Active Flagged Custom Words</h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-800">
                {words.length} word{words.length !== 1 ? 's' : ''} configured
              </span>
            </div>

            {loading ? (
              <div className="flex flex-wrap gap-2 animate-pulse">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-6 w-20 bg-neutral-100 rounded-full" />
                ))}
              </div>
            ) : words.length > 0 ? (
              <div className="flex flex-wrap gap-2.5">
                {words.map((word) => (
                  <span
                    key={word}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-800 border border-orange-200 select-none animate-in fade-in zoom-in-95 duration-150"
                  >
                    {word}
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleRemoveWord(word)}
                      className="w-3.5 h-3.5 rounded-full hover:bg-orange-200/50 flex items-center justify-center text-orange-500 hover:text-orange-900 transition-colors ml-0.5 cursor-pointer focus:outline-none"
                      title={`Remove "${word}"`}
                    >
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center border border-dashed border-neutral-200 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-neutral-50 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h4 className="text-xs font-semibold text-neutral-600 mb-0.5">No custom flagged words</h4>
                <p className="text-[10px] text-neutral-400">Only the built-in system profanities are currently active.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

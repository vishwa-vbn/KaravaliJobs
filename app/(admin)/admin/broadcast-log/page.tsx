'use client';

import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, getDocs, doc, updateDoc, limit, startAfter, type QueryDocumentSnapshot, type DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { useUI } from '@/components/ui/UIContext';

interface BroadcastLog {
  id: string;
  jobId: string;
  jobTitle: string;
  channel: string;
  status: 'pending' | 'sent' | 'failed';
  attempts: number;
  lastError: string | null;
  createdAt: any;
}

const PAGE_SIZE = 10;

export default function BroadcastLogPage() {
  const [logs, setLogs] = useState<BroadcastLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const { confirm, toast } = useUI();

  const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);

  async function loadLogs(firstPage = true) {
    if (firstPage) {
      setLoading(true);
      lastDocRef.current = null;
    } else {
      setLoadingMore(true);
    }

    try {
      const logsRef = collection(db, 'broadcastLog');
      let q = query(
        logsRef,
        orderBy('createdAt', 'desc'),
        limit(PAGE_SIZE + 1)
      );

      if (!firstPage && lastDocRef.current) {
        q = query(
          logsRef,
          orderBy('createdAt', 'desc'),
          startAfter(lastDocRef.current),
          limit(PAGE_SIZE + 1)
        );
      }

      const snap = await getDocs(q);
      const docs = snap.docs;

      const reachedEnd = docs.length <= PAGE_SIZE;
      const pageDocs = reachedEnd ? docs : docs.slice(0, PAGE_SIZE);

      const fetched: BroadcastLog[] = pageDocs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }) as BroadcastLog);

      lastDocRef.current = pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] : null;
      setHasMore(!reachedEnd);

      if (firstPage) {
        setLogs(fetched);
      } else {
        setLogs((prev) => [...prev, ...fetched]);
      }
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    loadLogs(true);
  }, []);

  const handleRetry = async (logId: string) => {
    const ok = await confirm(
      'Retry Broadcast',
      'Are you sure you want to queue this failed broadcast for retry? The background cron job will re-attempt delivery shortly.',
      { confirmLabel: 'Queue Retry', type: 'info' }
    );
    if (!ok) return;
    setActioningId(logId);
    try {
      const docRef = doc(db, 'broadcastLog', logId);
      await updateDoc(docRef, {
        status: 'failed',
        attempts: 0,
        lastError: 'Manual retry queued...',
      });
      toast('Broadcast queued for retry successfully.', 'success');
      await loadLogs(true);
    } catch (err) {
      console.error('Failed to queue retry:', err);
      toast('Failed to queue retry.', 'error');
    } finally {
      setActioningId(null);
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
                <Link href="/" className="hover:text-black transition-colors">Home</Link>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-neutral-600">Admin Console</span>
              </div>
              <h1 className="text-xl font-bold text-black">Social Broadcast Logs</h1>
              <p className="text-sm text-neutral-500 mt-0.5">View job posting fan-out queues and retry failed broadcasts.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => loadLogs(true)}
                className="btn-secondary text-xs"
              >
                Refresh Logs
              </button>
              <Link href="/admin/ads" className="btn-primary text-xs">
                Ad Network Settings
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border-b border-neutral-100 py-5 animate-pulse">
                  <div className="h-4 bg-neutral-100 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-neutral-100 rounded w-1/4" />
                </div>
              ))}
            </div>
          ) : logs.length > 0 ? (
            <div>
              {/* Grid Header */}
              <div className="grid grid-cols-12 gap-4 py-2 border-b border-neutral-200 mb-1">
                <div className="col-span-5 text-label text-neutral-400">Job Details</div>
                <div className="col-span-2 text-label text-neutral-400">Channel</div>
                <div className="col-span-2 text-label text-neutral-400">Status</div>
                <div className="col-span-1 text-label text-neutral-400">Attempts</div>
                <div className="col-span-2 text-label text-neutral-400 text-right">Actions</div>
              </div>

              {/* Logs Rows */}
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="grid grid-cols-12 gap-4 py-4 border-b border-neutral-100 items-center hover:bg-neutral-50 -mx-2 px-2 rounded transition-colors"
                >
                  <div className="col-span-5">
                    <div className="text-sm font-semibold text-black">{log.jobTitle || 'Unknown Job'}</div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">ID: {log.jobId}</div>
                  </div>

                  <div className="col-span-2">
                    <span className="tag capitalize">
                      {log.channel}
                    </span>
                  </div>

                  <div className="col-span-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${
                      log.status === 'sent'
                        ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                        : log.status === 'pending'
                        ? 'text-yellow-700 bg-yellow-50 border border-yellow-200'
                        : 'text-red-700 bg-red-50 border border-red-200'
                    }`}>
                      {log.status === 'sent' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />}
                      {log.status === 'pending' && <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 inline-block" />}
                      {log.status === 'failed' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />}
                      {log.status}
                    </span>
                    {log.lastError && (
                      <span className="block text-[10px] text-red-500 truncate mt-1 max-w-xs" title={log.lastError}>
                        {log.lastError}
                      </span>
                    )}
                  </div>

                  <div className="col-span-1 text-xs font-semibold text-neutral-600">
                    {log.attempts} / 5
                  </div>

                  <div className="col-span-2 text-right">
                    {log.status === 'failed' && (
                      <button
                        disabled={actioningId !== null}
                        onClick={() => handleRetry(log.id)}
                        className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-black font-semibold cursor-pointer transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Load More */}
              {hasMore && (
                <div className="text-center pt-6">
                  <button
                    onClick={() => loadLogs(false)}
                    disabled={loadingMore}
                    className="btn-secondary text-xs"
                  >
                    {loadingMore ? 'Loading next page...' : 'Load More Logs'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="py-20 text-center border border-dashed border-neutral-200 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="text-sm font-semibold text-neutral-600 mb-1">No broadcast logs yet</h2>
              <p className="text-xs text-neutral-400">Queue is currently empty.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

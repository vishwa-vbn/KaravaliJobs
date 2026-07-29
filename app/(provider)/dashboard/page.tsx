'use client';

import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { collection, query, where, orderBy, getDocs, limit, startAfter, getCountFromServer, type QueryDocumentSnapshot, type DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { renewJob, deleteJob, type Job } from '@/lib/jobs/jobService';
import type { RootState } from '@/lib/redux/store';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useUI } from '@/components/ui/UIContext';

const PAGE_SIZE = 10;

export default function DashboardPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0, expired: 0 });
  const { confirm, toast } = useUI();

  const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);

  async function loadStats() {
    if (!user) return;
    try {
      const jobsRef = collection(db, 'jobs');
      const totalQuery = query(jobsRef, where('providerId', '==', user.uid));
      const activeQuery = query(jobsRef, where('providerId', '==', user.uid), where('status', '==', 'active'));

      const [totalSnap, activeSnap] = await Promise.all([
        getCountFromServer(totalQuery),
        getCountFromServer(activeQuery)
      ]);

      const total = totalSnap.data().count;
      const active = activeSnap.data().count;
      setStats({
        total,
        active,
        expired: Math.max(0, total - active)
      });
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    }
  }

  async function loadJobs(firstPage = true) {
    if (!user) return;

    if (firstPage) {
      setLoading(true);
      lastDocRef.current = null;
    } else {
      setLoadingMore(true);
    }

    try {
      const jobsRef = collection(db, 'jobs');
      let q = query(
        jobsRef,
        where('providerId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(PAGE_SIZE + 1)
      );

      if (!firstPage && lastDocRef.current) {
        q = query(
          jobsRef,
          where('providerId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          startAfter(lastDocRef.current),
          limit(PAGE_SIZE + 1)
        );
      }

      const snap = await getDocs(q);
      const docs = snap.docs;

      const reachedEnd = docs.length <= PAGE_SIZE;
      const pageDocs = reachedEnd ? docs : docs.slice(0, PAGE_SIZE);

      const fetched: Job[] = pageDocs.map((docSnap) => ({
        jobId: docSnap.id,
        ...docSnap.data()
      }) as Job);

      lastDocRef.current = pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] : null;
      setHasMore(!reachedEnd);

      if (firstPage) {
        setJobs(fetched);
      } else {
        setJobs((prev) => [...prev, ...fetched]);
      }
    } catch (err) {
      console.error('Failed to load dashboard listings:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    if (user) {
      loadStats();
      loadJobs(true);
    }
  }, [user]);

  const handleRenew = async (jobId: string) => {
    const ok = await confirm(
      'Renew Listing',
      'Are you sure you want to renew this job listing for another 30 days?',
      { confirmLabel: 'Renew Listing', type: 'info' }
    );
    if (ok) {
      try {
        await renewJob(jobId);
        toast('Listing renewed successfully!', 'success');
        await loadStats();
        await loadJobs(true);
      } catch (err) {
        console.error('Failed to renew job:', err);
        toast('Failed to renew job listing.', 'error');
      }
    }
  };

  const handleDelete = async (jobId: string) => {
    const ok = await confirm(
      'Delete Listing',
      'Are you sure you want to permanently delete this job listing? This action cannot be undone.',
      { confirmLabel: 'Delete Listing', type: 'danger' }
    );
    if (ok) {
      try {
        await deleteJob(jobId);
        toast('Listing deleted successfully!', 'success');
        await loadStats();
        await loadJobs(true);
      } catch (err) {
        console.error('Failed to delete job:', err);
        toast('Failed to delete job listing.', 'error');
      }
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
              <h1 className="text-xl font-bold text-black">Employer Dashboard</h1>
              <p className="text-sm text-neutral-500 mt-0.5">
                {user?.displayName && <span className="font-medium text-neutral-700">{user.displayName} · </span>}
                Manage your job listings
              </p>
            </div>
            <Link href="/dashboard/new-job" className="btn-primary flex-shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Post New Job
            </Link>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
          {/* Stats bar */}
          {!loading && stats.total > 0 && (
            <div className="grid grid-cols-3 gap-0 border border-neutral-200 rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-r border-neutral-200">
                <p className="text-2xl font-bold text-black">{stats.total}</p>
                <p className="text-label text-neutral-400 mt-0.5">Total Listings</p>
              </div>
              <div className="px-5 py-4 border-r border-neutral-200">
                <p className="text-2xl font-bold text-black">{stats.active}</p>
                <p className="text-label text-neutral-400 mt-0.5">Active</p>
              </div>
              <div className="px-5 py-4">
                <p className="text-2xl font-bold text-black">{stats.expired}</p>
                <p className="text-label text-neutral-400 mt-0.5">Expired</p>
              </div>
            </div>
          )}

          {/* Listings */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border-b border-neutral-100 py-5 animate-pulse">
                  <div className="h-4 bg-neutral-100 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-neutral-100 rounded w-1/4" />
                </div>
              ))}
            </div>
          ) : jobs.length > 0 ? (
            <div>
              {/* Table header */}
              <div className="grid grid-cols-12 gap-4 py-2 border-b border-neutral-200 mb-1">
                <div className="col-span-4 text-label text-neutral-400">Job</div>
                <div className="col-span-2 text-label text-neutral-400">Status</div>
                <div className="col-span-2 text-label text-neutral-400">Expires</div>
                <div className="col-span-4 text-label text-neutral-400 text-right">Actions</div>
              </div>

              {jobs.map((job) => {
                const daysLeft = job.expiresAt
                  ? Math.max(0, Math.ceil(
                      (new Date(job.expiresAt.seconds ? job.expiresAt.seconds * 1000 : job.expiresAt).getTime() - Date.now())
                      / (1000 * 60 * 60 * 24)
                    ))
                  : 0;
                const isExpired = daysLeft === 0;

                return (
                  <div
                    key={job.jobId}
                    className="grid grid-cols-12 gap-4 py-4 border-b border-neutral-100 items-center hover:bg-neutral-50 -mx-2 px-2 rounded transition-colors"
                  >
                    {/* Job info */}
                    <div className="col-span-4">
                      <Link
                        href={`/jobs/${job.jobId}`}
                        className="text-sm font-semibold text-black hover:underline underline-offset-2 block truncate"
                      >
                        {job.title}
                      </Link>
                      <p className="text-xs text-neutral-500 mt-0.5 truncate">
                        {job.companyName} · {job.location}
                        {job.category && ` · ${job.category}`}
                      </p>
                    </div>

                    {/* Status */}
                    <div className="col-span-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${
                        job.status === 'active'
                          ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                          : 'text-neutral-500 bg-neutral-100 border border-neutral-200'
                      }`}>
                        {job.status === 'active' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        )}
                        {job.status}
                      </span>
                    </div>

                    {/* Expires */}
                    <div className="col-span-2">
                      <span className={`text-xs font-medium ${isExpired ? 'text-red-500' : 'text-neutral-500'}`}>
                        {isExpired ? 'Expired' : `${daysLeft}d left`}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-4 flex items-center justify-end gap-4 flex-wrap">
                      <Link
                        href={`/jobs/${job.jobId}`}
                        className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-black transition-colors font-medium"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </Link>
                      <Link
                        href={`/dashboard/edit-job/${job.jobId}`}
                        className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-black transition-colors font-medium"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Edit
                      </Link>
                      <button
                        onClick={() => handleRenew(job.jobId)}
                        className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-black transition-colors font-medium cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                        Renew
                      </button>
                      <button
                        onClick={() => handleDelete(job.jobId)}
                        className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-red-600 transition-colors font-medium cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Load More Button */}
              {hasMore && (
                <div className="text-center pt-6">
                  <button
                    onClick={() => loadJobs(false)}
                    disabled={loadingMore}
                    className="btn-secondary text-xs"
                  >
                    {loadingMore ? 'Loading next page...' : 'Load More Listings'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="py-20 text-center">
              <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-sm font-semibold text-neutral-600 mb-1">No job listings yet</h2>
              <p className="text-xs text-neutral-400 mb-5">
                Post your first job listing to reach candidates in Udupi & Mangalore.
              </p>
              <Link href="/dashboard/new-job" className="btn-primary">
                Post Your First Job
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, limit, startAfter, type QueryDocumentSnapshot, type DocumentData } from 'firebase/firestore';
import { getIdToken } from 'firebase/auth';
import { db, auth } from '@/lib/firebase/client';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { useUI } from '@/components/ui/UIContext';

interface Job {
  jobId: string;
  title: string;
  companyName: string;
  location: string;
  specificArea?: string;
  jobType: string;
  salaryRange?: string;
  description: string;
  applyMethod: string;
  applyUrl?: string;
  phone?: string;
  category: string;
  createdAt: any;
  status: 'pending_review' | 'active' | 'expired' | 'flagged' | 'suspended' | 'rejected';
}

type FilterStatus = 'needs_action' | 'pending_review' | 'flagged' | 'active' | 'expired' | 'suspended' | 'all';

const PAGE_SIZE = 10;

export default function AdminModerationPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('needs_action');
  const [searchQuery, setSearchQuery] = useState('');
  const { confirm, showAlert, toast } = useUI();

  const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);

  async function loadJobs(firstPage = true) {
    if (firstPage) {
      setLoading(true);
      lastDocRef.current = null;
    } else {
      setLoadingMore(true);
    }

    try {
      const jobsRef = collection(db, 'jobs');
      const conditions: any[] = [];

      if (statusFilter === 'needs_action') {
        conditions.push(where('status', 'in', ['pending_review', 'flagged']));
      } else if (statusFilter !== 'all') {
        conditions.push(where('status', '==', statusFilter));
      }

      let q = query(
        jobsRef,
        ...conditions,
        orderBy('createdAt', 'desc'),
        limit(PAGE_SIZE + 1)
      );

      if (!firstPage && lastDocRef.current) {
        q = query(
          jobsRef,
          ...conditions,
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
        ...docSnap.data(),
      }) as Job);

      lastDocRef.current = pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] : null;
      setHasMore(!reachedEnd);

      if (firstPage) {
        setJobs(fetched);
      } else {
        setJobs((prev) => [...prev, ...fetched]);
      }
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  // Reload when status filter changes
  useEffect(() => {
    loadJobs(true);
  }, [statusFilter]);

  const handleApprove = async (jobId: string) => {
    const ok = await confirm(
      'Approve Job Listing',
      'Are you sure you want to approve this job listing? It will go live immediately and broadcast to Telegram.',
      { confirmLabel: 'Approve Job', type: 'info' }
    );
    if (!ok) return;
    setActioningId(jobId);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Not authenticated');
      const idToken = await getIdToken(currentUser);

      const res = await fetch('/api/jobs/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ jobId }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Approval failed');
      }

      const data = await res.json();
      console.log(`[Moderation] Approved ${jobId} — telegram: ${data.telegram}`);
      toast('Job approved and broadcasted successfully!', 'success');
      await loadJobs(true);
    } catch (err: any) {
      console.error('Failed to approve job:', err);
      showAlert('Approval Failed', `Error approving job: ${err?.message || err}`);
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (jobId: string) => {
    const ok = await confirm(
      'Reject/Suspend Job Listing',
      'Are you sure you want to reject/suspend this job listing? It will be taken offline.',
      { confirmLabel: 'Reject/Suspend', type: 'danger' }
    );
    if (!ok) return;
    setActioningId(jobId);
    try {
      const jobRef = doc(db, 'jobs', jobId);
      await updateDoc(jobRef, { status: 'suspended' });
      toast('Job listing rejected/suspended.', 'warning');
      await loadJobs(true);
    } catch (err) {
      console.error('Failed to reject job:', err);
      showAlert('Operation Failed', 'An error occurred while rejecting the job.');
    } finally {
      setActioningId(null);
    }
  };

  const handleDelete = async (jobId: string) => {
    const ok = await confirm(
      'Delete Job Listing',
      'Are you sure you want to permanently delete this job listing? This action cannot be undone.',
      { confirmLabel: 'Delete Permanently', type: 'danger' }
    );
    if (!ok) return;
    setActioningId(jobId);
    try {
      const jobRef = doc(db, 'jobs', jobId);
      await deleteDoc(jobRef);
      toast('Job listing permanently deleted.', 'success');
      await loadJobs(true);
    } catch (err) {
      console.error('Failed to delete job:', err);
      showAlert('Operation Failed', 'An error occurred while deleting the job.');
    } finally {
      setActioningId(null);
    }
  };

  // Substring search on title, company, or description across currently loaded items
  const filteredJobs = jobs.filter((job) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      job.title?.toLowerCase().includes(q) ||
      job.companyName?.toLowerCase().includes(q) ||
      job.description?.toLowerCase().includes(q) ||
      job.location?.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>;
      case 'pending_review':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Pending Review</span>;
      case 'flagged':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">Flagged (Explicit)</span>;
      case 'suspended':
      case 'rejected':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200">Suspended</span>;
      case 'expired':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">Expired</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">{status}</span>;
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
                <span className="text-neutral-600">Job Moderation</span>
              </div>
              <h1 className="text-xl font-bold text-black">Moderation &amp; List Management</h1>
              <p className="text-sm text-neutral-500 mt-0.5">Review pending submissions, flagged explicit items, or suspend active postings.</p>
            </div>
            <button onClick={() => loadJobs(true)} className="btn-secondary text-xs flex-shrink-0">
              Refresh Data
            </button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="border-b border-neutral-100 bg-neutral-50/30 py-3">
          <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {[
                { id: 'needs_action', label: 'Needs Action' },
                { id: 'flagged', label: 'Flagged' },
                { id: 'pending_review', label: 'Pending' },
                { id: 'active', label: 'Active' },
                { id: 'expired', label: 'Expired' },
                { id: 'suspended', label: 'Suspended' },
                { id: 'all', label: 'All Jobs' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setStatusFilter(filter.id as FilterStatus)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border whitespace-nowrap transition-all cursor-pointer ${
                    statusFilter === filter.id
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search loaded jobs..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-neutral-200 rounded-lg focus:border-black focus:outline-none transition-colors"
              />
              <svg className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
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
          ) : filteredJobs.length > 0 ? (
            <div className="space-y-6">
              {filteredJobs.map((job) => (
                <div
                  key={job.jobId}
                  className="border border-neutral-200 rounded-lg p-6 space-y-4 hover:border-neutral-400 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-3 border-b border-neutral-100">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                        {getStatusBadge(job.status)}
                        <span className="tag">{job.jobType}</span>
                        <span className="tag">{job.category}</span>
                        {job.location && <span className="tag">{job.location}</span>}
                      </div>
                      <h2 className="text-base font-bold text-black">{job.title}</h2>
                      <p className="text-xs text-neutral-500 font-semibold">{job.companyName}</p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {(job.status !== 'active') && (
                        <button
                          onClick={() => handleApprove(job.jobId)}
                          disabled={actioningId !== null}
                          className="btn-primary text-xs"
                        >
                          Approve/Activate
                        </button>
                      )}
                      {(job.status === 'active' || job.status === 'pending_review' || job.status === 'flagged') && (
                        <button
                          onClick={() => handleReject(job.jobId)}
                          disabled={actioningId !== null}
                          className="btn-secondary text-xs text-amber-600 hover:text-amber-700"
                        >
                          Suspend
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(job.jobId)}
                        disabled={actioningId !== null}
                        className="btn-secondary text-xs text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-neutral-400 font-bold block uppercase tracking-wider mb-0.5">Area / Specific Location</span>
                      <span className="text-neutral-700">{job.specificArea || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 font-bold block uppercase tracking-wider mb-0.5">Salary Range</span>
                      <span className="text-neutral-700">{job.salaryRange || 'Not specified'}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-neutral-400 font-bold block uppercase tracking-wider mb-1">Description</span>
                    <p className="text-xs text-neutral-600 leading-relaxed whitespace-pre-wrap">{job.description}</p>
                  </div>

                  <div className="pt-3 border-t border-neutral-100 text-xs">
                    <span className="text-neutral-400 font-bold block uppercase tracking-wider mb-1">How to Apply</span>
                    <p className="text-neutral-600 whitespace-pre-wrap">{job.applyMethod}</p>
                  </div>
                </div>
              ))}

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
            <div className="py-20 text-center border border-dashed border-neutral-200 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-sm font-semibold text-neutral-600 mb-1">No jobs match this filter</h2>
              <p className="text-xs text-neutral-400">All submissions have been reviewed or are empty.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

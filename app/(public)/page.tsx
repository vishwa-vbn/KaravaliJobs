'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchActiveJobsPage, type Job, type JobPage } from '@/lib/jobs/jobService';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import type { RootState } from '@/lib/redux/store';
import JobFilterBar from '@/components/jobs/JobFilterBar';
import JobCard from '@/components/jobs/JobCard';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AdSlot from '@/components/ads/AdSlot';
import TelegramWidget from '@/components/social/TelegramWidget';
import { getCategoryTagClass } from '@/lib/utils/colorUtils';

export default function HomePage() {
  const { location, jobType, category, search } = useSelector(
    (state: RootState) => state.filters
  );

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [totalLoaded, setTotalLoaded] = useState(0);

  // Cursor stored in a ref so it doesn't re-trigger useEffect
  const cursorRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);

  // Track which filter combo was last fetched to detect filter changes
  const lastFiltersRef = useRef({ location, jobType, category });

  const loadFirstPage = useCallback(async () => {
    setLoading(true);
    cursorRef.current = null;
    try {
      const page: JobPage = await fetchActiveJobsPage({ location, jobType, category });
      setJobs(page.jobs);
      setHasMore(page.hasMore);
      setTotalLoaded(page.jobs.length);
      cursorRef.current = page.lastDoc;
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  }, [location, jobType, category]);

  // Re-fetch first page whenever filters change
  useEffect(() => {
    lastFiltersRef.current = { location, jobType, category };
    loadFirstPage();
  }, [loadFirstPage]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const page: JobPage = await fetchActiveJobsPage(
        { location, jobType, category },
        cursorRef.current
      );
      setJobs((prev) => [...prev, ...page.jobs]);
      setHasMore(page.hasMore);
      setTotalLoaded((prev) => prev + page.jobs.length);
      cursorRef.current = page.lastDoc;
    } catch (err) {
      console.error('Failed to load more jobs:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Client-side keyword search — filters the already-loaded page
  const filteredJobs = jobs.filter((job) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      job.title.toLowerCase().includes(q) ||
      job.companyName.toLowerCase().includes(q) ||
      job.description.toLowerCase().includes(q)
    );
  });

  const activeFilterCount = [location, jobType, category].filter(Boolean).length;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      <main className="flex-grow">
        {/* Hero */}
        <div className="hero-section">
          <div className="max-w-6xl mx-auto px-6 py-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block animate-pulse" />
                Karavali Region · Udupi &amp; Mangalore
              </span>
            </div>
            <h1 className="text-display mb-2">Find Local Jobs</h1>
            <p className="text-body text-slate-500 max-w-md">
              Browse active job listings in Udupi and Mangalore. No account needed to search.
            </p>
          </div>
        </div>

        {/* Ad slot */}
        <div className="max-w-6xl mx-auto px-6 pt-4">
          <AdSlot slot="header" />
        </div>

        {/* Main content */}
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Left: listings */}
            <div className="flex-1 min-w-0 w-full">
              {/* Telegram channel subscription prompt */}
              <div className="mb-6">
                <TelegramWidget />
              </div>

              {/* Filter bar */}
              <div className="mb-6">
                <JobFilterBar />
              </div>

              {/* Results header */}
              <div className="flex items-center justify-between mb-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-subheading">
                    {loading ? (
                      'Loading...'
                    ) : (
                      <span>
                        <span className="text-indigo-600">{filteredJobs.length}</span>
                        {hasMore && !search && <span className="text-slate-400">+</span>}
                        {' '}job{filteredJobs.length !== 1 ? 's' : ''} found
                      </span>
                    )}
                  </h2>
                  {category && (
                    <span className={`tag ${getCategoryTagClass(category)}`}>{category}</span>
                  )}
                  {location && (
                    <span className="tag bg-blue-50 text-blue-700 border border-blue-200">{location}</span>
                  )}
                  {jobType && (
                    <span className="tag bg-violet-50 text-violet-700 border border-violet-200">{jobType}</span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Sorted by: Latest</span>
              </div>

              {/* Job list */}
              {loading ? (
                <div className="space-y-0 py-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="py-5 border-b border-slate-100 animate-pulse px-0">
                      <div className="h-4 bg-slate-100 rounded-full w-2/5 mb-2.5" />
                      <div className="h-3 bg-slate-100 rounded-full w-1/4 mb-3" />
                      <div className="flex gap-2">
                        <div className="h-5 bg-slate-100 rounded w-16" />
                        <div className="h-5 bg-slate-100 rounded w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredJobs.length > 0 ? (
                <div>
                  {filteredJobs.map((job, index) => (
                    <div key={job.jobId}>
                      <JobCard job={job} />
                      {index > 0 && index % 5 === 0 && (
                        <div className="py-3">
                          <AdSlot slot="native" />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Load More / Pagination */}
                  {!search && (
                    <div className="mt-6 flex flex-col items-center gap-2">
                      {hasMore ? (
                        <button
                          onClick={loadMore}
                          disabled={loadingMore}
                          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-indigo-300 hover:text-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loadingMore ? (
                            <>
                              <svg className="w-4 h-4 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Loading...
                            </>
                          ) : (
                            <>
                              Load more jobs
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </>
                          )}
                        </button>
                      ) : totalLoaded > 10 ? (
                        <p className="text-xs text-slate-400 font-medium">
                          ✓ All {totalLoaded} jobs loaded
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-16 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-slate-500">No jobs match your search</p>
                  <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search term</p>
                </div>
              )}
            </div>

            {/* Right: sidebar */}
            <div className="lg:w-72 flex-shrink-0 space-y-4 lg:sticky lg:top-20">
              {/* Ad sidebar */}
              <div className="panel-sponsored">
                <p className="text-label text-slate-400 mb-3">Sponsored</p>
                <AdSlot slot="sidebar" />
              </div>

              {/* Post a job CTA */}
              <div className="panel-cta">
                <h3 className="text-sm font-bold text-white mb-1.5">Hiring in Karavali?</h3>
                <p className="text-xs text-indigo-200 leading-relaxed mb-3">
                  Reach local candidates in Udupi &amp; Mangalore. Post a job listing in minutes.
                </p>
                <a
                  href="/auth/register"
                  className="inline-flex items-center justify-center gap-1.5 w-full px-4 py-2 bg-white text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  Post a Job →
                </a>
              </div>

              {/* Alerts CTA */}
              <div className="panel-alerts">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-teal-900">Job Alerts</h3>
                </div>
                <p className="text-xs text-teal-700 leading-relaxed mb-3">
                  Get notified when new jobs matching your profile are posted.
                </p>
                <a href="/alerts-signup" className="inline-flex items-center justify-center w-full px-4 py-2 bg-teal-700 text-white text-xs font-bold rounded-lg hover:bg-teal-800 transition-colors">
                  Set Up Alerts
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

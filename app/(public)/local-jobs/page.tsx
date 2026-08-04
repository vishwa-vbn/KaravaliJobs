'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AdSlot from '@/components/ads/AdSlot';
import { fetchLocalJobs, LocalJob } from '@/lib/jobs/localJobService';

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; accent: string }> = {
  'IT & Software': { bg: 'bg-indigo-50/70', text: 'text-indigo-800', border: 'border-indigo-100', accent: 'bg-indigo-500' },
  'Sales & Marketing': { bg: 'bg-amber-50/70', text: 'text-amber-800', border: 'border-amber-100', accent: 'bg-amber-500' },
  'Finance & Accounts': { bg: 'bg-emerald-50/70', text: 'text-emerald-800', border: 'border-emerald-100', accent: 'bg-emerald-500' },
  'Healthcare': { bg: 'bg-rose-50/70', text: 'text-rose-800', border: 'border-rose-100', accent: 'bg-rose-500' },
  'Office Admin': { bg: 'bg-sky-50/70', text: 'text-sky-800', border: 'border-sky-100', accent: 'bg-sky-500' },
  'Hospitality': { bg: 'bg-teal-50/70', text: 'text-teal-800', border: 'border-teal-100', accent: 'bg-teal-500' },
  'Retail': { bg: 'bg-purple-50/70', text: 'text-purple-800', border: 'border-purple-100', accent: 'bg-purple-500' },
  'Education': { bg: 'bg-violet-50/70', text: 'text-violet-800', border: 'border-violet-100', accent: 'bg-violet-500' },
  'Other': { bg: 'bg-slate-50/80', text: 'text-slate-800', border: 'border-slate-200', accent: 'bg-slate-500' }
};

export default function LocalJobsPublicPage() {
  const [jobs, setJobs] = useState<LocalJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    async function loadJobs() {
      const data = await fetchLocalJobs();
      setJobs(data);
      setLoading(false);
    }
    loadJobs();
  }, []);

  const locations = Array.from(new Set(jobs.map(j => j.location).filter(Boolean)));
  const categories = Array.from(new Set(jobs.map(j => j.category).filter(Boolean)));

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLocation = !selectedLocation || job.location.toLowerCase() === selectedLocation.toLowerCase();
    const matchesCategory = !selectedCategory || job.category === selectedCategory;

    return matchesSearch && matchesLocation && matchesCategory;
  });

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      <Header />

      <main className="flex-grow max-w-6xl w-full mx-auto px-6 py-8">
        {/* Page Hero Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 uppercase tracking-widest mb-3 border border-indigo-100/60">
            📰 Newspaper Jobs
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
            Local Jobs
          </h1>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Daily listings extracted from local print newspapers like Udayavani, Vijaya Karnataka and others. Updated daily, no signup required.
          </p>
        </div>

        {/* Filters Panel */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-grow relative">
              <input
                type="text"
                placeholder="Search local listings by role, keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Filters */}
            <div className="flex gap-3 flex-wrap">
              {/* Location Select */}
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none cursor-pointer"
              >
                <option value="">All Locations</option>
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>

              {/* Category Select */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none cursor-pointer"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {(selectedLocation || selectedCategory || searchQuery) && (
                <button
                  onClick={() => { setSelectedLocation(''); setSelectedCategory(''); setSearchQuery(''); }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold px-2 py-1.5 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Ad slot */}
        <div className="mb-6">
          <AdSlot slot="header" />
        </div>

        {/* Pinterest Masonry Grid */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Loading local jobs...</p>
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 [column-fill:_balance]">
            {filteredJobs.map((job) => {
              const colors = CATEGORY_COLORS[job.category] || CATEGORY_COLORS.Other;
              return (
                <div 
                  key={job.id}
                  className="break-inside-avoid mb-4 bg-white border border-slate-200/70 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col"
                >
                  {/* Decorative Category Strip */}
                  <div className={`h-1.5 w-full ${colors.accent}`} />

                  <div className="p-5 flex-grow flex flex-col justify-between">
                    <div>
                      {/* Top Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-3">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${colors.bg} ${colors.text} border ${colors.border}`}>
                          {job.category}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-semibold text-slate-500 bg-slate-100 border border-slate-200/50 flex items-center gap-1">
                          <svg className="w-2.5 h-2.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                          </svg>
                          {job.location}
                        </span>
                      </div>

                      {/* Job Title */}
                      <h3 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                        {job.title}
                      </h3>

                      {/* Company Name */}
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">
                        {job.companyName}
                      </p>

                      {/* Salary Range */}
                      {job.salaryRange && (
                        <p className="text-[11px] text-emerald-700 font-extrabold bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-1 mt-2 inline-block">
                          ₹ {job.salaryRange}
                        </p>
                      )}

                      {/* Description */}
                      <div className="text-xs text-slate-600 mt-3.5 leading-relaxed whitespace-pre-line border-t border-slate-100/60 pt-3">
                        {job.description}
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-[9px] text-slate-400 font-semibold flex items-center gap-1">
                        <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zM14.25 15h.008v.008H14.25V15zm0 2.25h.008v.008H14.25v-.008zm2.25-2.25h.008v.008H16.5V15zm0 2.25h.008v.008H16.5v-.008z" />
                        </svg>
                        Paper: {job.dateString}
                      </span>

                      {job.phone && (
                        <a
                          href={`tel:${job.phone}`}
                          className="inline-flex items-center gap-1 bg-slate-900 hover:bg-indigo-600 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-sm"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.387a12.035 12.035 0 01-7.108-7.108c-.115-.44.05-1.21.387-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                          </svg>
                          Call Now
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-slate-200/80 rounded-2xl py-16 px-6 text-center shadow-sm">
            <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <p className="text-sm font-bold text-slate-500">No local jobs match your criteria</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting search parameters or clearing filters.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

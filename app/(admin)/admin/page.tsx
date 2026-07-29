'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { ADMIN_MODULE_COLORS } from '@/lib/utils/colorUtils';

interface SystemStats {
  totalUsers: number;
  totalSeekers: number;
  totalProviders: number;
  totalJobs: number;
  activeJobs: number;
  pendingJobs: number;
  flaggedJobs: number;
  suspendedJobs: number;
  expiredJobs: number;
  broadcastsTotal: number;
  broadcastsFailed: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalSeekers: 0,
    totalProviders: 0,
    totalJobs: 0,
    activeJobs: 0,
    pendingJobs: 0,
    flaggedJobs: 0,
    suspendedJobs: 0,
    expiredJobs: 0,
    broadcastsTotal: 0,
    broadcastsFailed: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        // Query users
        const usersSnap = await getDocs(collection(db, 'users'));
        let seekers = 0;
        let providers = 0;
        usersSnap.forEach((doc) => {
          const u = doc.data();
          if (u.role === 'seeker') seekers++;
          if (u.role === 'provider') providers++;
        });

        // Query jobs
        const jobsSnap = await getDocs(collection(db, 'jobs'));
        let active = 0;
        let pending = 0;
        let flagged = 0;
        let suspended = 0;
        let expired = 0;
        jobsSnap.forEach((doc) => {
          const j = doc.data();
          if (j.status === 'active') active++;
          if (j.status === 'pending_review') pending++;
          if (j.status === 'flagged') flagged++;
          if (j.status === 'suspended') suspended++;
          if (j.status === 'expired') expired++;
        });

        // Query broadcasts (channelsQueue)
        const broadcastSnap = await getDocs(collection(db, 'channelsQueue'));
        let failedBroadcasts = 0;
        broadcastSnap.forEach((doc) => {
          const b = doc.data();
          if (b.status === 'failed') failedBroadcasts++;
        });

        setStats({
          totalUsers: usersSnap.size,
          totalSeekers: seekers,
          totalProviders: providers,
          totalJobs: jobsSnap.size,
          activeJobs: active,
          pendingJobs: pending,
          flaggedJobs: flagged,
          suspendedJobs: suspended,
          expiredJobs: expired,
          broadcastsTotal: broadcastSnap.size,
          broadcastsFailed: failedBroadcasts,
        });
      } catch (err) {
        console.error('Failed to load system stats:', err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  const adminModules = [
    {
      title: 'Job Moderation Queue',
      desc: 'Approve or reject new job postings before they go live.',
      link: '/admin/moderation',
      count: stats.pendingJobs + stats.flaggedJobs,
      countLabel: 'Needs action',
      badgeClass: stats.flaggedJobs > 0 ? 'badge-expired' : 'badge-pending',
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'User Management',
      desc: 'View registered users, change roles, promote or suspend accounts.',
      link: '/admin/users',
      count: stats.totalUsers,
      countLabel: 'Total users',
      badgeClass: 'badge-role-seeker',
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      title: 'Social Broadcast Queue',
      desc: 'View automated WhatsApp/Telegram share logs and retries.',
      link: '/admin/broadcast-log',
      count: stats.broadcastsFailed,
      countLabel: 'Failed retries',
      badgeClass: stats.broadcastsFailed > 0 ? 'badge-expired' : 'badge-active',
      iconBg: 'bg-teal-50',
      iconColor: 'text-teal-600',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 10.742l-1.99-1.99a2.25 2.25 0 00-3.182 0m11.364 0l-1.99 1.99m-1.988-1.988a2.247 2.247 0 00-3.181 0m6.362 0l-1.99 1.99m-3 1.875a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm6 0a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0z" />
        </svg>
      ),
    },
    {
      title: 'Ad Networks Config',
      desc: 'Configure Adsterra / PropellerAds zone tags and switch priority.',
      link: '/admin/ads',
      count: null,
      countLabel: '',
      badgeClass: '',
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
    },
    {
      title: 'Database Archive & Backup',
      desc: 'Backup, purge 30-day-old expired jobs, or restore from local JSON files.',
      link: '/admin/backup',
      count: null,
      countLabel: '',
      badgeClass: '',
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-600',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v12m0 0l-4-4m4 4l4-4M2 4h20a2 2 0 012 2v12a2 2 0 01-2 2H2a2 2 0 01-2-2V6a2 2 0 012-2z" />
        </svg>
      ),
    },
    {
      title: 'Flagged Words Manager',
      desc: 'Add or remove explicit words to automatically flag job submissions.',
      link: '/admin/moderation/words',
      count: null,
      countLabel: '',
      badgeClass: '',
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-600',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      <main className="flex-grow">
        {/* Page header */}
        <div className="border-b border-slate-200 bg-white">
          <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-label text-slate-400 mb-1">Administrative Dashboard</p>
              <h1 className="text-display mb-1">
                Console <span className="text-indigo-600">Overview</span>
              </h1>
              <p className="text-body text-slate-500 max-w-md">
                Monitor active listings, verify users, manage ad networks, and view delivery metrics.
              </p>
            </div>
            <Link href="/dashboard/new-job" className="btn-primary flex-shrink-0 self-start sm:self-center">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Post New Job
            </Link>
          </div>
        </div>

        {/* Stats grid */}
        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Color-coded stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-slate-200 rounded-xl overflow-hidden mb-10 shadow-sm">
            {/* Total Users — Indigo */}
            <div className="stat-card stat-users" style={{ borderBottomWidth: '1px', borderColor: '#e2e8f0' }}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <p className="stat-card-label">Total Users</p>
              <p className="stat-card-value">{loading ? '—' : stats.totalUsers}</p>
              <p className="stat-card-sub">{stats.totalSeekers} seekers · {stats.totalProviders} providers</p>
            </div>

            {/* Active Jobs — Emerald */}
            <div className="stat-card stat-jobs" style={{ borderBottomWidth: '1px', borderColor: '#e2e8f0' }}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <p className="stat-card-label">Active Jobs</p>
              <p className="stat-card-value">{loading ? '—' : stats.activeJobs}</p>
              <p className="stat-card-sub">{stats.expiredJobs} expired listings</p>
            </div>

            {/* Moderation Queue — Amber */}
            <div className="stat-card stat-pending" style={{ borderBottomWidth: '1px', borderColor: '#e2e8f0' }}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="stat-card-label">Moderation &amp; Flags</p>
              <p className="stat-card-value">{loading ? '—' : stats.pendingJobs + stats.flaggedJobs}</p>
              <p className="stat-card-sub">{stats.flaggedJobs} flagged · {stats.pendingJobs} pending</p>
            </div>

            {/* Broadcast Errors — Red */}
            <div className="stat-card stat-error" style={{ borderBottomWidth: '1px', borderColor: '#e2e8f0' }}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="stat-card-label">Broadcast Errors</p>
              <p className="stat-card-value">{loading ? '—' : stats.broadcastsFailed}</p>
              <p className="stat-card-sub">Failed delivery attempts</p>
            </div>
          </div>

          {/* Module Grid */}
          <div className="space-y-4">
            <h2 className="text-subheading mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <span className="w-1 h-5 bg-indigo-500 rounded-full inline-block" />
              Management Consoles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {adminModules.map((mod) => (
                <Link
                  key={mod.title}
                  href={mod.link}
                  className="admin-module-card no-underline"
                >
                  <div className={`admin-module-icon ${mod.iconBg} ${mod.iconColor} flex-shrink-0`}>
                    {mod.icon}
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900">{mod.title}</h3>
                      {mod.count !== null && mod.count !== undefined && mod.count > 0 && (
                        <span className={mod.badgeClass || 'tag'}>
                          {mod.count} {mod.countLabel}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{mod.desc}</p>
                  </div>
                  <svg className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

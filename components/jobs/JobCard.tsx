import Link from 'next/link';
import type { Job } from '@/lib/jobs/jobService';
import { getJobTypeTagClass, getCategoryTagClass } from '@/lib/utils/colorUtils';

interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {
  const expiresDays = job.expiresAt
    ? Math.max(
        0,
        Math.ceil(
          (new Date(job.expiresAt.seconds ? job.expiresAt.seconds * 1000 : job.expiresAt).getTime() -
            Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  const isNew = job.createdAt
    ? Date.now() - new Date(job.createdAt.seconds ? job.createdAt.seconds * 1000 : job.createdAt).getTime() < 2 * 24 * 60 * 60 * 1000
    : false;

  const isUrgent = expiresDays <= 3 && expiresDays > 0;

  return (
    <Link href={`/jobs/${job.jobId}`} className="job-card group block">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
              {job.title}
            </span>
            {isNew && (
              <span className="badge-new">New</span>
            )}
          </div>

          {/* Company */}
          <p className="text-xs text-slate-500 font-medium mb-3 flex items-center gap-1.5">
            <svg className="w-3 h-3 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            {job.companyName}
          </p>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {/* Location */}
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {job.specificArea ? `${job.specificArea}, ${job.location}` : job.location}
            </span>

            {/* Salary */}
            {job.salaryRange && (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
                <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {job.salaryRange}
              </span>
            )}

            {/* Job type tag */}
            <span className={`tag ${getJobTypeTagClass(job.jobType)}`}>
              {job.jobType}
            </span>

            {/* Category tag */}
            {job.category && (
              <span className={`tag ${getCategoryTagClass(job.category)}`}>
                {job.category}
              </span>
            )}
          </div>
        </div>

        {/* Right side — expires indicator + arrow */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <svg
            className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all"
            fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className={`text-[11px] whitespace-nowrap font-medium ${
            isUrgent
              ? 'text-amber-600'
              : expiresDays === 0
              ? 'text-red-500'
              : 'text-slate-400'
          }`}>
            {expiresDays > 0
              ? isUrgent
                ? `⚡ ${expiresDays}d left`
                : `${expiresDays}d left`
              : '⚠ Closing soon'}
          </span>
        </div>
      </div>
    </Link>
  );
}

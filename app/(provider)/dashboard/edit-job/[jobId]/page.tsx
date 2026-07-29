'use client';

import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { fetchJobById, updateJob } from '@/lib/jobs/jobService';
import type { RootState } from '@/lib/redux/store';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';

function FormDropdown<T extends string>({
  value,
  options,
  onChange,
  labelMap,
}: {
  value: T;
  options: readonly T[] | T[];
  onChange: (val: T) => void;
  labelMap?: Record<T, string>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-1.5 px-3 py-2 border border-neutral-200 rounded-lg text-xs font-semibold text-black bg-white focus:border-black focus:outline-none transition-colors cursor-pointer select-none"
      >
        <span className="truncate">{labelMap ? labelMap[value] : value}</span>
        <svg className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-full rounded-xl bg-white border border-neutral-200 shadow-lg py-1.5 z-50 max-h-60 overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-3.5 py-2 text-left text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors duration-150 cursor-pointer"
            >
              <span className="truncate">{labelMap ? labelMap[opt] : opt}</span>
              {value === opt && (
                <svg className="w-3.5 h-3.5 text-neutral-800 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const categories = [
  'IT & Software', 'Sales & Marketing', 'Finance & Accounts', 'Healthcare',
  'Office Admin', 'Hospitality', 'Retail', 'Education', 'Other'
] as const;

type Category = typeof categories[number];

interface EditJobPageProps {
  params: {
    jobId: string;
  };
}

export default function EditJobPage({ params }: EditJobPageProps) {
  const { jobId } = params;
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [location, setLocation] = useState<'Mangalore' | 'Udupi' | 'Remote'>('Mangalore');
  const [specificArea, setSpecificArea] = useState('');
  const [jobType, setJobType] = useState<'Part-time' | 'Permanent' | 'Remote' | 'Contract'>('Permanent');
  const [salaryRange, setSalaryRange] = useState('');
  const [undisclosedSalary, setUndisclosedSalary] = useState(false);
  const [description, setDescription] = useState('');
  const [applyMethod, setApplyMethod] = useState('');
  const [applyUrl, setApplyUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState<Category>('Other');

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    async function loadJob() {
      try {
        const job = await fetchJobById(jobId);
        if (!job) {
          setError('Job listing not found.');
          setLoading(false);
          return;
        }

        if (job.providerId !== user?.uid) {
          setError('You do not have permission to edit this job listing.');
          setLoading(false);
          return;
        }

        setTitle(job.title);
        setCompanyName(job.companyName);
        setLocation(job.location);
        setSpecificArea(job.specificArea || '');
        setJobType(job.jobType);
        setSalaryRange(job.salaryRange || '');
        if (job.salaryRange === 'Competitive / As per industry standards') {
          setUndisclosedSalary(true);
        }
        setDescription(job.description);
        setApplyMethod(job.applyMethod);
        setApplyUrl(job.applyUrl || '');
        setPhone(job.phone || '');
        setCategory(job.category);
      } catch (err) {
        console.error('Failed to load job details:', err);
        setError('Error loading job details.');
      } finally {
        setLoading(false);
      }
    }

    loadJob();
  }, [jobId, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!title || !companyName || !description || !applyMethod) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await updateJob(jobId, {
        title,
        companyName,
        location,
        specificArea,
        jobType,
        salaryRange,
        description,
        applyMethod,
        applyUrl: applyUrl || undefined,
        phone: phone || undefined,
        category,
      });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Failed to update job listing.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <p className="text-sm text-neutral-400">Loading job details...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      <main className="flex-grow">
        {/* Page header */}
        <div className="border-b border-neutral-200">
          <div className="max-w-3xl mx-auto px-6 py-6">
            <nav className="flex items-center gap-1.5 text-xs text-neutral-400 mb-3">
              <Link href="/dashboard" className="hover:text-black transition-colors">Dashboard</Link>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-neutral-600">Edit Job</span>
            </nav>
            <h1 className="text-xl font-bold text-black">Edit Job Listing</h1>
            <p className="text-sm text-neutral-500 mt-1">Make changes to your active listing. All fields marked * are required.</p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-8">
          {error && (
            <div className="mb-6 px-4 py-3 border border-red-200 rounded-lg bg-red-50 text-sm text-red-700">
              {error}
            </div>
          )}

          {!error && (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Section: Basic Info */}
              <section className="space-y-4">
                <div className="pb-2 border-b border-neutral-100">
                  <h2 className="text-sm font-semibold text-black">Basic Information</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-label text-neutral-500">Job Title *</label>
                    <input
                      type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Delivery Partner, Accountant, Cashier"
                      className="field-input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-label text-neutral-500">Company Name *</label>
                    <input
                      type="text" required value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Mangalore Logistics Pvt. Ltd."
                      className="field-input"
                    />
                  </div>
                </div>
              </section>

              {/* Section: Location & Type */}
              <section className="space-y-4">
                <div className="pb-2 border-b border-neutral-100">
                  <h2 className="text-sm font-semibold text-black">Location & Job Type</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-label text-neutral-500">Location *</label>
                    <FormDropdown
                      value={location}
                      options={['Mangalore', 'Udupi', 'Remote'] as const}
                      onChange={(val) => setLocation(val as any)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-label text-neutral-500">Specific Area</label>
                    <input
                      type="text" value={specificArea} onChange={(e) => setSpecificArea(e.target.value)}
                      placeholder="e.g. Hampankatta, Kinnimulki"
                      className="field-input"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-label text-neutral-500">Job Type *</label>
                    <FormDropdown
                      value={jobType}
                      options={['Permanent', 'Part-time', 'Remote', 'Contract'] as const}
                      labelMap={{
                        Permanent: 'Permanent / Full-time',
                        'Part-time': 'Part-time',
                        Remote: 'Remote',
                        Contract: 'Contract',
                      }}
                      onChange={(val) => setJobType(val as any)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-label text-neutral-500">Job Category *</label>
                    <FormDropdown
                      value={category}
                      options={categories}
                      onChange={(val) => setCategory(val as Category)}
                    />
                  </div>
                </div>
                <div className="space-y-2.5 max-w-xs">
                  <div className="space-y-1.5">
                    <label className="text-label text-neutral-500">Salary Range</label>
                    <input
                      type="text"
                      disabled={undisclosedSalary}
                      value={undisclosedSalary ? 'Competitive / As per industry standards' : salaryRange}
                      onChange={(e) => setSalaryRange(e.target.value)}
                      placeholder="e.g. ₹12,000 – ₹18,000 / month"
                      className="field-input disabled:bg-neutral-50 disabled:text-neutral-500"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={undisclosedSalary}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setUndisclosedSalary(checked);
                        if (checked) {
                          setSalaryRange('Competitive / As per industry standards');
                        } else {
                          setSalaryRange('');
                        }
                      }}
                      className="rounded border-neutral-300 text-black focus:ring-black h-3.5 w-3.5 cursor-pointer"
                    />
                    <span className="text-xs text-neutral-600 font-medium">
                      Disclose as competitive / as per industry standards
                    </span>
                  </label>
                </div>
              </section>

              {/* Section: Description */}
              <section className="space-y-4">
                <div className="pb-2 border-b border-neutral-100">
                  <h2 className="text-sm font-semibold text-black">Job Description & Requirements</h2>
                </div>
                <div className="space-y-1.5">
                  <label className="text-label text-neutral-500">Job Description *</label>
                  <textarea
                    required rows={7} value={description} onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the role, responsibilities, work timings, qualifications required, and any other relevant details..."
                    className="field-input resize-none"
                  />
                </div>
              </section>

              {/* Section: How to Apply */}
              <section className="space-y-4">
                <div className="pb-2 border-b border-neutral-100">
                  <h2 className="text-sm font-semibold text-black">Application Details</h2>
                </div>
                <div className="space-y-1.5">
                  <label className="text-label text-neutral-500">How to Apply *</label>
                  <textarea
                    required rows={2} value={applyMethod} onChange={(e) => setApplyMethod(e.target.value)}
                    placeholder="e.g. Call +91 9876543210 or email jobs@company.com with your resume"
                    className="field-input resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-label text-neutral-500">External Apply URL</label>
                    <input
                      type="url" value={applyUrl} onChange={(e) => setApplyUrl(e.target.value)}
                      placeholder="https://linkedin.com/jobs/... or company site"
                      className="field-input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-label text-neutral-500">Contact Phone (Call / WhatsApp)</label>
                    <input
                      type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +91 9876543210"
                      className="field-input"
                    />
                  </div>
                </div>
              </section>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2 border-t border-neutral-100">
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => router.push('/dashboard')} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

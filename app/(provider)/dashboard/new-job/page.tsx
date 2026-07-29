'use client';

import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { createJob } from '@/lib/jobs/jobService';
import { getIdToken } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
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

export default function NewJobPage() {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);

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
  const [tags, setTags] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [scrapeText, setScrapeText] = useState('');
  const [importMode, setImportMode] = useState<'url' | 'text'>('url');
  const [scraping, setScraping] = useState(false);
  const [scrapeSuccess, setScrapeSuccess] = useState('');

  const handleParseText = async () => {
    if (!scrapeText) return;
    setScraping(true);
    setError('');
    setScrapeSuccess('');
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Not authenticated');
      const idToken = await getIdToken(currentUser);

      const res = await fetch('/api/jobs/parse-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ text: scrapeText }),
      });

      if (!res.ok) {
        const { error: errMessage } = await res.json();
        throw new Error(errMessage || 'Failed to extract job details.');
      }

      const { data } = await res.json();

      if (data.title) setTitle(data.title);
      if (data.companyName) setCompanyName(data.companyName);
      if (data.location) setLocation(data.location);
      if (data.specificArea) setSpecificArea(data.specificArea);
      if (data.jobType) setJobType(data.jobType);
      if (data.description) setDescription(data.description);
      if (data.salaryRange) {
        setSalaryRange(data.salaryRange);
        if (data.salaryRange === 'Competitive / As per industry standards') {
          setUndisclosedSalary(true);
        } else {
          setUndisclosedSalary(false);
        }
      }
      if (data.applyMethod) setApplyMethod(data.applyMethod);
      if (data.applyUrl) setApplyUrl(data.applyUrl);
      if (data.phone) setPhone(data.phone);
      if (data.category) setCategory(data.category);
      if (data.tags) setTags(data.tags);

      setScrapeSuccess('Job details successfully extracted and populated! Please review the fields below before submitting.');
      setScrapeText('');
    } catch (err: any) {
      setError(err?.message || 'Failed to extract job details.');
    } finally {
      setScraping(false);
    }
  };

  const handleScrape = async () => {
    if (!scrapeUrl) return;
    setScraping(true);
    setError('');
    setScrapeSuccess('');
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Not authenticated');
      const idToken = await getIdToken(currentUser);

      const res = await fetch('/api/jobs/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ url: scrapeUrl }),
      });

      if (!res.ok) {
        const { error: errMessage } = await res.json();
        throw new Error(errMessage || 'Failed to extract job details.');
      }

      const { data } = await res.json();

      if (data.title) setTitle(data.title);
      if (data.companyName) setCompanyName(data.companyName);
      if (data.location) setLocation(data.location);
      if (data.specificArea) setSpecificArea(data.specificArea);
      if (data.jobType) setJobType(data.jobType);
      if (data.description) setDescription(data.description);
      if (data.salaryRange) {
        setSalaryRange(data.salaryRange);
        if (data.salaryRange === 'Competitive / As per industry standards') {
          setUndisclosedSalary(true);
        } else {
          setUndisclosedSalary(false);
        }
      }
      if (data.applyMethod) setApplyMethod(data.applyMethod);
      if (data.applyUrl) setApplyUrl(data.applyUrl);
      if (data.phone) setPhone(data.phone);
      if (data.category) setCategory(data.category);
      if (data.tags) setTags(data.tags);

      setScrapeSuccess('Job details successfully extracted and populated! Please review the fields below before submitting.');
      setScrapeUrl('');
    } catch (err: any) {
      setError(err?.message || 'Failed to extract job details.');
    } finally {
      setScraping(false);
    }
  };

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
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Not authenticated');
      const idToken = await getIdToken(currentUser);

      const res = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
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
          tags,
        }),
      });

      if (!res.ok) {
        const { error: errMessage } = await res.json();
        throw new Error(errMessage || 'Failed to post job listing.');
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Failed to post job listing.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      <main className="flex-grow">
        {/* Page header */}
        <div className="border-b border-neutral-200">
          <div className="max-w-5xl mx-auto px-6 py-6">
            <nav className="flex items-center gap-1.5 text-xs text-neutral-400 mb-3">
              <Link href="/dashboard" className="hover:text-black transition-colors">Dashboard</Link>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-neutral-600">Post a Job</span>
            </nav>
            <h1 className="text-xl font-bold text-black">Post a New Job</h1>
            <p className="text-sm text-neutral-500 mt-1">Listing is active for 30 days. All fields marked * are required.</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-6">
              {error && (
                <div className="mb-6 px-4 py-3 border border-red-200 rounded-lg bg-red-50 text-sm text-red-700">
                  {error}
                </div>
              )}

          {/* AI Import Tool */}
          <div className="mb-8 p-5 border border-neutral-200 bg-neutral-50/50 rounded-xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-black text-white rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l8.982-11.795H14.18l.818-5.096L6 15.904h3.813z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-black flex items-center gap-1.5">
                    Autofill Job Details using Gemini AI
                    <span className="text-[10px] bg-black/5 text-black px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">Free AI</span>
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">Let AI extract and fill in all the details for you.</p>
                </div>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="flex border-b border-neutral-200 gap-4 text-xs font-semibold pb-1.5">
              <button
                type="button"
                onClick={() => { setImportMode('url'); setScrapeSuccess(''); }}
                className={`pb-1 select-none cursor-pointer border-b-2 transition-colors ${
                  importMode === 'url'
                    ? 'border-black text-black'
                    : 'border-transparent text-neutral-400 hover:text-neutral-600'
                }`}
              >
                Import from URL
              </button>
              <button
                type="button"
                onClick={() => { setImportMode('text'); setScrapeSuccess(''); }}
                className={`pb-1 select-none cursor-pointer border-b-2 transition-colors ${
                  importMode === 'text'
                    ? 'border-black text-black'
                    : 'border-transparent text-neutral-400 hover:text-neutral-600'
                }`}
              >
                Paste Copied Text (Anti-block)
              </button>
            </div>

            {importMode === 'url' ? (
              <div className="space-y-2">
                <p className="text-xs text-neutral-400">Best for company careers pages. Note: Job portals like LinkedIn/Naukri may block direct crawling.</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={scrapeUrl}
                    onChange={(e) => setScrapeUrl(e.target.value)}
                    placeholder="e.g. https://company.com/careers/marketing-manager"
                    className="flex-grow field-input"
                    disabled={scraping}
                  />
                  <button
                    type="button"
                    onClick={handleScrape}
                    disabled={scraping || !scrapeUrl}
                    className="px-4 py-2 bg-black text-white text-xs font-bold rounded-lg hover:bg-neutral-800 transition-colors disabled:bg-neutral-200 disabled:text-neutral-400 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {scraping ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span>Extracting...</span>
                      </>
                    ) : (
                      <span>Autofill with AI</span>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-neutral-400">If the job portal blocks direct URL crawling (like Naukri/LinkedIn), copy the text from the job page and paste it below.</p>
                <textarea
                  value={scrapeText}
                  onChange={(e) => setScrapeText(e.target.value)}
                  placeholder="Paste the job description, qualifications, and company details here (min 50 chars)..."
                  rows={4}
                  className="w-full field-input resize-none"
                  disabled={scraping}
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleParseText}
                    disabled={scraping || scrapeText.trim().length < 50}
                    className="px-4 py-2 bg-black text-white text-xs font-bold rounded-lg hover:bg-neutral-800 transition-colors disabled:bg-neutral-200 disabled:text-neutral-400 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {scraping ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span>Parsing...</span>
                      </>
                    ) : (
                      <span>Parse Text with AI</span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {scrapeSuccess && (
              <div className="text-xs text-green-700 bg-green-50 border border-green-200 px-3.5 py-2 rounded-lg font-medium">
                {scrapeSuccess}
              </div>
            )}
          </div>

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
                <p className="text-xs text-neutral-400">Be specific. A detailed description attracts better candidates.</p>
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
                  <p className="text-xs text-neutral-400">LinkedIn, Indeed, or company career page.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-label text-neutral-500">Contact Phone (Call / WhatsApp)</label>
                  <input
                    type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 9876543210"
                    className="field-input"
                  />
                  <p className="text-xs text-neutral-400">Shown to candidates for direct contact.</p>
                </div>
              </div>
            </section>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2 border-t border-neutral-100">
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Posting...' : 'Post Job Listing'}
              </button>
              <button type="button" onClick={() => router.push('/dashboard')} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar Live Preview */}
        <div className="lg:col-span-1 lg:sticky lg:top-6 space-y-4">
          <div className="p-4 border border-neutral-200 rounded-xl bg-neutral-50/50">
            <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-3">Live Telegram Post Preview</h3>
            <div className="bg-[#5b80a5] rounded-xl p-4 shadow-inner space-y-3 font-sans relative overflow-hidden">
              {/* Telegram header */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#4a6d8d] flex items-center justify-center text-white text-xs font-bold shadow-sm select-none">KJ</div>
                <div>
                  <div className="text-xs font-bold text-white leading-tight">Karavali Jobs</div>
                  <div className="text-[10px] text-[#b8d1ea]">broadcast channel</div>
                </div>
              </div>

              {/* Telegram Bubble */}
              <div className="bg-white rounded-lg p-3 shadow-sm text-xs text-neutral-800 leading-relaxed relative ml-1">
                <div className="whitespace-pre-line">
                  <span className="font-bold text-black">🚨 New Job Alert 🚨</span>{"\n\n"}
                  <span className="font-bold text-black">📌 {title || 'Job Title'}</span>{"\n"}
                  <span className="font-bold text-black">🏢 Company:</span> {companyName || 'Company Name'}{"\n"}
                  <span className="font-bold text-black">📍 Location:</span> {location}{"\n"}
                  {jobType && <><span className="font-bold text-black">🕐 Type:</span> {jobType}{"\n"}</>}
                  {salaryRange && <><span className="font-bold text-black">💰 Salary:</span> {undisclosedSalary ? 'Competitive / As per industry standards' : salaryRange}{"\n"}</>}
                  {tags && tags.length > 0 && (
                    <><span className="text-[#2481cc] font-medium">{tags.map(t => `#${t.trim()}`).join(' ')}</span>{"\n"}</>
                  )}
                  {"\n"}👉 <span className="text-[#2481cc] underline font-medium cursor-pointer">View & Apply</span>
                </div>
                
                {/* Bubble tail decoration */}
                <div className="absolute top-2.5 -left-1 w-2.5 h-2.5 bg-white rotate-45 rounded-sm" />
                
                {/* Time */}
                <div className="text-right text-[9px] text-neutral-400 mt-2 font-medium">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
            <p className="text-[10px] text-neutral-400 mt-2 text-center">This is exactly how your posting will be broadcasted to the Telegram community.</p>
          </div>
        </div>
      </div>
    </div>
  </main>

      <Footer />
    </div>
  );
}

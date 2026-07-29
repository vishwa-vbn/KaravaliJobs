'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, writeBatch, query, where, Timestamp, doc as firestoreDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { useUI } from '@/components/ui/UIContext';

interface BackupJob {
  jobId: string;
  title: string;
  companyName: string;
  location: string;
  jobType: string;
  category: string;
  status: string;
  createdAt: { seconds: number; nanoseconds: number } | any;
  expiresAt: { seconds: number; nanoseconds: number } | any;
  [key: string]: any;
}

export default function AdminBackupPage() {
  const [filterType, setFilterType] = useState<'expired' | 'all-older-30'>('expired');
  const { confirm, showAlert, toast } = useUI();
  const [matchingJobs, setMatchingJobs] = useState<BackupJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [actioning, setActioning] = useState(false);
  const [backupDownloaded, setBackupDownloaded] = useState(false);
  const [message, setMessage] = useState('');

  // Upload/Restore state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadedJobs, setUploadedJobs] = useState<BackupJob[]>([]);
  const [reactivateOnRestore, setReactivateOnRestore] = useState(true);

  async function scanJobs() {
    setLoading(true);
    setMessage('');
    setBackupDownloaded(false);
    try {
      const jobsRef = collection(db, 'jobs');
      let snap;

      if (filterType === 'expired') {
        const q = query(jobsRef, where('status', 'in', ['expired', 'rejected']));
        snap = await getDocs(q);
      } else {
        // Fetch all, filter 30 days old client-side to avoid needing complex composite index
        snap = await getDocs(jobsRef);
      }

      const found: BackupJob[] = [];
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

      snap.forEach((docSnap) => {
        const data = docSnap.data() as BackupJob;
        const jobDate = data.createdAt?.seconds 
          ? data.createdAt.seconds * 1000 
          : (data.createdAt instanceof Date ? data.createdAt.getTime() : Date.now());

        if (filterType === 'expired' || jobDate <= thirtyDaysAgo) {
          found.push({ ...data, jobId: docSnap.id });
        }
      });

      setMatchingJobs(found);
      if (found.length === 0) {
        setMessage('No matching jobs found for backup.');
      }
    } catch (err: any) {
      console.error('Failed to scan jobs:', err);
      setMessage(`Error scanning jobs: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    scanJobs();
  }, [filterType]);

  const handleDownloadBackup = () => {
    if (matchingJobs.length === 0) return;
    try {
      const dataStr = JSON.stringify(matchingJobs, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-');
      link.href = url;
      link.download = `karavali_jobs_backup_${dateStr}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setBackupDownloaded(true);
      setMessage(`Backup downloaded successfully: ${matchingJobs.length} jobs.`);
    } catch (err: any) {
      console.error('Download failed:', err);
      setMessage(`Download failed: ${err?.message || err}`);
    }
  };

  const handlePurge = async () => {
    let ok = false;
    if (!backupDownloaded) {
      ok = await confirm(
        'Warning: Backup Not Downloaded',
        'WARNING: You have not downloaded the backup file yet. Are you sure you want to permanently delete these jobs without a copy?',
        { confirmLabel: 'Purge Without Backup', type: 'danger' }
      );
    } else {
      ok = await confirm(
        'Confirm Purge',
        `Are you sure you want to permanently delete these ${matchingJobs.length} jobs from the database? This cannot be undone.`,
        { confirmLabel: 'Purge Database', type: 'danger' }
      );
    }
    if (!ok) return;

    setActioning(true);
    setMessage('');
    try {
      const batchSize = 100;
      let count = 0;

      for (let i = 0; i < matchingJobs.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = matchingJobs.slice(i, i + batchSize);
        chunk.forEach((job) => {
          const docRef = firestoreDoc(db, 'jobs', job.jobId);
          batch.delete(docRef);
        });
        await batch.commit();
        count += chunk.length;
      }

      toast(`Purged ${count} jobs from database.`, 'success');
      setMessage(`Purged ${count} jobs from the database successfully.`);
      setMatchingJobs([]);
      setBackupDownloaded(false);
    } catch (err: any) {
      console.error('Purge failed:', err);
      setMessage(`Purge failed: ${err?.message || err}`);
      toast('Failed to purge database.', 'error');
    } finally {
      setActioning(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFile(file);
    setMessage('');
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          setUploadedJobs(parsed);
        } else {
          setUploadedJobs([parsed]);
        }
        toast('Backup file loaded successfully.', 'success');
      } catch (err) {
        showAlert('Invalid File', 'The selected file is not a valid JSON backup file.');
        setUploadedJobs([]);
        setUploadFile(null);
      }
    };
    reader.readAsText(file);
  };

  const handleRestore = async () => {
    if (uploadedJobs.length === 0) return;
    const ok = await confirm(
      'Restore Backup',
      `Are you sure you want to restore and upload ${uploadedJobs.length} jobs to the database?`,
      { confirmLabel: 'Restore Jobs', type: 'info' }
    );
    if (!ok) return;

    setActioning(true);
    setMessage('');
    try {
      const batchSize = 100;
      let count = 0;

      for (let i = 0; i < uploadedJobs.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = uploadedJobs.slice(i, i + batchSize);

        chunk.forEach((job) => {
          const { jobId, ...jobData } = job;
          const docRef = firestoreDoc(db, 'jobs', jobId);

          // Build clean Firestore fields
          const cleanData = { ...jobData };

          if (reactivateOnRestore) {
            const now = new Date();
            cleanData.createdAt = Timestamp.fromDate(now);
            cleanData.expiresAt = Timestamp.fromDate(new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000));
            cleanData.status = 'active';
          } else {
            // Restore exact timestamps
            if (cleanData.createdAt) {
              cleanData.createdAt = new Timestamp(
                cleanData.createdAt.seconds || Math.floor(Date.now() / 1000),
                cleanData.createdAt.nanoseconds || 0
              );
            }
            if (cleanData.expiresAt) {
              cleanData.expiresAt = new Timestamp(
                cleanData.expiresAt.seconds || Math.floor(Date.now() / 1000),
                cleanData.expiresAt.nanoseconds || 0
              );
            }
          }

          batch.set(docRef, cleanData);
        });

        await batch.commit();
        count += chunk.length;
      }

      setMessage(`Successfully restored ${count} jobs.`);
      toast(`Successfully restored ${count} jobs.`, 'success');
      setUploadedJobs([]);
      setUploadFile(null);
      scanJobs();
    } catch (err: any) {
      console.error('Restore failed:', err);
      setMessage(`Restore failed: ${err?.message || err}`);
      toast('Failed to restore backup.', 'error');
    } finally {
      setActioning(false);
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
                <span className="text-neutral-600">Database Archive &amp; Backup</span>
              </div>
              <h1 className="text-xl font-bold text-black">Database Archival Manager</h1>
              <p className="text-sm text-neutral-500 mt-0.5">Keep the database clean and lightweight by backing up and purging expired listings.</p>
            </div>
            <button onClick={scanJobs} className="btn-secondary text-xs flex-shrink-0">
              Rescan Jobs
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
          {message && (
            <div className="px-4 py-3 border border-neutral-200 rounded-lg bg-neutral-50 text-xs text-neutral-700 font-medium">
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Export & Purge Card */}
            <div className="border border-neutral-200 rounded-xl p-6 space-y-6 bg-white shadow-sm">
              <div>
                <h2 className="text-base font-bold text-black flex items-center gap-2">
                  <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Export &amp; Purge Tools
                </h2>
                <p className="text-xs text-neutral-500 mt-1">Identify old or expired listings, back them up locally, then remove them from Firestore.</p>
              </div>

              {/* Filters */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-neutral-400 block uppercase tracking-wider">Filter criteria</label>
                <div className="grid grid-cols-2 gap-1 bg-neutral-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setFilterType('expired')}
                    className={`text-xs py-2 px-3 rounded-lg font-semibold transition-all cursor-pointer ${
                      filterType === 'expired'
                        ? 'bg-white text-rose-600 shadow-sm border border-neutral-200/50'
                        : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    Expired / Rejected Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('all-older-30')}
                    className={`text-xs py-2 px-3 rounded-lg font-semibold transition-all cursor-pointer ${
                      filterType === 'all-older-30'
                        ? 'bg-white text-rose-600 shadow-sm border border-neutral-200/50'
                        : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    All Older Than 30 Days
                  </button>
                </div>
              </div>

              <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Found Listings</span>
                  <span className="text-xl font-extrabold text-black">{loading ? 'Scanning...' : matchingJobs.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadBackup}
                    disabled={loading || actioning || matchingJobs.length === 0}
                    className="btn-primary text-xs"
                  >
                    Download JSON Backup
                  </button>
                  <button
                    onClick={handlePurge}
                    disabled={loading || actioning || matchingJobs.length === 0}
                    className="btn-secondary text-xs text-red-600 hover:text-red-700"
                  >
                    Purge from DB
                  </button>
                </div>
              </div>
            </div>

            {/* Restore & Reactivate Card */}
            <div className="border border-neutral-200 rounded-xl p-6 space-y-6 bg-white shadow-sm">
              <div>
                <h2 className="text-base font-bold text-black flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Restore &amp; Reactivate Tools
                </h2>
                <p className="text-xs text-neutral-500 mt-1">Upload a previously saved JSON file to restore and optionally renew listings for another 30 days.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-600 block">Select Backup JSON File</label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    className="w-full text-xs text-neutral-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-neutral-100 file:text-black hover:file:bg-neutral-200 cursor-pointer"
                  />
                </div>

                {uploadedJobs.length > 0 && (
                  <div className="space-y-4">
                    <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-100 text-xs">
                      <span className="font-bold text-black block mb-1">Backup Details:</span>
                      <span>Total jobs in file: <strong>{uploadedJobs.length}</strong></span>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={reactivateOnRestore}
                          onChange={(e) => setReactivateOnRestore(e.target.checked)}
                          className="w-4 h-4 text-emerald-600 rounded"
                        />
                        Re-activate listings (Status → active, extend expiry +30 days)
                      </label>
                    </div>

                    <button
                      onClick={handleRestore}
                      disabled={actioning}
                      className="btn-primary w-full text-xs"
                    >
                      {actioning ? 'Restoring...' : 'Restore Jobs to Database'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Job details scan preview */}
          {matchingJobs.length > 0 && (
            <div className="border border-neutral-200 rounded-xl p-6 bg-white shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-black">Scan Preview (First 5 Items)</h3>
              <div className="space-y-3">
                {matchingJobs.slice(0, 5).map((job) => (
                  <div key={job.jobId} className="flex justify-between items-center text-xs py-2 border-b border-neutral-100">
                    <div>
                      <span className="font-bold text-black">{job.title}</span>
                      <span className="text-neutral-500 block">{job.companyName} · {job.location}</span>
                    </div>
                    <span className="tag capitalize">{job.status}</span>
                  </div>
                ))}
                {matchingJobs.length > 5 && (
                  <p className="text-xs text-neutral-400 italic">And {matchingJobs.length - 5} more items...</p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

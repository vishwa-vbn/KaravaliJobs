import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/client';

export interface Job {
  jobId: string;
  title: string;
  companyName: string;
  location: 'Mangalore' | 'Udupi' | 'Remote';
  specificArea: string;
  jobType: 'Part-time' | 'Permanent' | 'Remote' | 'Contract';
  description: string;
  salaryRange: string;
  applyMethod: string;
  applyUrl?: string;
  phone?: string;
  category: 'IT & Software' | 'Sales & Marketing' | 'Finance & Accounts' | 'Healthcare' | 'Office Admin' | 'Hospitality' | 'Retail' | 'Education' | 'Other';
  providerId: string;
  status: 'active' | 'expired' | 'pending_review' | 'rejected';
  featured: boolean;
  createdAt: any;
  expiresAt: any;
}

export interface JobFilters {
  location?: 'Mangalore' | 'Udupi' | 'Remote' | '';
  jobType?: 'Part-time' | 'Permanent' | 'Remote' | 'Contract' | '';
  category?: 'IT & Software' | 'Sales & Marketing' | 'Finance & Accounts' | 'Healthcare' | 'Office Admin' | 'Hospitality' | 'Retail' | 'Education' | 'Other' | '';
}

export interface JobPage {
  jobs: Job[];
  /** The last document snapshot — pass to next call as `cursor` to get the next page */
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  /** True if there may be more results beyond this page */
  hasMore: boolean;
}

const PAGE_SIZE = 10;

/**
 * Fetch a paginated page of active jobs with optional filters.
 *
 * Strategy (free-tier safe):
 * - Build a single Firestore query using `status == active` + up to ALL provided filter fields.
 * - All filter combinations are covered by composite indexes in firestore.indexes.json.
 * - Use cursor-based pagination (startAfter) — 10 reads per page, zero wasted reads.
 * - Keyword/text search is done client-side on the loaded page results (no Firestore cost).
 *
 * @param filters   Active filter values (empty string = no filter for that field)
 * @param cursor    Last document from the previous page; omit/null for the first page
 * @param pageSize  Number of jobs to fetch per page (default 10)
 */
export async function fetchActiveJobsPage(
  filters: JobFilters = {},
  cursor: QueryDocumentSnapshot<DocumentData> | null = null,
  pageSize: number = PAGE_SIZE
): Promise<JobPage> {
  const jobsRef = collection(db, 'jobs');

  const conditions: ReturnType<typeof where>[] = [
    where('status', '==', 'active'),
  ];

  if (filters.location) {
    conditions.push(where('location', '==', filters.location));
  }
  if (filters.jobType) {
    conditions.push(where('jobType', '==', filters.jobType));
  }
  if (filters.category) {
    conditions.push(where('category', '==', filters.category));
  }

  // Build query: filters + order + pagination
  let q = query(
    jobsRef,
    ...conditions,
    orderBy('createdAt', 'desc'),
    limit(pageSize + 1) // fetch one extra to detect hasMore
  );

  // Apply cursor for subsequent pages
  if (cursor) {
    q = query(
      jobsRef,
      ...conditions,
      orderBy('createdAt', 'desc'),
      startAfter(cursor),
      limit(pageSize + 1)
    );
  }

  const snapshot = await getDocs(q);
  const docs = snapshot.docs;

  const hasMore = docs.length > pageSize;
  const pageDocs = hasMore ? docs.slice(0, pageSize) : docs;

  const jobs: Job[] = pageDocs.map(
    (docSnap) => ({ jobId: docSnap.id, ...docSnap.data() } as Job)
  );

  const lastDoc = pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] : null;

  return { jobs, lastDoc, hasMore };
}

/**
 * Fetch a single job by its ID.
 */
export async function fetchJobById(jobId: string): Promise<Job | null> {
  const jobDocRef = doc(db, 'jobs', jobId);
  const jobDocSnap = await getDoc(jobDocRef);

  if (!jobDocSnap.exists()) {
    return null;
  }

  return { jobId: jobDocSnap.id, ...jobDocSnap.data() } as Job;
}

/**
 * Create a new job listing.
 * Upgrades user role from "seeker" to "provider" if they are currently a "seeker" per SKILLS.md.
 */
export async function createJob(
  providerId: string,
  jobData: Omit<Job, 'jobId' | 'providerId' | 'status' | 'featured' | 'createdAt' | 'expiresAt'>
): Promise<string> {
  // Check and update user role if seeker
  const userDocRef = doc(db, 'users', providerId);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    const profile = userDocSnap.data();
    if (profile.role === 'seeker') {
      await updateDoc(userDocRef, { role: 'provider' });
    }
  }

  const jobsRef = collection(db, 'jobs');
  const newJobDocRef = doc(jobsRef); // Auto ID

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days

  const finalJob: Omit<Job, 'jobId'> = {
    ...jobData,
    providerId,
    status: 'pending_review',
    featured: false,
    createdAt: serverTimestamp(),
    expiresAt: expiresAt,
  };


  await setDoc(newJobDocRef, finalJob);
  return newJobDocRef.id;
}

/**
 * Renews a job listing, resetting its expiry date 30 days into the future.
 */
export async function renewJob(jobId: string): Promise<void> {
  const jobDocRef = doc(db, 'jobs', jobId);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days

  await updateDoc(jobDocRef, {
    status: 'active',
    expiresAt: expiresAt,
  });
}

/**
 * Deletes a job listing.
 */
export async function deleteJob(jobId: string): Promise<void> {
  const jobDocRef = doc(db, 'jobs', jobId);
  await deleteDoc(jobDocRef);
}

/**
 * Update an existing job listing.
 */
export async function updateJob(
  jobId: string,
  jobData: Partial<Omit<Job, 'jobId' | 'providerId' | 'createdAt'>>
): Promise<void> {
  const jobDocRef = doc(db, 'jobs', jobId);
  await updateDoc(jobDocRef, jobData);
}

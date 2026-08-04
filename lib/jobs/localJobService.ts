export interface LocalJob {
  id: string;
  title: string;
  companyName: string;
  location: string;
  description: string;
  phone: string;
  salaryRange?: string;
  category: 'IT & Software' | 'Sales & Marketing' | 'Finance & Accounts' | 'Healthcare' | 'Office Admin' | 'Hospitality' | 'Retail' | 'Education' | 'Other';
  imageUrl?: string;
  createdAt: any;
  dateString: string; // e.g. "2026-07-31"
}

/**
 * Fetch all local jobs sorted by creation time (newest first).
 */
export async function fetchLocalJobs(): Promise<LocalJob[]> {
  try {
    const res = await fetch('/api/local-jobs');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch local jobs');
    return data.jobs || [];
  } catch (err) {
    console.error('Failed to fetch local jobs:', err);
    return [];
  }
}

/**
 * Create a single local job.
 */
export async function createLocalJob(
  jobData: Omit<LocalJob, 'id' | 'createdAt'>
): Promise<string> {
  const res = await fetch('/api/local-jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(jobData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create local job');
  return data.id;
}

/**
 * Save multiple local jobs at once.
 */
export async function createMultipleLocalJobs(
  jobsList: Omit<LocalJob, 'id' | 'createdAt'>[]
): Promise<void> {
  const res = await fetch('/api/local-jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobs: jobsList }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create local jobs');
}

/**
 * Delete a local job.
 */
export async function deleteLocalJob(id: string): Promise<void> {
  const res = await fetch(`/api/local-jobs/${id}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete local job');
}

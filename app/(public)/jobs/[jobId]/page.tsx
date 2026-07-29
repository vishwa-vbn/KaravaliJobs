import type { Metadata } from 'next';
import { fetchJobById } from '@/lib/jobs/jobService';
import JobDetailView from '@/components/jobs/JobDetailView';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { notFound } from 'next/navigation';

interface Props {
  params: { jobId: string };
}

/**
 * Generate metadata dynamically for job pages, ensuring strong SEO tags.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const job = await fetchJobById(params.jobId);
  if (!job) {
    return {
      title: 'Job Not Found',
    };
  }

  const titleString = `${job.title} at ${job.companyName}`;
  const descString = `Apply for ${job.title} job in ${job.location} (${job.specificArea || ''}) with ${job.companyName}. Type: ${job.jobType}. Apply instructions: ${job.applyMethod.substring(0, 100)}...`;

  return {
    title: titleString,
    description: descString,
    openGraph: {
      title: titleString,
      description: descString,
      type: 'website',
      siteName: 'Karavali Jobs',
      locale: 'en_IN',
    },
    twitter: {
      card: 'summary_large_image',
      title: titleString,
      description: descString,
    },
  };
}

export default async function JobDetailPage({ params }: Props) {
  const job = await fetchJobById(params.jobId);

  if (!job) {
    notFound();
  }

  // Convert non-serializable Firestore Timestamps/classes to plain JSON object
  const serializedJob = JSON.parse(JSON.stringify(job));

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      <Header />
      <main className="flex-grow">
        <JobDetailView job={serializedJob} />
      </main>
      <Footer />
    </div>
  );
}


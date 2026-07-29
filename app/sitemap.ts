import { MetadataRoute } from 'next';
import { adminDb } from '@/lib/firebase/admin';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://karavali-jobs.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Base static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/alerts-signup`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  try {
    // Use Admin SDK (server-side) instead of client SDK to avoid initialisation issues
    const snapshot = await adminDb
      .collection('jobs')
      .where('status', '==', 'active')
      .get();

    const jobRoutes: MetadataRoute.Sitemap = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        url: `${BASE_URL}/jobs/${doc.id}`,
        lastModified: data.createdAt?._seconds
          ? new Date(data.createdAt._seconds * 1000)
          : new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      };
    });

    return [...staticRoutes, ...jobRoutes];
  } catch (error) {
    console.error('[sitemap] Failed to generate dynamic routes:', error);
    return staticRoutes;
  }
}

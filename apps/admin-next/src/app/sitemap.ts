import type { MetadataRoute } from 'next';

const BASE_URL = 'https://admin.joyminis.com';

/**
 * Sitemap — only public-accessible pages are listed.
 * All /dashboard/* routes are auth-protected and excluded.
 * Served at /sitemap.xml automatically by Next.js App Router.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/register-apply`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ];
}


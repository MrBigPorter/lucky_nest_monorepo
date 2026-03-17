import type { MetadataRoute } from 'next';

/**
 * Admin panel — block all search engine crawlers.
 * Serves /robots.txt automatically via Next.js App Router.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', disallow: '/' },
  };
}


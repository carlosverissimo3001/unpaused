import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site-url';

/** One entry, because the homepage is the only route robots.ts allows. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
  ];
}

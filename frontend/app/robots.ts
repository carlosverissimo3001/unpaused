import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site-url';

// Only the homepage; the rest redirects without a session. Naming a private
// path in a disallow rule would publish it, so none are listed.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/$',
      disallow: '/',
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

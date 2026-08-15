import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site-url';

/**
 * Only the homepage is worth indexing. Everything else either needs a Spotify
 * session or redirects to the homepage without one, so indexing it would put
 * results in front of people that resolve to a redirect.
 *
 * Nothing private is named here. Listing a path in a disallow rule publishes
 * it, and the proxy is what actually protects those.
 */
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

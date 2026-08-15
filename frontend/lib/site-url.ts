/** Absolute origin for metadata routes. Vercel supplies the production alias. */
const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL ||
  (vercel ? `https://${vercel}` : 'http://localhost:3000')
).replace(/\/$/, '');

/** Absolute origin for metadata routes. Wrong here means a wrong canonical. */
const url = process.env.NEXT_PUBLIC_APP_URL;

if (!url && process.env.NODE_ENV === 'production') {
  throw new Error('NEXT_PUBLIC_APP_URL is required to build metadata routes');
}

export const SITE_URL = (url || 'http://localhost:3000').replace(/\/$/, '');

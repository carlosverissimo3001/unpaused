/**
 * Absolute origin, for the metadata routes that cannot use a relative URL.
 * Env driven so that moving to a custom domain is a variable, not a deploy.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://unpaused-game.vercel.app'
).replace(/\/$/, '');

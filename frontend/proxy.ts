import { NextRequest, NextResponse } from 'next/server';
import { SITE_ACCESS_COOKIE, isAccessTokenValid } from '@/lib/site-access';

const SESSION_COOKIE = 'unpaused_session';

/**
 * Routes that render nothing useful without a Spotify session. They used to be
 * unreachable because the whole site sat behind the password; now that it does
 * not, a visitor typing one in would get the game's error screen instead of a
 * page. Presence is all this checks: the backend is what actually validates.
 *
 * The multiplayer join links are deliberately absent. They send a signed out
 * visitor through login themselves and remember where to return to.
 */
const NEEDS_SESSION = [
  '/daily',
  '/game',
  '/speed-run',
  '/history',
  '/preferences',
  '/admin',
];

function needsSession(pathname: string): boolean {
  if (pathname.startsWith('/multiplayer/join')) return false;
  if (pathname.startsWith('/multiplayer')) return true;
  return NEEDS_SESSION.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

/**
 * A route served by a separate deployment, proxied in at this origin. Its path
 * stays in an env var so that it is not sitting in a public repo.
 */
function isPrivateZone(pathname: string): boolean {
  const zone = process.env.PRIVATE_ZONE_PATH;
  if (!zone) return false;
  return pathname === zone || pathname.startsWith(`${zone}/`);
}

async function hasAccess(request: NextRequest): Promise<boolean> {
  return isAccessTokenValid(request.cookies.get(SITE_ACCESS_COOKIE)?.value);
}

/**
 * The site itself is public. What the password buys is the ability to sign in,
 * because Spotify caps an app in development mode at five users, and access to
 * the private zone.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // The disabled button on the homepage is a hint, not the enforcement.
  // Spotify would reject an unregistered account anyway, but bouncing them
  // home beats handing them Spotify's error page.
  if (pathname === '/api/auth/login') {
    return (await hasAccess(request))
      ? NextResponse.next()
      : NextResponse.redirect(new URL('/', request.url));
  }

  if (needsSession(pathname) && !request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (!isPrivateZone(pathname) || (await hasAccess(request))) {
    return NextResponse.next();
  }

  // The gate rather than a 404: a 404 leaves someone who holds a valid
  // password no way to use it, since nothing on screen asks for one.
  const gate = new URL('/gate', request.url);
  gate.searchParams.set('next', pathname + search);
  return NextResponse.redirect(gate);
}

export const config = {
  matcher: ['/((?!_next|api/auth/gate|gate|.*\\.).*)'],
};

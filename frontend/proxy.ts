import { NextRequest, NextResponse } from 'next/server';
import { SITE_ACCESS_COOKIE, isAccessTokenValid } from '@/lib/site-access';

const SESSION_COOKIE = 'unpaused_session';
const SHUFFLE_ROUTE = '/play/shuffle';

// Presence only; the backend validates. Multiplayer join is absent on purpose:
// it routes signed out visitors through login itself.
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
  // Guest play is the whole point of being signed out.
  if (pathname === SHUFFLE_ROUTE) return false;
  if (pathname.startsWith('/multiplayer')) return true;
  return NEEDS_SESSION.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

/** Separate deployment, proxied in here. Path lives in an env var, not the repo. */
function isPrivateZone(pathname: string): boolean {
  const zone = process.env.PRIVATE_ZONE_PATH;
  if (!zone) return false;
  return pathname === zone || pathname.startsWith(`${zone}/`);
}

async function hasAccess(request: NextRequest): Promise<boolean> {
  return isAccessTokenValid(request.cookies.get(SITE_ACCESS_COOKIE)?.value);
}

/** The site is public; the password buys sign in and the private zone. */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // The disabled button is a hint, not the enforcement.
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

  // Not a 404: that leaves a valid password holder nothing to type it into.
  const gate = new URL('/gate', request.url);
  gate.searchParams.set('next', pathname + search);
  return NextResponse.redirect(gate);
}

export const config = {
  matcher: ['/((?!_next|api/auth/gate|gate|.*\\.).*)'],
};

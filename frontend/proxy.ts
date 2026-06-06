import { NextRequest, NextResponse } from 'next/server';
import {
  SITE_ACCESS_COOKIE,
  isAccessTokenValid,
} from '@/lib/site-access';

export async function proxy(request: NextRequest) {
  const cookie = request.cookies.get(SITE_ACCESS_COOKIE);
  if (await isAccessTokenValid(cookie?.value)) {
    return NextResponse.next();
  }

  const gate = new URL('/gate', request.url);
  const destination = request.nextUrl.pathname + request.nextUrl.search;
  if (destination && destination !== '/') {
    gate.searchParams.set('next', destination);
  }
  return NextResponse.redirect(gate);
}

export const config = {
  matcher: ['/((?!_next|api/auth/gate|gate|.*\\.).*)'],
};

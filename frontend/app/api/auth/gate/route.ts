import { NextResponse } from 'next/server';
import { authGateRateLimiter } from '@/lib/rate-limiter';
import { getClientIP } from '@/lib/get-client-ip';
import {
  SITE_ACCESS_COOKIE,
  constantTimeEqual,
  getExpectedToken,
} from '@/lib/site-access';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function POST(request: Request) {
  const clientIP = getClientIP(request);

  const rateLimitStatus = authGateRateLimiter.check(clientIP);
  if (rateLimitStatus.isBlocked) {
    return NextResponse.json(
      {
        error: 'Too many failed attempts. Please try again later.',
        retryAfter: rateLimitStatus.retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': rateLimitStatus.retryAfter?.toString() || '900',
        },
      },
    );
  }

  const sitePassword = process.env.SITE_PASSWORD;
  if (!sitePassword) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    authGateRateLimiter.recordAttempt(clientIP);
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const password = body.password;
  if (
    typeof password !== 'string' ||
    !constantTimeEqual(password, sitePassword)
  ) {
    authGateRateLimiter.recordAttempt(clientIP);
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  authGateRateLimiter.reset(clientIP);

  const token = await getExpectedToken();
  if (!token) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(SITE_ACCESS_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax', // Need to be lax to allow OAuth redirects
    maxAge: COOKIE_MAX_AGE,
  });

  return response;
}

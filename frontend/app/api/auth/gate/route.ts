import { NextResponse } from "next/server";
import { authGateRateLimiter } from "@/lib/rate-limiter";
import { getClientIP } from "@/lib/get-client-ip";

const SITE_PASSWORD = process.env.SITE_PASSWORD;
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function POST(request: Request) {
  const clientIP = getClientIP(request);

  // Check rate limit before processing
  const rateLimitStatus = authGateRateLimiter.check(clientIP);
  if (rateLimitStatus.isBlocked) {
    return NextResponse.json(
      {
        error: "Too many failed attempts. Please try again later.",
        retryAfter: rateLimitStatus.retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": rateLimitStatus.retryAfter?.toString() || "900",
        },
      }
    );
  }
  if (!SITE_PASSWORD) {
    return NextResponse.json(
      { error: "Invalid password" },
      { status: 401 }
    );
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    authGateRateLimiter.recordAttempt(clientIP);
    return NextResponse.json(
      { error: "Invalid password" },
      { status: 401 }
    );
  }

  const password = body.password;
  if (typeof password !== "string" || password !== SITE_PASSWORD) {
    authGateRateLimiter.recordAttempt(clientIP);
    return NextResponse.json(
      { error: "Invalid password" },
      { status: 401 }
    );
  }

  // Reset rate limit on successful authentication
  authGateRateLimiter.reset(clientIP);

  const response = NextResponse.json({ success: true });
  response.cookies.set("site-access", SITE_PASSWORD, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax", // Need to be lax to allow OAuth redirects
    maxAge: COOKIE_MAX_AGE,
  });

  return response;
}

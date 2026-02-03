import { NextResponse } from "next/server";

const SITE_PASSWORD = process.env.SITE_PASSWORD;
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function POST(request: Request) {
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
    return NextResponse.json(
      { error: "Invalid password" },
      { status: 401 }
    );
  }

  const password = body.password;
  if (typeof password !== "string" || password !== SITE_PASSWORD) {
    return NextResponse.json(
      { error: "Invalid password" },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("site-access", SITE_PASSWORD, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "strict",
    maxAge: COOKIE_MAX_AGE,
  });

  return response;
}

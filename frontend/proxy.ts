import { NextRequest, NextResponse } from "next/server";

const SITE_PASSWORD = process.env.SITE_PASSWORD;

export function proxy(request: NextRequest) {
  const cookie = request.cookies.get("site-access");
  const hasAccess =
    !SITE_PASSWORD || cookie?.value === SITE_PASSWORD;

  if (hasAccess) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/gate", request.url));
}

export const config = {
  matcher: ["/((?!_next|api/auth/gate|gate|.*\\.).*)"],
};

import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup", "/api/auth", "/api/stripe/webhook", "/favicon.ico"];

export default function middleware(req) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.includes(".") ||
    PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get("sessionToken")?.value;
  if (!token) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};

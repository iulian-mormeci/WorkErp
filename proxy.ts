import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";

const PUBLIC_PATHS = ["/login"];

// Route macchina-a-macchina che si autenticano da sole (bearer secret, non
// cookie di sessione) — il proxy non deve intercettarle affatto.
const UNAUTHENTICATED_API_PATHS = ["/api/unoerp/cron"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (UNAUTHENTICATED_API_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  const hasSessionCookie = request.cookies.has(SESSION_COOKIE);

  if (!isPublic && !hasSessionCookie) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isPublic && hasSessionCookie) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

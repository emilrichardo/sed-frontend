import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const isComingSoon = process.env.COMINGSOON === "true";

  if (!isComingSoon) return NextResponse.next();

  const { pathname } = request.nextUrl;

  // Don't redirect the coming soon page itself or system paths
  if (
    pathname.startsWith("/proximamente") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|webp|css|js|woff|woff2|ttf|otf)$/)
  ) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/proximamente", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

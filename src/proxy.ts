import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const isComingSoon = process.env.COMINGSOON === "true";

  if (!isComingSoon) return NextResponse.next();

  const { pathname, searchParams } = request.nextUrl;

  // Allow access if ?public=true is in the URL — set a cookie and strip the param
  if (searchParams.get("public") === "true") {
    const url = request.nextUrl.clone();
    url.searchParams.delete("public");
    const response = NextResponse.redirect(url);
    response.cookies.set("sed_preview", "1", { path: "/", maxAge: 60 * 60 * 24 });
    return response;
  }

  // Allow access if the preview cookie is set
  if (request.cookies.get("sed_preview")?.value === "1") {
    return NextResponse.next();
  }

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

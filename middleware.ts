import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const TRACKING_PARAMS = new Set([
  "fbclid",
  "fb_action_ids",
  "fb_action_types",
  "fb_ref",
  "fb_source",
  "gclid",
  "dclid",
  "gbraid",
  "wbraid",
  "igshid",
  "mibextid",
  "mc_cid",
  "mc_eid",
  "sfnsn",
]);

function isTrackingParam(param: string) {
  const key = param.toLowerCase();
  return (
    key.startsWith("utm_") ||
    key.startsWith("__cft__") ||
    key.startsWith("__tn__") ||
    TRACKING_PARAMS.has(key)
  );
}

function getCleanUrl(request: NextRequest) {
  const cleanUrl = request.nextUrl.clone();
  let changed = false;

  for (const key of Array.from(cleanUrl.searchParams.keys())) {
    if (isTrackingParam(key)) {
      cleanUrl.searchParams.delete(key);
      changed = true;
    }
  }

  return changed ? cleanUrl : null;
}

export function middleware(request: NextRequest) {
  const comingSoon = process.env.COMINGSOON === "true";
  const pathname = request.nextUrl.pathname;
  const isPublic = request.nextUrl.searchParams.get("public") === "true";

  const cleanUrl = getCleanUrl(request);
  if (cleanUrl) {
    return NextResponse.redirect(cleanUrl, 308);
  }

  // Si COMINGSOON está activo, no estamos en /proximamente, y no es público, redirigir
  if (comingSoon && pathname !== "/proximamente" && !isPublic) {
    return NextResponse.redirect(new URL("/proximamente", request.url));
  }

  // Si COMINGSOON está desactivado y estamos en /proximamente, redirigir al home
  if (!comingSoon && pathname === "/proximamente") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Excluir archivos estáticos y API
    "/((?!_next/static|_next/image|favicon.ico|api/|api-proxy/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)",
  ],
};

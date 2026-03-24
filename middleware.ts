import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const comingSoon = process.env.COMINGSOON === "true";
  const pathname = request.nextUrl.pathname;
  const isPublic = request.nextUrl.searchParams.get("public") === "true";

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

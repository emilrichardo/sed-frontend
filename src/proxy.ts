import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Endpoints de autenticación — permitidos con métodos específicos
const AUTH_RULES: { path: string; methods: string[] }[] = [
  { path: "/api-proxy/users/login", methods: ["POST"] },
  { path: "/api-proxy/users/logout", methods: ["POST"] },
  { path: "/api-proxy/users/me", methods: ["GET"] },
];

// Colecciones públicas de solo lectura (GET únicamente).
// users, media, payload-preferences, payload-jobs → BLOQUEADOS.
const ALLOWED_COLLECTIONS = new Set([
  "taxonomias",
  "publicaciones",
  "boletines",
  "actos-administrativos",
  "coparticipacion",
  "ingresos",
  "ahorros",
  "widgets",
  "globals",
]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/api-proxy/")) {
    return NextResponse.next();
  }

  // Auth: rutas específicas con métodos específicos
  for (const rule of AUTH_RULES) {
    if (pathname === rule.path && rule.methods.includes(request.method)) {
      return NextResponse.next();
    }
  }

  // Todo lo demás: solo GET + colección en whitelist
  if (request.method !== "GET") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  const collection = pathname
    .replace("/api-proxy/", "")
    .split("/")[0]
    .split("?")[0];

  if (!ALLOWED_COLLECTIONS.has(collection)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api-proxy/:path*",
};

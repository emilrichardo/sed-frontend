import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Colecciones de Payload CMS que son públicas y de solo lectura.
 * Cualquier otro endpoint queda bloqueado — el servidor de origen
 * no es trazable desde el navegador del usuario.
 */
const ALLOWED_COLLECTIONS = new Set([
  "taxonomias",
  "publicaciones",
  "boletines",
  "actos-administrativos",
  "coparticipacion",
  "ingresos",
  "ahorros",
  "widgets",
  "agentes",
  "globals",
]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/api-proxy/")) {
    return NextResponse.next();
  }

  // Solo GET permitido — ningún write puede pasar por el proxy
  if (request.method !== "GET") {
    return NextResponse.json(
      { error: "Method not allowed" },
      { status: 405 },
    );
  }

  // Extraer nombre de colección del path
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

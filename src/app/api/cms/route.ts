export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

const BASE_URL = (process.env.PAYLOAD_API_URL || "http://localhost:3000").replace(/\/+$/, "");

/**
 * BFF proxy for authenticated CMS mutations (PATCH/POST/PUT).
 * Reads HttpOnly payload-token cookie and forwards it as Authorization header.
 *
 * Usage: PATCH /api/cms?path=/publicaciones/56
 */
export async function PATCH(req: NextRequest) {
  const token = req.cookies.get("payload-token")?.value;
  if (!token) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const path = req.nextUrl.searchParams.get("path");
  if (!path) {
    return NextResponse.json({ error: "path requerido" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${BASE_URL}/api${path}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `JWT ${token}`,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ error: "Error de conexión con el CMS" }, { status: 502 });
  }

  const data = await upstream.json().catch(() => ({}));
  return NextResponse.json(data, { status: upstream.status });
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get("payload-token")?.value;
  if (!token) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const path = req.nextUrl.searchParams.get("path");
  if (!path) {
    return NextResponse.json({ error: "path requerido" }, { status: 400 });
  }

  const qs = req.nextUrl.searchParams.get("qs") || "";

  let upstream: Response;
  try {
    upstream = await fetch(`${BASE_URL}/api${path}${qs ? `?${qs}` : ""}`, {
      headers: { Authorization: `JWT ${token}` },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ error: "Error de conexión con el CMS" }, { status: 502 });
  }

  const data = await upstream.json().catch(() => ({}));
  return NextResponse.json(data, { status: upstream.status });
}

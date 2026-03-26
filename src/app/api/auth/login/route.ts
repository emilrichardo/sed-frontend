export const dynamic = "force-static";
import { NextRequest, NextResponse } from "next/server";

const BASE_URL = (process.env.PAYLOAD_API_URL || "http://localhost:3000").replace(/\/+$/, "");

export async function POST(req: NextRequest) {
  if (process.env.NEXT_STATIC_EXPORT === "true")
    return NextResponse.json({ error: "Not available" }, { status: 501 });
  let body: { email?: string; password?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${BASE_URL}/api/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    return NextResponse.json({ error: "No se pudo conectar con el servidor" }, { status: 502 });
  }

  const data = await upstream.json();

  if (!upstream.ok || !data.token || !data.user) {
    const msg = data.errors?.[0]?.message || data.message || "Credenciales inválidas";
    return NextResponse.json({ error: msg }, { status: upstream.status });
  }

  const res = NextResponse.json({ user: data.user });

  res.cookies.set("payload-token", data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return res;
}

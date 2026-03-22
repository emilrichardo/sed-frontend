import { NextRequest, NextResponse } from "next/server";

const BASE_URL = (process.env.PAYLOAD_API_URL || "http://localhost:3000").replace(/\/+$/, "");

export async function GET(req: NextRequest) {
  const token = req.cookies.get("payload-token")?.value;

  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${BASE_URL}/api/users/me`, {
      headers: { Authorization: `JWT ${token}` },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ error: "No se pudo conectar con el servidor" }, { status: 502 });
  }

  if (!upstream.ok) {
    const res = NextResponse.json({ user: null }, { status: 401 });
    res.cookies.delete("payload-token");
    return res;
  }

  const data = await upstream.json();
  return NextResponse.json({ user: data.user ?? null });
}

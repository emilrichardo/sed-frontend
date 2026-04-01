export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

const BASE_URL = (process.env.PAYLOAD_API_URL || "http://localhost:3000").replace(/\/+$/, "");

// GET /api/agents - Listar agentes
export async function GET(req: NextRequest) {
  const token = req.cookies.get("payload-token")?.value;
  
  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const res = await fetch(`${BASE_URL}/api/agents?limit=100`, {
      headers: { Authorization: `JWT ${token}` },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Error al obtener agentes" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Error de conexión" },
      { status: 502 }
    );
  }
}

// POST /api/agents - Crear agente
export async function POST(req: NextRequest) {
  const token = req.cookies.get("payload-token")?.value;
  
  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const res = await fetch(`${BASE_URL}/api/agents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `JWT ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.errors?.[0]?.message || err.message || "Error al crear agente" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Error de conexión" },
      { status: 502 }
    );
  }
}

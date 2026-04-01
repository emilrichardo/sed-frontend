export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

const BASE_URL = (process.env.PAYLOAD_API_URL || "http://localhost:3000").replace(/\/+$/, "");

// GET /api/agents/[id] - Obtener un agente
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = req.cookies.get("payload-token")?.value;
  
  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const res = await fetch(`${BASE_URL}/api/agents/${id}`, {
      headers: { Authorization: `JWT ${token}` },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Error al obtener agente" },
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

// PATCH /api/agents/[id] - Actualizar agente
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = req.cookies.get("payload-token")?.value;
  
  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const res = await fetch(`${BASE_URL}/api/agents/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `JWT ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.errors?.[0]?.message || err.message || "Error al actualizar agente" },
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

// DELETE /api/agents/[id] - Eliminar agente
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = req.cookies.get("payload-token")?.value;
  
  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const res = await fetch(`${BASE_URL}/api/agents/${id}`, {
      method: "DELETE",
      headers: { Authorization: `JWT ${token}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.errors?.[0]?.message || err.message || "Error al eliminar agente" },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Error de conexión" },
      { status: 502 }
    );
  }
}

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

const BASE_URL = (process.env.PAYLOAD_API_URL || "http://localhost:3000").replace(/\/+$/, "");

function getAuthHeader(req: NextRequest): string {
  const header = req.headers.get("Authorization");
  if (header) return header;
  const cookie = req.cookies.get("payload-token")?.value;
  if (cookie) return `JWT ${cookie}`;
  if (process.env.PAYLOAD_USER_TOKEN) return `JWT ${process.env.PAYLOAD_USER_TOKEN}`;
  return "";
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const auth = getAuthHeader(req);

    const res = await fetch(`${BASE_URL}/api/procesamientos/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Upstream API failed: ${res.status} ${res.statusText}`, errorText);
      return NextResponse.json(
        { error: "Update failed", details: errorText },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in /api/procesamientos/[id] PATCH:", error);
    return NextResponse.json({ error: "Failed to update procesamiento" }, { status: 500 });
  }
}

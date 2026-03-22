import { NextRequest, NextResponse } from "next/server";

const BASE_URL = (process.env.PAYLOAD_API_URL || "http://localhost:3000").replace(/\/+$/, "");

export async function POST(req: NextRequest) {
  const token = req.cookies.get("payload-token")?.value;

  // Best-effort: tell Payload CMS to invalidate the token
  if (token) {
    try {
      await fetch(`${BASE_URL}/api/users/logout`, {
        method: "POST",
        headers: { Authorization: `JWT ${token}` },
      });
    } catch {
      // Ignore — we clear the cookie regardless
    }
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.delete("payload-token");
  return res;
}

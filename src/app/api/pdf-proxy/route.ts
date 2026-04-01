export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

/**
 * PDF proxy for react-pdf (CORS bypass).
 * The server can't fetch private storage URLs — instead we redirect the browser
 * directly to the PDF, adding CORS headers so react-pdf can fetch it client-side.
 *
 * For iframes: use the raw URL directly (no CORS restriction on iframes).
 * For react-pdf: use this proxy which sets CORS headers via a 307 redirect + CORS response.
 *
 * Usage: /api/pdf-proxy?url=<encoded-pdf-url>
 */
export async function GET(req: NextRequest) {
  if (process.env.NEXT_STATIC_EXPORT === "true")
    return NextResponse.json({ error: "Not available" }, { status: 501 });
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  let decoded: string;
  try {
    decoded = decodeURIComponent(url);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (!/^https?:\/\//i.test(decoded)) {
    return NextResponse.json({ error: "Invalid url scheme" }, { status: 400 });
  }

  // Redirect browser to the real URL — avoids server-to-server fetch entirely.
  // react-pdf will follow the redirect and fetch the PDF client-side.
  // The Supabase storage bucket must allow the frontend's origin in its CORS policy.
  return NextResponse.redirect(decoded, {
    status: 307,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

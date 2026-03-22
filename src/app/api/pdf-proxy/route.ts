import { NextRequest, NextResponse } from "next/server";

/**
 * Proxies PDF files to avoid CORS issues when react-pdf fetches them via JS.
 * Usage: /api/pdf-proxy?url=<encoded-pdf-url>
 */
export async function GET(req: NextRequest) {
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

  // Only allow http/https URLs
  if (!/^https?:\/\//i.test(decoded)) {
    return NextResponse.json({ error: "Invalid url scheme" }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(decoded, { cache: "force-cache" });
  } catch {
    return NextResponse.json({ error: "Failed to fetch PDF" }, { status: 502 });
  }

  if (!upstream.ok) {
    return NextResponse.json(
      { error: `Upstream error: ${upstream.status}` },
      { status: upstream.status },
    );
  }

  const buffer = await upstream.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "public, max-age=86400",
    },
  });
}

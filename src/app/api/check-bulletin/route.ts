import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    const API_BASE_URL =
      process.env.NEXT_PUBLIC_PAYLOAD_API_URL || "http://localhost:3000";

    const authHeader = req.headers.get("Authorization");

    const response = await fetch(
      `${API_BASE_URL}/api/boletines?where[slug][equals]=${slug}`,
      {
        headers: {
          "Content-Type": "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
      },
    );

    if (!response.ok) {
      // If 404 from Payload, it might mean the end point is wrong, or just no results?
      // Payload usually returns 404 for unknown route, but 200 for empty list.
      // We will pass through the status if it's not 200.
      // But if it's 404 from Payload API, we should check if it's "Not Found" resource or "Endpoint not found".
      // Assuming Payload is correctly configured.
      if (response.status === 404) {
        // If the API endpoint itself returns 404, maybe we return { exists: false }?
        // But if the endpoint is missing it's an error.
        // Let's assume 404 means endpoint issue for now and log it.
        console.error(
          "Payload returned 404 for GET /api/boletines. Check API_BASE_URL.",
        );
      }
      return NextResponse.json(
        { error: "Error checking bulletin" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Check bulletin error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

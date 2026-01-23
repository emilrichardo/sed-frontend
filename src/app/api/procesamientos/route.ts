import { NextRequest, NextResponse } from "next/server";
import { API_URL } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = req.headers.get("Authorization");

    // console.log("BFF POST /procesamientos - Token present:", !!token);

    const res = await fetch(`${API_URL}/procesamientos`, {
      method: "POST",
      headers: {
        Authorization: token || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(
        `Upstream API failed: ${res.status} ${res.statusText}`,
        errorText,
      );
      return NextResponse.json(
        { error: "Creation failed", details: errorText },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in /api/procesamientos POST:", error);
    return NextResponse.json(
      { error: "Failed to create procesamiento" },
      { status: 500 },
    );
  }
}

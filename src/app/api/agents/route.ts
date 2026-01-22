import { NextRequest, NextResponse } from "next/server";
import { getAgents } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    const agents = await getAgents(token);
    return NextResponse.json(agents);
  } catch (error) {
    console.error("Error in /api/agents BFF:", error);
    return NextResponse.json(
      { error: "Failed to fetch agents" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { getAgents } from "@/lib/api";

export async function GET() {
  try {
    const agents = await getAgents();
    return NextResponse.json(agents);
  } catch (error) {
    console.error("Error in /api/agents BFF:", error);
    return NextResponse.json(
      { error: "Failed to fetch agents" },
      { status: 500 },
    );
  }
}

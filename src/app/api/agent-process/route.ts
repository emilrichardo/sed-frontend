import { NextRequest, NextResponse } from "next/server";
import {
  createLearningRecord,
  getBulletin,
  getAgents,
  updateBulletin,
} from "@/lib/api";

// Helper to call Ollama
async function generateWithOllama(
  model: string,
  prompt: string,
): Promise<string> {
  const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";

  try {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: false,
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama API error: ${res.statusText}`);
    }

    const data = await res.json();
    return data.response;
  } catch (error) {
    console.error("Ollama generation failed:", error);
    // Build a mock response if Ollama is not available for testing purposes
    if (process.env.NODE_ENV === "development") {
      return `[MOCK RESPONSE] Analysis of bulletin content based on prompt: ${prompt.substring(0, 50)}...`;
    }
    throw new Error("Failed to generate AI response");
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentId, bulletinId } = body;

    if (!agentId || !bulletinId) {
      return NextResponse.json(
        { error: "Missing agentId or bulletinId" },
        { status: 400 },
      );
    }

    // 1. Fetch Agent
    const agents = await getAgents();
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // 2. Fetch Bulletin
    const bulletin = await getBulletin(bulletinId);
    if (!bulletin) {
      return NextResponse.json(
        { error: "Bulletin not found" },
        { status: 404 },
      );
    }

    // 3. Construct Prompt
    const rawText = bulletin.raw_text || "Texto no disponible.";

    const prompt = `${agent.systemPrompt || ""}\n\n---\nCONTENIDO DEL BOLETÍN:\n${rawText.substring(0, 5000)}`; // Truncate to avoid context limit

    // 4. Call AI
    console.log(
      `Processing bulletin ${bulletinId} with agent ${agent.name}...`,
    );
    const modelName = agent.modelSettings?.modelName || "llama3";
    const aiResponse = await generateWithOllama(modelName, prompt);

    // 5. Save Learning Record
    await createLearningRecord({
      agent: agentId,
      processed_items: [bulletinId],
      learningContext: aiResponse,
      type: "analysis",
      metadata: {
        source_id: bulletinId,
        agent_name: agent.name,
        processed_at: new Date().toISOString(),
      },
    });

    // 6. Update Bulletin Status
    await updateBulletin(bulletinId, {
      status_procesamiento: "ai_enhanced",
    });

    return NextResponse.json({ success: true, message: "Processing complete" });
  } catch (error) {
    console.error("Agent processing error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

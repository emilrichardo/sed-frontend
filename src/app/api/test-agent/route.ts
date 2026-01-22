import { NextRequest, NextResponse } from "next/server";
import { getAgents } from "@/lib/api";

// Re-use logic or copy-paste helper for simplicity in this specific test route
async function generateWithAI(
  model: string,
  prompt: string,
  temperature: number = 0.7,
  apiKey?: string,
): Promise<string> {
  if (apiKey) {
    const API_URL =
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: "user", content: prompt }],
          temperature: temperature,
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`External AI API error: ${res.status} - ${errText}`);
      }
      const data = await res.json();
      return data.choices?.[0]?.message?.content || "";
    } catch (error) {
      console.error("External AI generation failed:", error);
      throw error;
    }
  }

  // Local Ollama
  const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: model,
      prompt: prompt,
      stream: false,
      options: { temperature },
    }),
  });
  if (!res.ok) throw new Error("Ollama error");
  const data = await res.json();
  return data.response;
}

export async function POST(req: NextRequest) {
  console.log("API: /api/test-agent hit");
  try {
    const body = await req.json();
    const { prompt, modelConfig } = body;

    // Use config from client directly to avoid server-side auth friction
    const modelName = modelConfig?.modelName || "llama3";
    const temperature = modelConfig?.temperature ?? 0.7;
    const apiKey = modelConfig?.apiKey;

    const response = await generateWithAI(
      modelName,
      prompt,
      temperature,
      apiKey,
    );
    return NextResponse.json({ response });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

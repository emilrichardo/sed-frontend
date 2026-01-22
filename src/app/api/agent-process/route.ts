import { NextRequest, NextResponse } from "next/server";
import {
  createLearningRecord,
  getBulletin,
  getAgents,
  updateBulletin,
} from "@/lib/api";

// Helper to call AI (Ollama or External)
async function generateWithAI(
  model: string,
  prompt: string,
  temperature: number = 0.7,
  apiKey?: string,
): Promise<string> {
  // 1. External API (e.g. Gemini) if API Key is provided
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
        signal: AbortSignal.timeout(600000), // 10 minutes timeout
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

  // 2. Local Ollama Fallback
  const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
  try {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: temperature,
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama API error: ${res.statusText}`);
    }

    const data = await res.json();
    return data.response;
  } catch (error) {
    console.error("Ollama generation failed:", error);
    if (process.env.NODE_ENV === "development") {
      return `[MOCK RESPONSE] Analysis of bulletin content based on prompt: ${prompt.substring(0, 50)}...`;
    }
    throw new Error("Failed to generate AI response");
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentId, bulletinId, authToken } = body;

    if (!agentId || !bulletinId) {
      return NextResponse.json(
        { error: "Missing agentId or bulletinId" },
        { status: 400 },
      );
    }

    // Use Streaming Response to provide real-time updates
    const encoder = new TextEncoder();

    return new NextResponse(
      new ReadableStream({
        async start(controller) {
          const sendUpdate = (data: any) => {
            controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
          };

          try {
            // 1. Get Agent Config
            const agent = body.agentConfig;

            // ... (Same fallback logic if needed, omitted for brevity as client should force send it)
            if (!agent) {
              sendUpdate({ type: "error", message: "Agent config missing" });
              controller.close();
              return;
            }

            // 2. Fetch Bulletin
            sendUpdate({ type: "log", message: "Obteniendo boletín..." });
            const bulletin = await getBulletin(bulletinId, authToken);
            if (!bulletin) {
              sendUpdate({ type: "error", message: "Bulletin not found" });
              controller.close();
              return;
            }

            // 3. Process Text in Chunks
            const rawText = bulletin.raw_text || "Texto no disponible.";
            const MAX_CHUNK_LENGTH = 15000;
            const chunks = [];
            if (rawText.length > MAX_CHUNK_LENGTH) {
              for (let i = 0; i < rawText.length; i += MAX_CHUNK_LENGTH) {
                chunks.push(rawText.substring(i, i + MAX_CHUNK_LENGTH));
              }
            } else {
              chunks.push(rawText);
            }

            sendUpdate({
              type: "init",
              message: `Iniciando análisis. Total chunks: ${chunks.length}`,
              totalChunks: chunks.length,
            });

            const modelName = agent.modelSettings?.modelName || "llama3";
            const temperature = agent.modelSettings?.temperature ?? 0.7;
            const apiKey = agent.modelSettings?.apiKey;

            let fullResponse = "";

            for (let i = 0; i < chunks.length; i++) {
              const isMultiPart = chunks.length > 1;
              const chunkContext = isMultiPart
                ? `\n\n(PARTE ${i + 1} DE ${chunks.length})`
                : "";
              const prompt = `${agent.systemPrompt || ""}${chunkContext}\n\n---\nCONTENIDO DEL BOLETÍN:\n${chunks[i]}`;

              sendUpdate({
                type: "log",
                message: `Procesando parte ${i + 1} de ${chunks.length} con IA...`,
              });

              const chunkResponse = await generateWithAI(
                modelName,
                prompt,
                temperature,
                apiKey,
              );

              if (isMultiPart) {
                fullResponse += `\n\n--- RESPUESTA PARTE ${i + 1} ---\n${chunkResponse}`;
              } else {
                fullResponse = chunkResponse;
              }

              sendUpdate({
                type: "log",
                message: `Guardando aprendizaje parte ${i + 1}...`,
              });

              await createLearningRecord(
                {
                  agent: agentId,
                  processed_items: [bulletinId],
                  learningContext: chunkResponse,
                  type: "analysis",
                  metadata: {
                    source_id: bulletinId,
                    agent_name: agent.name,
                    processed_at: new Date().toISOString(),
                    part: i + 1,
                    total_parts: chunks.length,
                  },
                },
                authToken,
              );

              sendUpdate({ type: "chunk_complete", chunkIndex: i + 1 });
            }

            // 6. Update Bulletin Status
            sendUpdate({
              type: "log",
              message: "Actualizando estado del documento...",
            });
            await updateBulletin(
              bulletinId,
              { status_procesamiento: "ai_enhanced" },
              authToken,
            );

            sendUpdate({
              type: "done",
              message: "Procesamiento completado",
              learningContext: fullResponse,
              chunksProcessed: chunks.length,
              totalChunks: chunks.length,
            });
            controller.close();
          } catch (error) {
            console.error(error);
            const msg = error instanceof Error ? error.message : String(error);
            sendUpdate({ type: "error", message: msg });
            controller.close();
          }
        },
      }),
      {
        headers: {
          "Content-Type": "application/x-ndjson; charset=utf-8",
        },
      },
    );
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

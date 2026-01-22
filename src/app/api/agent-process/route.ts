import { NextRequest, NextResponse } from "next/server";
import { createLearningRecord, getBulletin, API_URL } from "@/lib/api";

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
        signal: AbortSignal.timeout(3600000), // 60 minutes timeout to prevent premature aborts on large contexts
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
    const { agentId, bulletinId, authToken, collection } = body;

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
          const sendUpdate = (data: {
            type: string;
            message?: string;
            [key: string]: unknown;
          }) => {
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

            // 2. Fetch Document (Generic or Specific)
            sendUpdate({
              type: "log",
              message: `Obteniendo documento (${collection || "boletines"})...`,
            });

            let doc;
            if (collection && collection !== "boletines") {
              try {
                const res = await fetch(
                  `${API_URL}/${collection}/${bulletinId}`,
                  {
                    headers: {
                      Authorization: `Bearer ${authToken}`,
                      "Content-Type": "application/json",
                    },
                  },
                );
                if (res.ok) {
                  doc = await res.json();
                }
              } catch (e) {
                console.error("Fetch error", e);
              }
            } else {
              doc = await getBulletin(bulletinId, authToken);
            }

            if (!doc) {
              sendUpdate({ type: "error", message: "Document not found" });
              controller.close();
              return;
            }

            const isExtraction = agent.type === "extraction";

            // 2.5 Cleanup previous learning records (ONLY for learning agents)
            if (!isExtraction) {
              sendUpdate({
                type: "log",
                message: "Limpiando registros anteriores...",
              });
              try {
                // Fetch by Relation first
                const existingRes = await fetch(
                  `${API_URL}/learning-records?where[processed_items][equals]=${bulletinId}&depth=0`,
                  {
                    headers: {
                      Authorization: `Bearer ${authToken}`,
                      "Content-Type": "application/json",
                    },
                  },
                );

                let docsToDelete: { id: string }[] = [];
                if (existingRes.ok) {
                  const existingData = await existingRes.json();
                  if (existingData.docs) docsToDelete = [...existingData.docs];
                }

                // Delete Found
                for (const d of docsToDelete) {
                  await fetch(`${API_URL}/learning-records/${d.id}`, {
                    method: "DELETE",
                    headers: {
                      Authorization: `Bearer ${authToken}`,
                      "Content-Type": "application/json",
                    },
                  });
                }

                if (docsToDelete.length > 0) {
                  sendUpdate({
                    type: "log",
                    message: `Eliminados ${docsToDelete.length} registros anteriores.`,
                  });
                }
              } catch (cleanupErr) {
                console.warn("Cleanup failed", cleanupErr);
              }
            }

            // 3. Process Text
            const d = doc as any;
            const rawText =
              d.raw_text ||
              d.content ||
              d.body ||
              d.text ||
              JSON.stringify(doc);
            // Increased to 1M characters (~250k tokens) to utilize Gemini 2.0 large context window
            // and act as "processing everything in one go" as requested.
            const MAX_CHUNK_LENGTH = 1000000;
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

              // Save Logic (Only for Learning Agents)
              if (!isExtraction) {
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
              }

              sendUpdate({ type: "chunk_complete", chunkIndex: i + 1 });
            }

            // Extraction Post-Processing (PATCH)
            if (isExtraction) {
              sendUpdate({
                type: "log",
                message: "Aplicando cambios extraídos al documento...",
              });
              try {
                // 1. Clean JSON response
                let jsonStr = fullResponse.trim();
                jsonStr = jsonStr
                  .replace(/^```json\s*/, "")
                  .replace(/```$/, "")
                  .trim();

                let extractedData = {};
                try {
                  extractedData = JSON.parse(jsonStr);
                } catch (e) {
                  console.warn("Failed to parse JSON directly", e);
                  const match = jsonStr.match(/\{[\s\S]*\}/);
                  if (match) {
                    extractedData = JSON.parse(match[0]);
                  } else {
                    throw new Error(
                      "La respuesta del modelo no es un JSON válido.",
                    );
                  }
                }

                const payload: any = { ...extractedData };

                // Add status field if configured
                if (agent.outputConfig?.statusField) {
                  payload[agent.outputConfig.statusField] = true;
                }

                // Destination: Default to original document
                const targetCollection =
                  agent.outputConfig?.destinationCollection ||
                  collection ||
                  "boletines";

                const patchRes = await fetch(
                  `${API_URL}/${targetCollection}/${bulletinId}`,
                  {
                    method: "PATCH",
                    headers: {
                      Authorization: `Bearer ${authToken}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                  },
                );

                if (!patchRes.ok) {
                  const err = await patchRes.text();
                  console.error("Patch Error Body:", err);
                  throw new Error(
                    `Error actualizando documento: ${patchRes.statusText}`,
                  );
                }

                sendUpdate({
                  type: "log",
                  message: "Documento actualizado correctamente.",
                });
              } catch (err: any) {
                console.error("Extraction Patch Error", err);
                sendUpdate({
                  type: "error",
                  message: `Error guardando extracción: ${err.message}`,
                });
              }
            }

            // 6. (Status update removed as per request)

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

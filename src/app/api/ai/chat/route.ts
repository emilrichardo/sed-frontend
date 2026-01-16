import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, model, generationConfig } = body;

    const apiUrl =
      process.env.AI_MODEL_URL ||
      "https://ollamaapi.alejandroparnas.org/api/chat";
    const apiKey = process.env.AI_API_KEY;
    const defaultModel = process.env.AI_MODEL || "llama3.1:8b";

    // Use the requested model if it matches the env model, otherwise default to env or fallback
    const targetModel =
      model === process.env.AI_MODEL
        ? process.env.AI_MODEL
        : model || defaultModel;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    // Construct the payload
    // Note: Some providers might have different payload structures, but we'll stick to the standard OpenAI/Ollama format for now
    // which usually accepts 'model', 'messages', 'stream', etc.
    // For Gemini via OpenAI compat layer, it should work similarly.
    const payload: any = {
      model: targetModel,
      messages,
      stream: false,
    };

    if (generationConfig?.response_mime_type === "application/json") {
      payload.response_format = { type: "json_object" };
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API Error:", response.status, errorText);
      return NextResponse.json(
        {
          error: `AI Provider Error: ${response.statusText}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Normalize response if needed, but usually we just pass it back
    // If the provider returns OpenAI format, we might need to adapt if the frontend expects Ollama format
    // The current frontend expects: data.message.content
    // OpenAI format: data.choices[0].message.content

    // Let's check the response format and adapt if necessary to maintain compatibility with the frontend code
    let content = "";
    if (data.message && data.message.content) {
      content = data.message.content; // Ollama format
    } else if (
      data.choices &&
      data.choices.length > 0 &&
      data.choices[0].message
    ) {
      content = data.choices[0].message.content; // OpenAI format
    } else {
      // Fallback or raw return if structure is unknown, but let's try to standardize
      // If we can't find content, just return data as is and let frontend handle or fail
      return NextResponse.json(data);
    }

    // Return in Ollama-like format which the frontend expects
    return NextResponse.json({
      message: {
        role: "assistant",
        content: content,
      },
      ...data, // Include other fields just in case
    });
  } catch (error) {
    console.error("Proxy Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

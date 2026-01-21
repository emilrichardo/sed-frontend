import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const jsonMetadata = formData.get("metadata");

    if (!file || !jsonMetadata) {
      return NextResponse.json(
        { error: "Faltan datos (archivo o metadatos)" },
        { status: 400 },
      );
    }

    const itemData = JSON.parse(jsonMetadata as string);
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_PAYLOAD_API_URL || "http://localhost:3000";

    const authHeader = req.headers.get("Authorization");

    // 1. Upload to Payload Media
    const mediaFormData = new FormData();
    mediaFormData.append("file", file);
    mediaFormData.append("alt", `Boletin N° ${itemData.numero || "Unknown"}`);

    // Call Payload API (Server to Server)
    const mediaRes = await fetch(`${API_BASE_URL}/api/boletines-pdf`, {
      method: "POST",
      headers: authHeader ? { Authorization: authHeader } : undefined,
      body: mediaFormData,
    });

    if (!mediaRes.ok) {
      const txt = await mediaRes.text();
      return NextResponse.json(
        { error: `Falló subida de PDF: ${txt}` },
        { status: mediaRes.status },
      );
    }

    const mediaJson = await mediaRes.json();
    const mediaId = mediaJson.doc?.id || mediaJson.id;

    // 2. Create or Update Bulletin Entry
    // STRICT SCHEMA MAPPING based on BOLETIN_OFICIAL_PARSING.md
    // We remove 'numero' and 'año_edicion' (Roman) as they are likely not in the backend schema
    // 'anio' must be a Number (Year)

    const boletinPayload = {
      // Strictly following User's "Valid Payload Example"
      numero: itemData.numero ? parseInt(String(itemData.numero)) : undefined,

      fecha_publicacion: itemData.fecha_publicacion
        ? `${itemData.fecha_publicacion}T12:00:00.000Z`
        : undefined,

      año_edicion:
        itemData.año_edicion ||
        String(new Date(itemData.fecha_publicacion).getFullYear()),

      cantidad_paginas: itemData.cantidad_paginas
        ? parseInt(String(itemData.cantidad_paginas))
        : undefined,

      recaudacion_diaria: itemData.recaudacion_diaria
        ? parseFloat(String(itemData.recaudacion_diaria))
        : undefined,

      raw_text: itemData.extractedText
        ? itemData.extractedText.substring(0, 1000000)
        : "",

      archivo_binario: mediaId,

      // New fields: User said "optional, has default", but we explicitly send 'unprocessed' to be safe.
      status_procesamiento: "unprocessed",
      contenido_procesado: null,

      // REQUIRED by User example
      staff_autoridades: {},

      // Removed 'slug' (backend handles it)
      // Removed 'anio' and 'numero_edicion' (not in user example)
    };

    console.log(
      "Creating bulletin with payload:",
      JSON.stringify(boletinPayload, null, 2),
    );

    let bolRes;
    if (itemData.id) {
      // Update existing
      console.log(`Updating existing bulletin ${itemData.id}`);
      bolRes = await fetch(`${API_BASE_URL}/api/boletines/${itemData.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify(boletinPayload),
      });
    } else {
      // Create new
      console.log("Creating new bulletin");
      bolRes = await fetch(`${API_BASE_URL}/api/boletines`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify(boletinPayload),
      });
    }

    if (!bolRes.ok) {
      const txt = await bolRes.text();
      console.error("Payload API Creation Failed:", bolRes.status, txt); // Log to server console
      return NextResponse.json(
        {
          error: `Falló ${itemData.id ? "actualización" : "creación"} de boletín: ${txt}`,
        },
        { status: bolRes.status },
      );
    }

    const bolJson = await bolRes.json();
    return NextResponse.json({
      success: true,
      id: bolJson.doc?.id || bolJson.id,
    });
  } catch (error: unknown) {
    console.error("Manual upload error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

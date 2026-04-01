export const dynamic = "force-static";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  if (process.env.NEXT_STATIC_EXPORT === "true")
    return Response.json({ error: "Not available" }, { status: 501 });
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
      process.env.PAYLOAD_API_URL || "http://localhost:3000";

    const authHeader = req.headers.get("Authorization");

    // 1. Upload to Payload Media
    const mediaFormData = new FormData();
    const numero = itemData.numero ? parseInt(String(itemData.numero)) : null;
    const filename = numero
      ? `${numero}.pdf`
      : (file as File).name || "document.pdf";

    if (file instanceof File) {
      mediaFormData.append("file", file, filename);
    } else {
      // Fallback if it's not a File object (unlikely for file upload but TS safety)
      mediaFormData.append("file", file);
    }
    mediaFormData.append("alt", `Boletin N° ${numero || "Unknown"}`);

    // Call Payload API (Server to Server)
    const mediaRes = await fetch(`${API_BASE_URL}/api/boletines-pdf`, {
      method: "POST",
      headers: authHeader ? { Authorization: authHeader } : undefined,
      body: mediaFormData,
    });

    let mediaId = "";

    if (!mediaRes.ok) {
      const txt = await mediaRes.text();
      console.warn("Media Upload Failed, trying to find existing:", txt);

      // Attempt to find existing file by filename to recover from 500s (e.g. duplicate file collision crashing server)
      try {
        const findRes = await fetch(
          `${API_BASE_URL}/api/boletines-pdf?where[filename][equals]=${filename}`,
          {
            headers: authHeader ? { Authorization: authHeader } : undefined,
          },
        );

        if (findRes.ok) {
          const findJson = await findRes.json();
          if (findJson.docs && findJson.docs.length > 0) {
            mediaId = findJson.docs[0].id;
            console.log("Found existing media, using it:", mediaId);
          } else {
            console.error(
              "Media Upload Failed and Existing file NOT Found:",
              txt,
            );
            return NextResponse.json(
              { error: `Falló subida de PDF: ${txt}` },
              { status: mediaRes.status },
            );
          }
        } else {
          console.error("Media Upload Failed and Search Failed:", txt);
          return NextResponse.json(
            { error: `Falló subida de PDF: ${txt}` },
            { status: mediaRes.status },
          );
        }
      } catch (searchErr) {
        console.error("Error searching for existing file:", searchErr);
        return NextResponse.json(
          { error: `Falló subida de PDF y búsqueda: ${txt}` },
          { status: mediaRes.status },
        );
      }
    } else {
      const mediaJson = await mediaRes.json();
      mediaId = mediaJson.doc?.id || mediaJson.id;
    }

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

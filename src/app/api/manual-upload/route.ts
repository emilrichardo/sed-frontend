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

    // 2. Create Bulletin Entry
    const boletinPayload = {
      numero: itemData.numero ? parseInt(String(itemData.numero)) : undefined,
      fecha_publicacion: itemData.fecha_publicacion,
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
      slug:
        itemData.fecha_publicacion && itemData.numero
          ? `${itemData.fecha_publicacion}-${itemData.numero}`
          : undefined,
    };

    const bolRes = await fetch(`${API_BASE_URL}/api/boletines`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(boletinPayload),
    });

    if (!bolRes.ok) {
      const txt = await bolRes.text();
      return NextResponse.json(
        { error: `Falló creación de boletín: ${txt}` },
        { status: bolRes.status },
      );
    }

    const bolJson = await bolRes.json();
    return NextResponse.json({
      success: true,
      id: bolJson.doc?.id || bolJson.id,
    });
  } catch (error: any) {
    console.error("Manual upload error:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 },
    );
  }
}

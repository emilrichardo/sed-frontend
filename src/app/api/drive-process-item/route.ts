import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { supabaseAdmin } from "@/lib/supabase";
import { createRequire } from "module";

// Maximum duration for a single file process (should be plenty)
export const maxDuration = 60;

const require = createRequire(import.meta.url);
const PDFParser = require("pdf2json");

export async function POST(req: NextRequest) {
  let fileId = "";
  try {
    const body = await req.json();
    const manualToken = body.accessToken;
    fileId = body.fileId;

    if (!fileId) {
      return NextResponse.json({ error: "File ID required" }, { status: 400 });
    }

    // 1. Auth Setup
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    const authHeader = req.headers.get("Authorization");

    let auth;
    if (clientId && clientSecret && refreshToken) {
      auth = new google.auth.OAuth2(clientId, clientSecret);
      auth.setCredentials({ refresh_token: refreshToken });
    } else if (manualToken) {
      auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: manualToken });
    } else {
      return NextResponse.json({ error: "Auth missing" }, { status: 401 });
    }

    const drive = google.drive({ version: "v3", auth });

    // 2. Fetch File Metadata
    const fileMeta = await drive.files.get({
      fileId,
      fields: "name, createdTime",
    });
    const fileName = fileMeta.data.name || "Unknown.pdf";
    console.log(`Processing Item: ${fileName}`);

    // 3. Download
    const fileStream = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "arraybuffer" },
    );
    const buffer = Buffer.from(fileStream.data as ArrayBuffer);

    // 4. Parse PDF (Text + PageCount)
    const pdfParser = new PDFParser(null, 1);
    const parseResult = await new Promise<{ text: string; pages: number }>(
      (resolve, reject) => {
        pdfParser.on("pdfParser_dataError", (errData: any) =>
          reject(errData.parserError),
        );
        pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
          try {
            const text = pdfParser.getRawTextContent();
            const pages = pdfData.formImage?.Pages?.length || 0;
            resolve({ text, pages });
          } catch (e) {
            // Fallback
            resolve({ text: "", pages: 0 });
          }
        });
        pdfParser.parseBuffer(buffer);
      },
    );

    const { text, pages } = parseResult;

    // 5. Extract Metadata
    // Number
    const numberMatch = text.match(/N\s*\/\s*([\d.]+)/i);
    const numero = numberMatch
      ? parseInt(numberMatch[1].replace(/\./g, ""))
      : undefined;

    // Date (Fallback to CreatedTime)
    const fechaPublicacion = fileMeta.data.createdTime
      ? fileMeta.data.createdTime.split("T")[0]
      : new Date().toISOString().split("T")[0];

    // Year Roman
    const yearMatch = text.match(/Año\s+([XIVLCDM]+)/i);
    const añoEdicion = yearMatch ? yearMatch[1] : "";

    // 6. Upload to Payload Media
    const fileNameToSave = numero ? `${numero}.pdf` : fileName;
    const formData = new FormData();
    const blob = new Blob([buffer], { type: "application/pdf" });
    formData.append("file", blob, fileNameToSave);
    formData.append("alt", `Boletin N° ${numero || "??"} (Auto-sync)`);

    const API_BASE_URL =
      process.env.NEXT_PUBLIC_PAYLOAD_API_URL || "http://localhost:3000";

    const mediaRes = await fetch(`${API_BASE_URL}/api/boletines-pdf`, {
      method: "POST",
      headers: authHeader ? { Authorization: authHeader } : undefined,
      body: formData,
    });

    if (!mediaRes.ok) {
      const txt = await mediaRes.text();
      throw new Error(`Media Upload Failed: ${txt}`);
    }
    const mediaJson = await mediaRes.json();
    const mediaId = mediaJson.doc?.id || mediaJson.id;

    // 7. Create Bulletin
    const boletinPayload = {
      numero: numero,
      fecha_publicacion: fechaPublicacion,
      año_edicion: añoEdicion,
      raw_text: text.substring(0, 1000000),
      archivo_binario: mediaId,
      cantidad_paginas: pages, // NEW FIELD
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
      if (txt.includes("unique")) {
        // Mark as skipped/exists
        await supabaseAdmin.from("drive_sync_state").upsert({
          file_id: fileId,
          file_name: fileName,
          status: "success", // Considered success if it exists
          updated_at: new Date().toISOString(),
        });
        return NextResponse.json({ status: "skipped_exists", name: fileName });
      }
      throw new Error(`Bulletin Create Failed: ${txt}`);
    }

    // 8. Update State
    if (supabaseAdmin) {
      const { error: upsertError } = await supabaseAdmin
        .from("drive_sync_state")
        .upsert(
          {
            file_id: fileId,
            file_name: fileName,
            status: "success",
            processed_at: new Date().toISOString(),
          },
          { onConflict: "file_id" },
        );

      if (upsertError)
        console.error("Supabase upsert success error:", upsertError);
    }

    return NextResponse.json({
      status: "success",
      name: fileName,
      pages,
      extracted: {
        numero,
        fecha_publicacion: fechaPublicacion,
        año_edicion: añoEdicion,
      },
    });
  } catch (error: any) {
    console.error("Process error:", error);
    // Mark as error
    if (supabaseAdmin) {
      // We must read fileId safely. It might be consumed already?
      // Actually req.json() can only be read once. we already read it at the top.
      // But we have 'fileId' variable from the top scope! Use it!
      const fid = fileId || "unknown";

      const { error: failError } = await supabaseAdmin
        .from("drive_sync_state")
        .upsert(
          {
            file_id: fid,
            status: "error",
            // error_message: error.message, // Column missing in schema
            processed_at: new Date().toISOString(),
          },
          { onConflict: "file_id" },
        );

      if (failError) console.error("Supabase upsert fail error:", failError);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

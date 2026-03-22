/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { supabaseAdmin } from "@/lib/supabase";
import { createRequire } from "module";

// 60s timeout for processing multiple files
export const maxDuration = 60;

// Use pdf2json instead
const require = createRequire(import.meta.url);
const PDFParser = require("pdf2json");

export async function POST(req: NextRequest) {
  try {
    // Manual token is now optional
    const { accessToken: manualToken, folderId } = await req.json();

    if (!folderId) {
      return NextResponse.json(
        { error: "ID de carpeta requerido" },
        { status: 400 },
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        {
          error: "Supabase Service Key no configurada en variables de entorno",
        },
        { status: 500 },
      );
    }

    // 1. Setup Drive Client with Auto-Refresh
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    let auth;

    if (clientId && clientSecret && refreshToken) {
      console.log("Using Server-Side Google Auth (Auto-Refresh)");
      auth = new google.auth.OAuth2(clientId, clientSecret);
      auth.setCredentials({ refresh_token: refreshToken });
    } else if (manualToken) {
      console.log("Using Manual Access Token");
      auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: manualToken });
    } else {
      return NextResponse.json(
        { error: "Faltan credenciales de Google (Server ENV o Manual Token)" },
        { status: 401 },
      );
    }

    const drive = google.drive({ version: "v3", auth });

    // 2. List PDF Files
    const listRes = await drive.files.list({
      q: `'${folderId}' in parents and mimeType='application/pdf' and trashed=false`,
      fields: "files(id, name, createdTime)",
      pageSize: 10,
    });

    const files = listRes.data.files || [];
    const results = [];
    // Extract Authorization header (JWT token)
    const authHeader = req.headers.get("Authorization");
    console.log(
      "Drive Sync Auth Header received:",
      authHeader ? `${authHeader.substring(0, 15)}...` : "NONE",
    );

    const API_BASE_URL =
      process.env.PAYLOAD_API_URL || "http://localhost:3000";
    console.log(`Using API Base URL: ${API_BASE_URL}`);

    for (const file of files) {
      if (!file.id || !file.name) continue;

      // 3. Check Sync State
      const { data: existing } = await supabaseAdmin
        .from("drive_sync_state")
        .select("id, status")
        .eq("file_id", file.id)
        .single();

      if (existing && existing.status === "success") {
        results.push({ name: file.name, status: "skipped_exists" });
        continue;
      }

      try {
        console.log(`Procesando archivo Drive: ${file.name}`);

        // 4. Download File
        const fileStream = await drive.files.get(
          { fileId: file.id, alt: "media" },
          { responseType: "arraybuffer" },
        );
        const buffer = Buffer.from(fileStream.data as ArrayBuffer);

        // 5. Parse Text using pdf2json
        const pdfParser = new PDFParser(null, 1); // 1 = text only

        const textPromise = new Promise<string>((resolve, reject) => {
          pdfParser.on("pdfParser_dataError", (errData: any) =>
            reject(errData.parserError),
          );
          pdfParser.on("pdfParser_dataReady", () => {
            try {
              // getRawTextContent() is the method for raw text
              const rawText = pdfParser.getRawTextContent();
              resolve(rawText);
            } catch {
              resolve("");
            }
          });
        });

        // Trigger parsing
        pdfParser.parseBuffer(buffer);
        const text = await textPromise;

        // 6. Extract Metadata
        // Number
        const numberMatch = text.match(/N\s*\/\s*([\d.]+)/i);
        const numero = numberMatch
          ? parseInt(numberMatch[1].replace(/\./g, ""))
          : undefined;

        // Date (Fallback to CreatedTime)
        const fechaPublicacion = file.createdTime
          ? file.createdTime.split("T")[0]
          : new Date().toISOString().split("T")[0];

        // Year Roman
        const yearMatch = text.match(/Año\s+([XIVLCDM]+)/i);
        const añoEdicion = yearMatch ? yearMatch[1] : "";

        // 7. Rename Logic
        const fileNameToSave = numero ? `${numero}.pdf` : file.name;

        // 8. Upload to Payload Media (via API to trigger hooks/db)
        const formData = new FormData();
        const blob = new Blob([buffer], { type: "application/pdf" });
        formData.append("file", blob, fileNameToSave);
        formData.append(
          "alt",
          `Boletin N° ${numero || "??"} (Auto-sync Drive)`,
        );

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

        // 9. Create Bulletin
        const boletinPayload = {
          numero: numero,
          fecha_publicacion: fechaPublicacion,
          año_edicion: añoEdicion,
          raw_text: text.substring(0, 1000000), // Limit
          archivo_binario: mediaId,
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
            throw new Error("Duplicate Bulletin Number");
          }
          throw new Error(`Bulletin Create Failed: ${txt}`);
        }

        const bolJson = await bolRes.json();
        const boletinId = bolJson.doc?.id || bolJson.id;

        // 10. Update Sync State
        await supabaseAdmin.from("drive_sync_state").upsert(
          {
            file_id: file.id,
            file_name: file.name,
            boletin_id: boletinId,
            status: "success",
            processed_at: new Date().toISOString(),
          },
          { onConflict: "file_id" },
        );

        results.push({ name: file.name, status: "success", id: boletinId });
      } catch (err: any) {
        console.error(`Error processing ${file.name}:`, err);

        const status = err.message.includes("Duplicate")
          ? "skipped_duplicate"
          : "failed";

        await supabaseAdmin.from("drive_sync_state").upsert(
          {
            file_id: file.id,
            file_name: file.name,
            status: status,
            processed_at: new Date().toISOString(),
          },
          { onConflict: "file_id" },
        );

        results.push({ name: file.name, status, error: err.message });
      }
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("Sync error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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
    const headerText = text.substring(0, 10000);

    // Number: e.g. "N/ 22.980", "N° 22.980", "Nº 22.980", "N. 22.980"
    const numberMatch = headerText.match(/N\s*(?:°|º|\.|o|\/)?\s*([\d.]+)/i);
    const numero = numberMatch
      ? parseInt(numberMatch[1].replace(/\./g, ""))
      : undefined;

    // Year Roman
    const yearMatch = headerText.match(/Año\s+([XIVLCDM]+)/i);
    const añoEdicion = yearMatch ? yearMatch[1] : "";

    // Pages from text (fallback to pdf.pages)
    const pagesMatch = headerText.match(/Edición\s+de\s+(\d+)\s+Páginas/i);
    const pagesFromText = pagesMatch ? parseInt(pagesMatch[1]) : 0;
    const finalPages = pagesFromText || pages;

    // Recaudacion
    const recaudacionMatch = headerText.match(/TOTAL\s+[_]+\s*\$\s*([\d.,]+)/i);
    let recaudacionDiaria: number | undefined = undefined;
    if (recaudacionMatch) {
      const cleanVal = recaudacionMatch[1].replace(/\./g, "").replace(",", ".");
      recaudacionDiaria = parseFloat(cleanVal);
    }

    // Date
    const monthMap: { [key: string]: string } = {
      enero: "01",
      febrero: "02",
      marzo: "03",
      abril: "04",
      mayo: "05",
      junio: "06",
      julio: "07",
      agosto: "08",
      septiembre: "09",
      setiembre: "09",
      octubre: "10",
      noviembre: "11",
      diciembre: "12",
    };
    const dateRegex =
      /([a-záéíóú]+)\s+(\d{1,2})\s+de\s+([a-záéíóú]+)\s+de\s+(\d{4})/gi;
    let fechaPublicacion = fileMeta.data.createdTime
      ? fileMeta.data.createdTime.split("T")[0]
      : new Date().toISOString().split("T")[0]; // Fallback

    const dateMatches = [...headerText.matchAll(dateRegex)];
    for (const match of dateMatches) {
      const day = match[2].padStart(2, "0");
      const monthName = match[3].toLowerCase();
      const year = match[4];
      if (monthMap[monthName]) {
        const month = monthMap[monthName];
        // Append T12:00:00.000Z to prevent timezone offset making it the previous day
        fechaPublicacion = `${year}-${month}-${day}T12:00:00.000Z`;
        break;
      }
    }

    const API_BASE_URL =
      process.env.NEXT_PUBLIC_PAYLOAD_API_URL || "http://localhost:3000";

    // 5.1 Check if Bulletin already exists (Optimization to avoid duplicate media)
    if (fechaPublicacion && numero) {
      const potentialSlug = `${fechaPublicacion.split("T")[0]}-${numero}`;
      try {
        const checkRes = await fetch(
          `${API_BASE_URL}/api/boletines?where[slug][equals]=${potentialSlug}`,
          {
            headers: authHeader ? { Authorization: authHeader } : undefined,
          },
        );
        if (checkRes.ok) {
          const checkJson = await checkRes.json();
          if (checkJson.docs && checkJson.docs.length > 0) {
            console.log(
              `[DriveProcess] Bulletin ${potentialSlug} already exists. Skipping media upload.`,
            );
            // Mark as success in Supabase
            if (supabaseAdmin) {
              await supabaseAdmin.from("drive_sync_state").upsert(
                {
                  file_id: fileId,
                  file_name: fileName,
                  status: "success",
                  processed_at: new Date().toISOString(),
                },
                { onConflict: "file_id" },
              );
            }
            return NextResponse.json({
              status: "skipped_exists",
              name: fileName,
              pages: finalPages, // Ensure this variable is available in scope
              extracted: {
                numero,
                fecha_publicacion: fechaPublicacion,
                año_edicion: añoEdicion,
              },
            });
          }
        }
      } catch (e) {
        console.warn("Error checking for existing bulletin:", e);
      }
    }

    // 6. Upload to Payload Media
    const fileNameToSave = numero ? `${numero}.pdf` : fileName;
    const formData = new FormData();
    const blob = new Blob([buffer], { type: "application/pdf" });
    formData.append("file", blob, fileNameToSave);
    formData.append("alt", `Boletin N° ${numero || "??"} (Auto-sync)`);

    const mediaRes = await fetch(`${API_BASE_URL}/api/boletines-pdf`, {
      method: "POST",
      headers: authHeader ? { Authorization: authHeader } : undefined,
      body: formData,
    });

    let mediaId = "";

    if (!mediaRes.ok) {
      const txt = await mediaRes.text();
      console.warn("Media Upload Failed, trying to find existing:", txt);

      // Attempt to find existing file
      const findRes = await fetch(
        `${API_BASE_URL}/api/boletines-pdf?where[filename][equals]=${fileNameToSave}`,
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
          throw new Error(`Media Upload Failed and Not Found: ${txt}`);
        }
      } else {
        throw new Error(`Media Upload Failed: ${txt}`);
      }
    } else {
      const mediaJson = await mediaRes.json();
      mediaId = mediaJson.doc?.id || mediaJson.id;
    }

    // 7. Create Bulletin
    // synced with manual-upload schema and User's "Valid Payload Example"
    const boletinPayload = {
      numero: numero,
      fecha_publicacion: fechaPublicacion,
      año_edicion: añoEdicion,

      raw_text: text.substring(0, 1000000),
      archivo_binario: mediaId,
      cantidad_paginas: finalPages,
      recaudacion_diaria: recaudacionDiaria,

      // Initialize new fields
      status_procesamiento: "unprocessed",
      contenido_procesado: null,

      // Removed 'slug' to let backend hook generate it.
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
      if (txt.includes("unique") || txt.includes("único")) {
        // Mark as skipped/exists
        if (supabaseAdmin) {
          await supabaseAdmin.from("drive_sync_state").upsert({
            file_id: fileId,
            file_name: fileName,
            status: "success", // Considered success if it exists
            updated_at: new Date().toISOString(),
          });
        }
        return NextResponse.json({ status: "skipped_exists", name: fileName });
      }
      throw new Error(`Bulletin Create Failed: ${txt}`);
    }

    // 8. Update State
    if (supabaseAdmin) {
      console.log(
        `[DriveProcess] Updating Supabase status=success for ${fileId}`,
      );
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
    } else {
      console.warn(
        "[DriveProcess] supabaseAdmin is NULL - Skipping DB update for",
        fileId,
      );
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

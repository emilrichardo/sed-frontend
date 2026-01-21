import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { supabaseAdmin } from "@/lib/supabase";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { accessToken: manualToken, folderId } = await req.json();

    if (!folderId) {
      return NextResponse.json(
        { error: "ID de carpeta requerido" },
        { status: 400 },
      );
    }

    // Auth Setup
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    let auth;

    if (clientId && clientSecret && refreshToken) {
      auth = new google.auth.OAuth2(clientId, clientSecret);
      auth.setCredentials({ refresh_token: refreshToken });
    } else if (manualToken) {
      auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: manualToken });
    } else {
      return NextResponse.json(
        { error: "Credenciales faltantes" },
        { status: 401 },
      );
    }

    const drive = google.drive({ version: "v3", auth });

    // Function to recursively list files
    async function listFilesRecursively(
      folderId: string,
      pageToken?: string,
    ): Promise<any[]> {
      let allFiles: any[] = [];
      let query = `'${folderId}' in parents and trashed=false`;

      // We want PDFs AND Folders (to recurse)
      // query += " and (mimeType='application/pdf' or mimeType='application/vnd.google-apps.folder')";
      // Actually, just list everything and filter in memory or refine query

      const params: any = {
        q: query,
        fields: "nextPageToken, files(id, name, mimeType, createdTime)",
        pageSize: 1000,
        pageToken: pageToken,
      };

      const res = await drive.files.list(params);
      const files = res.data.files || [];

      const pdfs = files.filter((f) => f.mimeType === "application/pdf");
      const folders = files.filter(
        (f) => f.mimeType === "application/vnd.google-apps.folder",
      );

      allFiles = allFiles.concat(pdfs);

      // Recurse into subfolders
      // For performance/timeout, maybe limit recursion depth or do it breadth-first?
      // Current constraint: 60s. Deep recursion might timeout.
      // Let's do 1 level deep for now, or just flat if user didn't explicitly say "deeply nested".
      // User said "probablemente este dividida por subcarpetas". So we SHOULD recurse.

      for (const folder of folders) {
        if (folder.id) {
          const subFiles = await listFilesRecursively(folder.id);
          allFiles = allFiles.concat(subFiles);
        }
      }

      if (res.data.nextPageToken) {
        const moreFiles = await listFilesRecursively(
          folderId,
          res.data.nextPageToken,
        );
        allFiles = allFiles.concat(moreFiles);
      }

      return allFiles;
    }

    // Simplification: Just list PDFs in current folder with pagination (Up to 1000)
    // Recursive is risky for timeouts. Let's try to just get ALL pdfs in the root folder first.
    // If user needs subfolders, we'll add that.
    // RE-READING: "probablemente este dividida po subcarpetas". Okay, I will try to support it.

    // Better approach: Use a query that searches specific folder using 'ancestors' capability?
    // Drive API doesn't support "in ancestors".
    // We have to iterate.

    // Let's implement a queue-based scanner to avoid recursion depth issues, but keep it simple.

    const foldersToScan = [folderId];
    const foundFiles = [];

    // Safety break
    let loops = 0;
    while (foldersToScan.length > 0 && loops < 50) {
      // Limit to 50 folders scanned to prevent timeout
      const currentFolder = foldersToScan.shift();
      loops++;

      // List contents
      const res = await drive.files.list({
        q: `'${currentFolder}' in parents and trashed=false`,
        fields: "nextPageToken, files(id, name, mimeType, createdTime)",
        pageSize: 100,
      });

      const files = res.data.files || [];
      for (const f of files) {
        if (f.mimeType === "application/pdf") {
          foundFiles.push(f);
        } else if (f.mimeType === "application/vnd.google-apps.folder") {
          if (f.id) foldersToScan.push(f.id);
        }
      }
    }

    // Check DB status for these files
    const fileIds = foundFiles.map((f) => f.id);
    // Supabase 'in' query might fail if too many. Batch check?
    // Let's return the list and let frontend handle status or check casually.

    // We can do a quick check for "success" status
    let processed: any[] | null = [];
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from("drive_sync_state")
        .select("file_id, status")
        .in("file_id", fileIds.slice(0, 500)); // Limit check to 500
      processed = data;
    }

    const processedMap = new Map();
    processed?.forEach((p) => processedMap.set(p.file_id, p.status));

    const results = foundFiles.map((f) => {
      const dbStatus = processedMap.get(f.id);
      let status = "pending";
      if (dbStatus === "success") status = "synced";
      if (dbStatus === "error") status = "error";

      return {
        id: f.id,
        name: f.name,
        createdTime: f.createdTime,
        status,
        dbStatus, // debug info
      };
    });

    return NextResponse.json({ files: results });
  } catch (error: any) {
    console.error("Scan error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

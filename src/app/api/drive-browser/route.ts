export const dynamic = "force-static";
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(req: NextRequest) {
  if (process.env.NEXT_STATIC_EXPORT === "true")
    return Response.json({ error: "Not available" }, { status: 501 });
  try {
    const { folderId, pageToken } = await req.json();

    // Auth Setup (Same as drive-scan)
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      return NextResponse.json(
        { error: "Server Drive Credentials Missing" },
        { status: 500 },
      );
    }

    const auth = new google.auth.OAuth2(clientId, clientSecret);
    auth.setCredentials({ refresh_token: refreshToken });
    const drive = google.drive({ version: "v3", auth });

    const targetFolder = folderId || "root";
    const query = `'${targetFolder}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;

    const res = await drive.files.list({
      q: query,
      fields: "nextPageToken, files(id, name, mimeType)",
      orderBy: "name",
      pageSize: 50,
      pageToken,
    });

    return NextResponse.json({
      folders: res.data.files || [],
      nextPageToken: res.data.nextPageToken,
    });
  } catch (error: any) {
    console.error("Drive Browser Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

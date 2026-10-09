import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { detectBulletinImageType, getBulletinImageError } from "@/lib/bulletin-image";

export const dynamic = "force-dynamic";
const BASE_URL = (process.env.PAYLOAD_API_URL || "http://localhost:3000").replace(/\/+$/, "");

async function cmsRequest(path: string, token: string, options: RequestInit = {}) {
  const response = await fetch(`${BASE_URL}/api${path}`, {
    ...options,
    headers: { Authorization: `JWT ${token}`, ...options.headers },
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

async function assignImage(id: string, imageId: number | null, token: string) {
  const result = await cmsRequest(`/boletines/${id}?depth=1`, token, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imagen_destacada: imageId }),
  });
  if (result.response.ok) {
    revalidatePath("/boletines");
    revalidatePath("/boletines/hoy");
    revalidatePath("/");
    if (result.data.doc?.slug) revalidatePath(`/boletines/${result.data.doc.slug}`);
  }
  return result;
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("payload-token")?.value;
  if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  try {
    const form = await req.formData();
    const id = String(form.get("boletin_id") || "");
    const file = form.get("file");
    const alt = String(form.get("alt") || "").trim();
    if (!/^[1-9]\d*$/.test(id) || !(file instanceof File) || !alt || alt.length > 1000) {
      return NextResponse.json({ error: "Indicá el boletín, la imagen y una descripción de hasta 1000 caracteres." }, { status: 400 });
    }
    const error = getBulletinImageError(file);
    const mimeType = detectBulletinImageType(new Uint8Array(await file.slice(0, 12).arrayBuffer()));
    if (error || mimeType !== file.type) {
      return NextResponse.json({ error: error || "El contenido del archivo no coincide con una imagen válida." }, { status: 400 });
    }
    const existing = await cmsRequest(`/boletines/${id}?depth=0`, token);
    if (!existing.response.ok) return NextResponse.json(existing.data, { status: existing.response.status });
    const extension = mimeType.split("/")[1].replace("jpeg", "jpg");
    const upload = new FormData();
    upload.append("file", file, `boletin-${id}-${randomUUID()}.${extension}`);
    upload.append("_payload", JSON.stringify({ alt }));
    const media = await cmsRequest("/media", token, { method: "POST", body: upload });
    if (!media.response.ok) return NextResponse.json(media.data, { status: media.response.status });
    const mediaId = media.data.doc.id;
    try {
      const result = await assignImage(id, mediaId, token);
      if (!result.response.ok) {
        return NextResponse.json({ ...result.data, error: "La imagen se guardó en Media, pero no se pudo asignar al boletín.", media_id: mediaId }, { status: result.response.status });
      }
      return NextResponse.json(result.data);
    } catch {
      return NextResponse.json({ error: "La imagen se guardó en Media, pero falló la conexión al asignarla.", media_id: mediaId }, { status: 502 });
    }
  } catch {
    return NextResponse.json({ error: "No se pudo subir la imagen. Revisá el archivo y la conexión." }, { status: 502 });
  }
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get("payload-token")?.value;
  if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("boletin_id") || "";
  if (!/^[1-9]\d*$/.test(id)) return NextResponse.json({ error: "Boletín inválido" }, { status: 400 });
  try {
    const result = await assignImage(id, null, token);
    return NextResponse.json(result.data, { status: result.response.status });
  } catch {
    return NextResponse.json({ error: "No se pudo quitar la imagen." }, { status: 502 });
  }
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get("payload-token")?.value;
  if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  let body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const id = String(body.boletin_id || "");
  const mediaId = Number(body.media_id);
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(mediaId) || mediaId <= 0) {
    return NextResponse.json({ error: "Boletín o imagen inválidos" }, { status: 400 });
  }
  try {
    const result = await assignImage(id, mediaId, token);
    return NextResponse.json(result.data, { status: result.response.status });
  } catch {
    return NextResponse.json({ error: "No se pudo asignar la imagen." }, { status: 502 });
  }
}

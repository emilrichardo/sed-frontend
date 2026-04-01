export const dynamic = "force-static";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

/**
 * Webhook recibido desde Payload CMS cuando se crea/actualiza/elimina contenido.
 *
 * Configurar en Payload CMS (payload.config.ts) un hook global afterOperation:
 *
 *   hooks: {
 *     afterOperation: [
 *       async ({ operation }) => {
 *         if (['create','update','delete'].includes(operation)) {
 *           await fetch('https://tu-sitio.vercel.app/api/webhook', {
 *             method: 'POST',
 *             headers: {
 *               'Content-Type': 'application/json',
 *               'x-webhook-secret': process.env.WEBHOOK_SECRET,
 *             },
 *             body: JSON.stringify({ operation, ts: Date.now() }),
 *           }).catch(() => {});
 *         }
 *       }
 *     ]
 *   }
 *
 * Variables de entorno necesarias en Vercel:
 *   WEBHOOK_SECRET=<mismo valor que en Payload>
 */
export async function POST(req: NextRequest) {
  if (process.env.NEXT_STATIC_EXPORT === "true")
    return Response.json({ error: "Not available" }, { status: 501 });
  const secret = req.headers.get("x-webhook-secret");

  if (!secret || secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { collection?: string; operation?: string } = {};
  try {
    body = await req.json();
  } catch {
    // body vacío es aceptable
  }

  // Revalida según la colección que cambió
  const collection = body.collection;

  if (!collection || collection === "boletines") {
    revalidatePath("/boletines", "page");
    revalidatePath("/", "page");
  }
  if (!collection || collection === "publicaciones") {
    revalidatePath("/publicaciones", "page");
    revalidatePath("/", "page");
  }
  if (!collection || collection === "taxonomias") {
    revalidatePath("/categorias", "page");
  }
  if (!collection || ["coparticipacion", "ingresos", "ahorros"].includes(collection)) {
    revalidatePath("/coparticipacion", "page");
    revalidatePath("/ingresos", "page");
    revalidatePath("/", "page");
  }

  // Siempre revalida el layout para el navbar
  revalidatePath("/", "layout");

  console.log(
    `[webhook] Revalidado — colección: ${collection ?? "all"} — ${new Date().toISOString()}`,
  );

  return NextResponse.json({
    ok: true,
    revalidated: true,
    collection,
    timestamp: new Date().toISOString(),
  });
}

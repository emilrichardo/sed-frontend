import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

/**
 * Vercel Cron Job — se ejecuta cada 6 horas automáticamente.
 * Vercel inyecta CRON_SECRET en el header Authorization para verificar
 * que el request viene de la infraestructura de Vercel y no de un tercero.
 *
 * Configura en Vercel Dashboard → Settings → Environment Variables:
 *   CRON_SECRET=<string aleatorio seguro>
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Revalida todas las rutas principales
  revalidatePath("/", "layout");
  revalidatePath("/boletines", "page");
  revalidatePath("/publicaciones", "page");
  revalidatePath("/categorias", "page");
  revalidatePath("/coparticipacion", "page");
  revalidatePath("/ingresos", "page");

  console.log(`[cron] Revalidación completa — ${new Date().toISOString()}`);

  return NextResponse.json({
    ok: true,
    revalidated: true,
    timestamp: new Date().toISOString(),
  });
}

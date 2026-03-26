export const dynamic = "force-static";
import { NextRequest, NextResponse } from "next/server";

const BASE_URL = (
  process.env.PAYLOAD_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");
const CMS_API = `${BASE_URL}/api`;

const AI_URL = process.env.AI_MODEL_URL!;
const AI_MODEL = process.env.AI_MODEL!;
const AI_API_KEY = process.env.AI_API_KEY!;

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchCMSContext(userQuery: string): Promise<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reports: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  categories: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bulletins: any[];
  totalReports: number;
  totalBulletins: number;
  totalCategories: number;
}> {
  const [reportsRes, searchRes, categoriesRes, bulletinsRes] =
    await Promise.allSettled([
      fetch(
        `${CMS_API}/publicaciones?limit=80&depth=1&sort=-publishedDate&where[_status][equals]=published`,
      ),
      userQuery.length > 3
        ? fetch(
            `${CMS_API}/publicaciones?limit=20&depth=1&where[titulo][like]=${encodeURIComponent(userQuery)}`,
          )
        : Promise.resolve(null),
      fetch(
        `${CMS_API}/taxonomias?limit=150&depth=1&where[tipo][equals]=categoria&sort=nombre`,
      ),
      fetch(`${CMS_API}/boletines?limit=15&sort=-fecha`),
    ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let reports: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let categories: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let bulletins: any[] = [];
  let totalReports = 0;
  let totalBulletins = 0;
  let totalCategories = 0;

  if (reportsRes.status === "fulfilled" && reportsRes.value?.ok) {
    const data = await reportsRes.value.json();
    reports = data.docs || [];
    totalReports = data.totalDocs ?? reports.length;
  }

  // Merge search results (deduplicated)
  if (
    searchRes.status === "fulfilled" &&
    searchRes.value &&
    "ok" in searchRes.value &&
    searchRes.value.ok
  ) {
    const data = await (searchRes.value as Response).json();
    const searchDocs: { id: number }[] = data.docs || [];
    const existingIds = new Set(reports.map((r) => r.id));
    for (const doc of searchDocs) {
      if (!existingIds.has(doc.id)) reports.push(doc);
    }
  }

  if (categoriesRes.status === "fulfilled" && categoriesRes.value?.ok) {
    const data = await categoriesRes.value.json();
    categories = data.docs || [];
    totalCategories = data.totalDocs ?? categories.length;
  }

  if (bulletinsRes.status === "fulfilled" && bulletinsRes.value?.ok) {
    const data = await bulletinsRes.value.json();
    bulletins = data.docs || [];
    totalBulletins = data.totalDocs ?? bulletins.length;
  }

  return {
    reports,
    categories,
    bulletins,
    totalReports,
    totalBulletins,
    totalCategories,
  };
}

function buildSystemPrompt(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reports: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  categories: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bulletins: any[],
  totalReports: number,
  totalBulletins: number,
  totalCategories: number,
): string {
  const catList = categories
    .map((c) => {
      const parent =
        c.parent && typeof c.parent === "object" ? ` (subcategoría de: ${c.parent.nombre})` : "";
      return `  - ${c.nombre}${parent} → /categorias/${c.slug}`;
    })
    .join("\n");

  const reportList = reports
    .map((r) => {
      const cats = (r.categorias || r.taxonomias || [])
        .filter((c: unknown) => c && typeof c === "object")
        .map((c: { nombre?: string }) => c.nombre || "")
        .filter(Boolean)
        .join(", ");
      const date = r.publishedDate
        ? new Date(r.publishedDate).toLocaleDateString("es-AR", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "sin fecha";
      const autor =
        r.autor && typeof r.autor === "object"
          ? ` | Autor: ${r.autor.nombre} ${r.autor.apellido}`
          : "";
      return `  - "${r.titulo}" | Fecha: ${date} | Categoría: ${cats || "sin categoría"}${autor} → /publicaciones/${r.slug}`;
    })
    .join("\n");

  const bulletinList = bulletins
    .map((b) => {
      const date = b.fecha
        ? new Date(b.fecha).toLocaleDateString("es-AR", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "sin fecha";
      const num = b.numero ? `Nº ${b.numero}` : "";
      return `  - Boletín ${num} del ${date}${b.titulo ? `: ${b.titulo}` : ""} → /boletines/${b.slug || b.id}`;
    })
    .join("\n");

  return `Eres el asistente virtual oficial de **Santiago en Datos**, el portal de datos abiertos, estadísticas e informes de la provincia de Santiago del Estero, Argentina.

## Tu misión
Ayudar a los usuarios a encontrar, entender y acceder a la información publicada en el portal. Eres experto en todo el contenido disponible en Santiago en Datos.

## Reglas estrictas
1. **NUNCA inventes datos, estadísticas, cifras ni publicaciones** que no estén en el contexto provisto a continuación.
2. Si te preguntan algo que no está en el contexto, responde honestamente: "No tengo esa información en el portal actualmente."
3. Responde siempre en español rioplatense (Argentina).
4. Usa Markdown para estructurar tus respuestas cuando sea útil (listas, negrita, etc.).
5. Cuando menciones una publicación, boletín o sección, incluye su enlace relativo en formato Markdown: [título](/ruta).
6. Sé conciso pero completo. No hagas respuestas innecesariamente largas.
7. Si el usuario saluda o hace preguntas generales, responde amigablemente y ofrecete a ayudar.

## Sobre Santiago en Datos
Santiago en Datos es el portal oficial de datos abiertos de la provincia de Santiago del Estero, Argentina. Ofrece:
- Publicaciones e informes estadísticos sobre distintos temas provinciales (**${totalReports} publicaciones** en total).
- Boletines Oficiales de la provincia (**${totalBulletins} boletines** disponibles).
- Estadísticas financieras en tiempo real: coparticipación federal e ingresos provinciales.
- Organización temática en **${totalCategories} categorías**.
- Visualizaciones interactivas: gráficos de barras, tortas, líneas, mapas, tablas avanzadas, indicadores KPI, entre otros.

## Secciones principales del portal
- **Inicio** ([/](/)) — resumen general, estadísticas destacadas y widgets financieros en tiempo real.
- **Publicaciones** ([/publicaciones](/publicaciones)) — archivo completo de informes y estadísticas.
- **Categorías** ([/categorias](/categorias)) — navegación temática del contenido.
- **Boletín Oficial** ([/boletines](/boletines)) — archivo del boletín oficial de la provincia.
- **Coparticipación** ([/coparticipacion](/coparticipacion)) — datos de coparticipación federal a Santiago del Estero.
- **Ingresos** ([/ingresos](/ingresos)) — ingresos de la Provincia de Santiago del Estero.
- **Chat SED** (burbuja flotante) — este asistente virtual, siempre disponible en la esquina inferior derecha.

## Categorías disponibles en el portal (${categories.length} categorías)
${catList || "  (sin categorías cargadas)"}

## Publicaciones disponibles (${reports.length} de ${totalReports} total, ordenadas por fecha)
${reportList || "  (sin publicaciones cargadas)"}

## Boletines Oficiales recientes
${bulletinList || "  (sin boletines cargados)"}

---
Recuerda: solo puedes hablar de lo que está en este contexto. Si el usuario pregunta por algo que no aparece aquí, dilo con claridad y sugiere que visite el portal directamente para buscar información más actualizada.`;
}

export async function POST(req: NextRequest) {
  if (process.env.NEXT_STATIC_EXPORT === "true")
    return Response.json({ error: "Not available" }, { status: 501 });
  try {
    const body = await req.json();
    const messages: Message[] = body.messages || [];

    if (!messages.length) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 });
    }

    // Use the last user message as query for CMS search
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const userQuery = lastUser?.content?.slice(0, 200) ?? "";

    const { reports, categories, bulletins, totalReports, totalBulletins, totalCategories } =
      await fetchCMSContext(userQuery);

    const systemPrompt = buildSystemPrompt(
      reports,
      categories,
      bulletins,
      totalReports,
      totalBulletins,
      totalCategories,
    );

    const fullMessages: Message[] = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const aiResponse = await fetch(AI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: fullMessages,
        stream: true,
        max_tokens: 2048,
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok || !aiResponse.body) {
      const errText = await aiResponse.text().catch(() => "unknown error");
      console.error("AI API error:", aiResponse.status, errText);
      return NextResponse.json(
        { error: "Error al conectar con el servicio de IA" },
        { status: 502 },
      );
    }

    // Stream the AI response directly to the client
    return new Response(aiResponse.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    console.error("Chat route error:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

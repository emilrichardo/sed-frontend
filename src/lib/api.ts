const IS_SERVER = typeof window === "undefined";
// PAYLOAD_API_URL sin prefijo NEXT_PUBLIC_ → nunca se incrusta en el bundle JS
const BASE_URL = (
  process.env.PAYLOAD_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");
// En static export el cliente llama directo al CMS (NEXT_PUBLIC_PAYLOAD_API_URL).
// En SSR el cliente usa /api-proxy (rewrite de Next.js).
const CLIENT_BASE = process.env.NEXT_PUBLIC_PAYLOAD_API_URL
  ? process.env.NEXT_PUBLIC_PAYLOAD_API_URL.replace(/\/+$/, "")
  : null;
export const API_URL = IS_SERVER
  ? `${BASE_URL}/api`
  : CLIENT_BASE
    ? `${CLIENT_BASE}/api`
    : "/api-proxy";

// Base URL of the CMS (no /api suffix) — used for building CMS admin links.
// On the client: the NEXT_PUBLIC_PAYLOAD_API_URL value, or null in proxy mode.
export const CMS_BASE_URL: string | null = IS_SERVER ? BASE_URL : CLIENT_BASE;

/**
 * Rewrite PDF/media URLs from the internal Supabase host to a public host.
 * Set PDF_HOST_OVERRIDE=cms-sed.server.neuraz.io in Vercel env vars if the
 * internal Supabase host (api-sed.server.neuraz.io) is not publicly accessible.
 * Example nginx: proxy_pass Supabase storage through the CMS domain.
 */
export function resolvePdfUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const override = process.env.PDF_HOST_OVERRIDE;
  if (!override) return url;
  try {
    const u = new URL(url);
    u.hostname = override;
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * Shared fetch wrapper. Auth is handled via HttpOnly cookie (set by /api/auth/login).
 * The cookie is sent automatically on same-origin requests; server-side callers
 * that need to forward auth to Payload CMS should pass authToken explicitly.
 */
async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
  authToken?: string,
) {
  const isClient = typeof window !== "undefined";

  const headers = {
    ...options.headers,
    ...(authToken ? { Authorization: `JWT ${authToken}` } : {}),
  } as Record<string, string>;

  if (
    options.body &&
    !headers["Content-Type"] &&
    !(options.body instanceof FormData)
  ) {
    headers["Content-Type"] = "application/json";
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_URL}${endpoint}`;
  const res = await fetch(url, { ...options, headers });

  // Handle Auth Errors (401/403) on the client — dispatch event so AuthContext can react
  if ((res.status === 401 || res.status === 403) && isClient) {
    window.dispatchEvent(new Event("auth:unauthorized"));
  }

  return res;
}

export interface PayloadBlock {
  blockType: string;
  id: string;
  media?: { url?: string; alt?: string; caption?: string };
  url?: string;
  alt?: string;
  caption?: string;
  richText?: unknown;
  content?: unknown;
  [key: string]: unknown;
}

// Publications share the same structure as News but can have a parent
export interface ReportItem extends NewsItem {
  parent?: ReportItem | number | null;
}

export interface NewsItem {
  id: number;
  titulo: string;
  slug: string;
  publishedDate?: string;
  createdAt?: string;
  fijado?: boolean;
  orden?: number | null;
  layout?: PayloadBlock[];
  contenido?: {
    root?: {
      children?: Array<{ type?: string; children?: Array<{ text?: string }> }>;
    };
  } | null;
  taxonomias?: Array<{ id: number | string; nombre: string; slug?: string }>;
  categorias?: Array<{ id: number | string; nombre: string; slug?: string }>;
  tags?: Array<{ id: number | string; nombre: string; slug?: string }>;
  tipo_publicacion?:
    | { id: number | string; nombre: string; slug?: string }
    | number
    | null;
  autor?:
    | {
        id: number | string;
        nombre: string;
        apellido: string;
        cargo?: string;
        foto?: {
          url: string;
          alt?: string | null;
          [key: string]: unknown;
        };
      }
    | number;
  imagen_destacada?: {
    id: number | string;
    url: string;
    alt?: string;
    width?: number;
    height?: number;
    [key: string]: unknown;
  };
  fuentes?: string;
  [key: string]: unknown;
}

export interface WidgetTableChart {
  id: string;
  tipo_visualizacion: string;
  tabla_relacionada: {
    id: number;
    titulo: string;
    data: {
      rows: any[];
      columns: any[];
    };
  };
  configuracion_visualizacion?: {
    eje_principal?: string;
    eje_valores?: string;
    eje_secundario?: string;
    colores?: "default" | "vibrant" | "slate" | "semaphore" | "heatmap";
  };
}

export interface WidgetCTA {
  label: string;
  link_type: "internal" | "external";
  internal_link?: {
    relationTo: string;
    value: { id: number; slug: string; titulo?: string };
  };
  external_url?: string | null;
  open_new_tab?: boolean;
}

export interface WidgetItem {
  id: number;
  title: string;
  description?: string;
  image?: { url: string; alt?: string } | null;
  category?: string;
  tablas_graficos?: WidgetTableChart[];
  config?: Record<string, unknown>;
  cta?: WidgetCTA | null;
  updatedAt: string;
  createdAt: string;
}

export async function getWidgets(
  limit: number = 100,
): Promise<PayloadResponse<WidgetItem>> {
  try {
    const res = await apiFetch(`/widgets?limit=${limit}&sort=-createdAt`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      console.warn(
        `[getWidgets] Failed to fetch widgets: ${res.status} ${res.statusText}`,
      );
      return {
        docs: [],
        totalDocs: 0,
        limit,
        totalPages: 1,
        page: 1,
        pagingCounter: 1,
        hasPrevPage: false,
        hasNextPage: false,
        prevPage: null,
        nextPage: null,
      };
    }
    return res.json();
  } catch (error) {
    console.error(`[getWidgets] Error:`, error);
    return {
      docs: [],
      totalDocs: 0,
      limit,
      totalPages: 1,
      page: 1,
      pagingCounter: 1,
      hasPrevPage: false,
      hasNextPage: false,
      prevPage: null,
      nextPage: null,
    };
  }
}

// --- Widget Helper Functions ---

/**
 * Helper to fetch entries based on collection type for dynamic widgets
 */
export async function fetchEntriesForCollection(
  collection: string,
  limit: number,
  period?: string,
): Promise<Array<{ relationTo: string; value: any }>> {
  // Calculate date filter for period
  let where: Record<string, unknown> = {};
  if (period === "week") {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    where = { createdAt: { greater_than: weekAgo.toISOString() } };
  } else if (period === "month") {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    where = { createdAt: { greater_than: monthAgo.toISOString() } };
  }

  try {
    switch (collection) {
      case "boletines": {
        const result = await getBulletins({
          limit,
          sort: "-fecha_publicacion",
        });
        return result.docs.map((item) => ({
          relationTo: "boletines",
          value: {
            id: item.id,
            titulo: `Boletín Nº ${item.numero}`,
            slug: item.slug,
          },
        }));
      }
      case "publicaciones": {
        const result = await getReports({
          limit,
          sort: "orden,-createdAt",
          where: { parent: { exists: false } },
        });
        return result.docs.map((item) => ({
          relationTo: "publicaciones",
          value: { id: item.id, titulo: item.titulo, slug: item.slug },
        }));
      }
      default:
        return [];
    }
  } catch (error) {
    console.error(
      `[fetchEntriesForCollection] Error fetching ${collection}:`,
      error,
    );
    return [];
  }
}

/**
 * Resolves widget entries - if specific_entries is empty AND no charts, fetch from collection
 */
export async function resolveWidgetEntries(
  widget: WidgetItem,
): Promise<WidgetItem> {
  const config = widget.config;
  if (!config) return widget;

  // If widget has chart visualizations, don't fetch entries - it's a chart widget
  const hasCharts = widget.tablas_graficos && widget.tablas_graficos.length > 0;
  if (hasCharts) return widget;

  // Use explicit casting to avoid TS errors with Record<string, unknown>
  const specificEntries = (config.specific_entries as any[]) || [];
  const hasManualEntries = specificEntries.length > 0;

  // If manual entries exist, use them as-is
  if (hasManualEntries) return widget;

  // If no manual entries but collection is set, fetch latest
  if (config.collection && config.limit) {
    const fetchedEntries = await fetchEntriesForCollection(
      config.collection as string,
      config.limit as number,
      config.period as string | undefined,
    );

    return {
      ...widget,
      config: {
        ...config,
        specific_entries: fetchedEntries,
      },
    };
  }

  return widget;
}

/**
 * Traverses Lexical content recursively to find and resolve embedded widgets
 */
export async function resolveLexicalWidgets(node: any): Promise<any> {
  if (!node) return node;

  if (Array.isArray(node)) {
    return Promise.all(node.map(resolveLexicalWidgets));
  }

  // Clone node to avoid mutating original if needed, but in-place is usually fine for these fetches
  const newNode = { ...node };

  // Handle block type
  if (
    newNode.type === "block" &&
    newNode.fields?.blockType === "widget_block" &&
    newNode.fields.widget
  ) {
    try {
      newNode.fields.widget = await resolveWidgetEntries(newNode.fields.widget);
    } catch (err) {
      console.error("[resolveLexicalWidgets] Error resolving widget:", err);
    }
  }

  // Handle children recursively
  if (newNode.children && Array.isArray(newNode.children)) {
    newNode.children = await Promise.all(
      newNode.children.map(resolveLexicalWidgets),
    );
  }

  return newNode;
}

export interface PayloadResponse<T> {
  docs: T[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
}

// --- Official Bulletin Interfaces ---

export interface Seccion {
  id: string;
  nombre: string;
}

export interface TipoActo {
  id: string;
  nombre: string;
}

export interface Organismo {
  id: string;
  nombre: string;
}

export interface Taxonomy {
  id: string;
  nombre: string;
  slug?: string;
  descripcion?: string;
}

export interface Category {
  id: string | number;
  nombre: string;
  slug: string;
  tipo?: string;
  descripcion?: string;
  parent?: Category | string | number | null;
}

export async function getCategories(
  params: {
    sinPadre?: boolean;
    padreId?: string | number;
    limit?: number;
  } = {},
): Promise<Category[]> {
  const { sinPadre, padreId, limit = 100 } = params;
  let url = `${API_URL}/taxonomias?limit=${limit}&depth=1&where[tipo][equals]=categoria`;

  if (sinPadre) {
    url += `&where[parent][exists]=false`;
  } else if (padreId !== undefined) {
    url += `&where[parent][equals]=${padreId}`;
  }

  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.docs || [];
  } catch {
    return [];
  }
}

const CATEGORY_ORDER = [
  "trabajo",
  "produccion",
  "finanzas-provinciales",
  "educacion",
  "salud",
  "infraestructura",
  "ambiente",
];

export function sortCategoriesByOrder<T extends { slug: string }>(
  categories: T[],
): T[] {
  return [...categories].sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a.slug);
    const bi = CATEGORY_ORDER.indexOf(b.slug);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

export async function getCategoryBySlug(
  slug: string,
): Promise<Category | null> {
  try {
    const res = await fetch(
      `${API_URL}/taxonomias?where[slug][equals]=${slug}&where[tipo][equals]=categoria&depth=1`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.docs?.[0] ?? null;
  } catch {
    return null;
  }
}

export interface Boletin {
  id: string;
  numero: number;
  fecha_publicacion: string;
  slug: string;
  año_edicion: string;
  cantidad_paginas: number;
  recaudacion_diaria?: number;
  staff_autoridades?: unknown;
  archivo_binario?: string | { url: string; [key: string]: unknown }; // Media object or ID
  content_type?: string;
  raw_text?: string;
  contenido_procesado?: string | null;
  status_procesamiento?:
    | (
        | "unprocessed"
        | "basic"
        | "ai_enhanced"
        | "completed"
        | "processing"
        | "queued"
        | "error"
      )
    | null;
  cant_actos?: number;
  titulo_periodistico?: string;
  resumen?: string;
  procesamiento_asociado?: (string | Procesamiento)[] | null;
  imagen_destacada?: {
    id: number | string;
    url: string;
    alt?: string;
    width?: number;
    height?: number;
    [key: string]: unknown;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ActoAdministrativo {
  id: string;
  boletin: string | Boletin;
  identificador_de_acto: string;
  seccion: string;
  tipo_de_acto: string | TipoActo;
  jurisdiccion?: string | Organismo;
  titulo: string;
  resumen?: string;
  cuerpo: string;
  es_homologacion?: boolean;
  id_acto_referenciado?: string;
  nivel_opacidad?: "Transparente" | "Parcial" | "Opaco" | number;
  parent_id?: string | ActoAdministrativo;
  lugar_fecha?: string;
  resolucion?: string;
  paginas?: string;
  procesamiento_asociado?: (string | Procesamiento)[] | null;
  titulo_periodistico?: string;
  nota_periodistica?: string;
  status_procesamiento?: string;
  destacado?: boolean;
  es_relevante?: boolean;
  status?: "publicado" | "borrador";
  opacidad_categoria?: "baja" | "media" | "alta";
  organismo?: string;
  beneficiario?: string;
  monto?: number | null;
  objeto_del_gasto?: string | null;
  entidades_relacionadas?: {
    id: number | string;
    nombre: string;
    tipo: string;
    [key: string]: unknown;
  }[];
  referencias_relacionadas?: {
    id: number | string;
    tipo: string;
    valor: string;
    [key: string]: unknown;
  }[];
}

export interface DetalleEspecifico {
  id: string;
  id_entrada: string | ActoAdministrativo;
  detalles: Record<string, unknown>[];
}

// --- Agents & Learning Interfaces ---

export interface Agent {
  id: string;
  name: string;
  systemPrompt?: string;
  type?: "learning" | "extraction";
  sources?: string[]; // Array of collection slugs e.g. ["boletines", "noticias"]
  outputConfig?: {
    destinationCollection?: string;
    statusField?: string; // Field to check/update status in the doc
  };
  // Deprecated/Legacy
  sourceCollection?: string;
  status: "active" | "inactive";
  modelSettings?: {
    modelName: string;
    temperature: number;
    apiKey?: string;
  };
  learningLink?: string; // Relationship to latest learning
  createdAt: string;
  updatedAt: string;
}

export interface LearningRecord {
  id: string;
  agent: string | Agent;
  previousLearning?: string | LearningRecord;
  processed_items?: string[] | Boletin[];
  learningContext?: string;
  type: "error" | "fact" | "preference" | "analysis";
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// --- Report Functions ---

/**
 * Fetches publications for a given category (taxonomia) ID
 */
export async function getPublicacionesByCategoria(
  categoriaId: string | number,
  params: { page?: number; limit?: number } = {},
): Promise<PayloadResponse<ReportItem>> {
  const { page = 1, limit = 20 } = params;
  const url = `${API_URL}/publicaciones?page=${page}&limit=${limit}&sort=orden,-createdAt&depth=1&where[categorias][in][0]=${categoriaId}`;
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok)
      return {
        docs: [],
        totalDocs: 0,
        limit,
        totalPages: 0,
        page: 1,
        pagingCounter: 0,
        hasPrevPage: false,
        hasNextPage: false,
        prevPage: null,
        nextPage: null,
      };
    return res.json();
  } catch {
    return {
      docs: [],
      totalDocs: 0,
      limit,
      totalPages: 0,
      page: 1,
      pagingCounter: 0,
      hasPrevPage: false,
      hasNextPage: false,
      prevPage: null,
      nextPage: null,
    };
  }
}

/**
 * Fetches publications for multiple category IDs (OR filter)
 */
export async function getPublicacionesByCategoriaIds(
  categoriaIds: (string | number)[],
  params: { page?: number; limit?: number } = {},
): Promise<PayloadResponse<ReportItem>> {
  const { page = 1, limit = 100 } = params;
  const inParams = categoriaIds
    .map((id, i) => `where[categorias][in][${i}]=${id}`)
    .join("&");
  const url = `${API_URL}/publicaciones?page=${page}&limit=${limit}&sort=orden,-createdAt&depth=1&${inParams}`;
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok)
      return {
        docs: [],
        totalDocs: 0,
        limit,
        totalPages: 0,
        page: 1,
        pagingCounter: 0,
        hasPrevPage: false,
        hasNextPage: false,
        prevPage: null,
        nextPage: null,
      };
    return res.json();
  } catch {
    return {
      docs: [],
      totalDocs: 0,
      limit,
      totalPages: 0,
      page: 1,
      pagingCounter: 0,
      hasPrevPage: false,
      hasNextPage: false,
      prevPage: null,
      nextPage: null,
    };
  }
}

/**
 * Fetches a list of reports (Informes)
 */
export async function getReports(
  params: {
    page?: number;
    limit?: number;
    sort?: string;
    depth?: number;
    where?: Record<string, unknown>;
    pagination?: boolean;
  } = {},
): Promise<PayloadResponse<ReportItem>> {
  const { page = 1, limit = 10, sort = "orden,-createdAt", depth, where, pagination } = params;
  let url = `${API_URL}/publicaciones?page=${page}&limit=${limit}&sort=${sort}`;
  if (pagination === false) url += `&pagination=false`;
  if (depth !== undefined) url += `&depth=${depth}`;

  // Re-add draft=false if we want only published, but for now let's see why it's empty
  // url += "&draft=false";

  if (where) {
    Object.entries(where).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        if (typeof value === "object" && !Array.isArray(value)) {
          // Handle nested operators e.g. where: { parent: { exists: false } }
          Object.entries(value).forEach(([op, val]) => {
            url += `&where[${key}][${op}]=${val}`;
          });
        } else {
          url += `&where[${key}][equals]=${value}`;
        }
      }
    });
  }

  console.log(`[getReports] Fetching: ${url}`);

  const headers: Record<string, string> = {};
  if (process.env.PAYLOAD_USER_TOKEN) {
    headers["Authorization"] = `JWT ${process.env.PAYLOAD_USER_TOKEN}`;
  }

  try {
    const res = await fetch(url, {
      next: { revalidate: 60 },
      headers,
    });

    if (!res.ok) {
      throw new Error("Failed to fetch publications");
    }

    return res.json();
  } catch (error) {
    console.error("Error fetching reports:", error);
    return {
      docs: [],
      totalDocs: 0,
      limit: 10,
      totalPages: 0,
      page: 1,
      pagingCounter: 0,
      hasPrevPage: false,
      hasNextPage: false,
      prevPage: null,
      nextPage: null,
    };
  }
}

/**
 * Fetches a single publication by slug
 */
export async function getReportItem(slug: string): Promise<ReportItem | null> {
  try {
    // Search by slug
    const timestamp = Date.now();
    const reqHeaders: Record<string, string> = {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
    };
    if (process.env.PAYLOAD_USER_TOKEN) {
      reqHeaders["Authorization"] = `JWT ${process.env.PAYLOAD_USER_TOKEN}`;
    }
    const res = await fetch(
      `${API_URL}/publicaciones?where[slug][equals]=${slug}&depth=2&draft=false&t=${timestamp}`,
      {
        cache: "no-store",
        headers: reqHeaders,
      },
    );

    if (!res.ok) {
      return null;
    }

    const data: PayloadResponse<ReportItem> = await res.json();
    if (data.docs.length === 0) {
      return null;
    }
    const report = data.docs[0];

    // Check if author needs to be fetched manually
    if (report.autor && typeof report.autor !== "object") {
      try {
        const authorId = report.autor;
        const authHeaders: Record<string, string> = { "cache-control": "no-store" };
        if (process.env.PAYLOAD_USER_TOKEN) {
          authHeaders["Authorization"] = `JWT ${process.env.PAYLOAD_USER_TOKEN}`;
        }
        const userRes = await fetch(`${BASE_URL}/api/users/${authorId}`, {
          cache: "no-store",
          headers: authHeaders,
        });
        if (userRes.ok) {
          const user = await userRes.json();
          report.autor = user;
        }
      } catch {
        // silently skip
      }
    }

    return report;
  } catch (error) {
    console.error(`Error fetching report item ${slug}:`, error);
    return null;
  }
}

// --- Official Bulletin API Functions ---

export async function getBulletins(
  params: {
    page?: number;
    limit?: number;
    sort?: string;
    where?: Record<string, unknown>;
  } = {},
): Promise<PayloadResponse<Boletin>> {
  const { page = 1, limit = 10, sort = "-fecha_publicacion", where } = params;
  let url = `${API_URL}/boletines?page=${page}&limit=${limit}&sort=${sort}&depth=2&draft=false`;

  if (where) {
    Object.entries(where).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        if (key === "fecha_desde") {
          url += `&where[fecha_publicacion][greater_than_equal]=${value}`;
        } else if (key === "fecha_hasta") {
          url += `&where[fecha_publicacion][less_than_equal]=${value}`;
        } else if (key !== "search") {
          url += `&where[${key}][equals]=${value}`;
        }
      }
    });
  }

  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) {
      console.warn(
        `[getBulletins] Failed to fetch: ${res.status} ${res.statusText} - ${url}`,
      );
      return {
        docs: [],
        totalDocs: 0,
        limit,
        totalPages: 0,
        page: 1,
        pagingCounter: 0,
        hasPrevPage: false,
        hasNextPage: false,
        prevPage: null,
        nextPage: null,
      };
    }
    return await res.json();
  } catch (error) {
    console.error(`[getBulletins] Error:`, error);
    return {
      docs: [],
      totalDocs: 0,
      limit,
      totalPages: 0,
      page: 1,
      pagingCounter: 0,
      hasPrevPage: false,
      hasNextPage: false,
      prevPage: null,
      nextPage: null,
    };
  }
}

export async function getBulletin(
  idOrSlug: string,
  authToken?: string,
): Promise<Boletin> {
  if (!idOrSlug) throw new Error("ID or Slug is required");
  const idStr = String(idOrSlug);
  console.log(`fetching bulletin: ${idStr}`);

  // 1. Search by slug field (always first — avoids collisions with DB numeric IDs)
  try {
    const res = await apiFetch(
      `/boletines?where[slug][equals]=${idStr}&draft=false&depth=2`,
      { next: { revalidate: 3600 } },
      authToken,
    );
    if (res.ok) {
      const data = await res.json();
      if (data.docs && data.docs.length > 0) {
        console.log(`bulletin found by slug field: ${idStr}`);
        return data.docs[0];
      }
    }
  } catch (e) {
    console.log(`slug search failed for ${idStr}`);
  }

  // 2. If numeric, search by numero
  if (/^\d+$/.test(idStr)) {
    try {
      const res = await apiFetch(
        `/boletines?where[numero][equals]=${idStr}&sort=-createdAt&draft=false&depth=2`,
        { next: { revalidate: 3600 } },
        authToken,
      );
      if (res.ok) {
        const data = await res.json();
        if (data.docs && data.docs.length > 0) {
          console.log(`bulletin found by numero: ${idStr}`);
          return data.docs[0];
        }
      }
    } catch (e) {
      console.log(`numero search failed for ${idStr}`);
    }
  }

  // 3. Last resort: direct ID fetch
  try {
    const res = await apiFetch(
      `/boletines/${idStr}?draft=false&depth=2`,
      { next: { revalidate: 3600 } },
      authToken,
    );
    if (res.ok) {
      console.log(`bulletin found as direct ID: ${idStr}`);
      return await res.json();
    }
  } catch (e) {
    console.log(`direct ID fetch failed for ${idStr}`);
  }

  throw new Error(`Bulletin not found: ${idStr}`);
}

export async function getActosAdministrativos(
  params: {
    page?: number;
    limit?: number;
    sort?: string;
    where?: Record<string, unknown>;
    depth?: number;
    authToken?: string;
  } = {},
): Promise<PayloadResponse<ActoAdministrativo>> {
  const {
    page = 1,
    limit = 20,
    sort = "-boletin.fecha_publicacion",
    where,
    depth = 1,
    authToken,
  } = params;
  let queryString = `?page=${page}&limit=${limit}&sort=${sort}&depth=${depth}&draft=false`;

  // Si no hay token de autenticación, filtrar solo actos publicados
  if (!authToken) {
    queryString += `&where[status][equals]=publicado`;
  }

  if (where) {
    Object.entries(where).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        if (key === "search") {
          queryString += `&where[or][0][identificador_de_acto][contains]=${value}`;
          queryString += `&where[or][1][titulo][contains]=${value}`;
        } else if (key === "fecha_desde") {
          queryString += `&where[boletin.fecha_publicacion][greater_than_equal]=${value}`;
        } else if (key === "fecha_hasta") {
          queryString += `&where[boletin.fecha_publicacion][less_than_equal]=${value}`;
        } else {
          // Map some old field names to new ones for compatibility
          let apiKey = key;
          if (key === "identificador_acto") apiKey = "identificador_de_acto";
          if (key === "tipo_acto") apiKey = "tipo_de_acto";
          if (key === "referencia") apiKey = "titulo";

          queryString += `&where[${apiKey}][equals]=${value}`;
        }
      }
    });
  }

  const res = await apiFetch(
    `/actos-administrativos${queryString}`,
    {
      next: { revalidate: 60 },
    },
    authToken,
  );

  if (!res.ok) {
    console.error(
      `getActosAdministrativos failed: ${res.status} ${res.statusText} - URL: ${queryString}`,
    );
    const text = await res.text();
    console.error("Response body:", text);
    throw new Error(`Failed to fetch actos administrativos: ${res.statusText}`);
  }
  return res.json();
}

export async function getActoByIdentifier(
  identifier: string,
  authToken?: string,
): Promise<ActoAdministrativo> {
  console.log(`getActoByIdentifier: searching for "${identifier}"`);

  // Search by identificador_de_acto
  const encodedId = encodeURIComponent(identifier);
  let queryString = `?where[identificador_de_acto][equals]=${encodedId}&depth=2`;
  
  // Si no hay token de autenticación, filtrar solo actos publicados
  if (!authToken) {
    queryString += `&where[status][equals]=publicado`;
  }
  
  const res = await apiFetch(
    `/actos-administrativos${queryString}`,
    { next: { revalidate: 10 } },
  );

  if (!res.ok) {
    console.error(`getActoByIdentifier failed status: ${res.status}`);
    throw new Error("Failed to fetch acto by identifier");
  }

  const data: PayloadResponse<ActoAdministrativo> = await res.json();

  if (data.docs.length > 0) {
    console.log(`getActoByIdentifier: found exact match for "${identifier}"`);
    return data.docs[0];
  }

  console.log(
    `getActoByIdentifier: no exact match for "${identifier}", trying fallback...`,
  );

  // Fallback: Try by ID if identifier looks like an ID (numeric)
  if (/^\d+$/.test(identifier)) {
    return getActoAdministrativo(identifier, authToken);
  }

  // Fallback 2: Try "like" search if it failed (sometimes encoding issues)
  // Only if identifier is long enough to be specific
  if (identifier.length > 5) {
    let likeQueryString = `?where[identificador_de_acto][like]=${encodedId}&depth=2`;
    if (!authToken) {
      likeQueryString += `&where[status][equals]=publicado`;
    }
    const resLike = await apiFetch(
      `/actos-administrativos${likeQueryString}`,
      { next: { revalidate: 60 } },
    );
    const dataLike = await resLike.json();
    if (dataLike.docs && dataLike.docs.length > 0) {
      console.log(`getActoByIdentifier: found like match for "${identifier}"`);
      return dataLike.docs[0];
    }
  }

  throw new Error(`Acto not found: ${identifier}`);
}

export async function getActoAdministrativo(
  id: string,
  authToken?: string,
): Promise<ActoAdministrativo> {
  let queryString = `?depth=2`;
  
  // Si no hay token de autenticación, filtrar solo actos publicados
  if (!authToken) {
    queryString += `&where[status][equals]=publicado`;
  }
  
  const res = await apiFetch(`/actos-administrativos/${id}${queryString}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error("Failed to fetch acto administrativo");
  
  const acto = await res.json();
  
  // Verificación adicional: si no hay token y el acto no está publicado, rechazar
  if (!authToken && acto.status !== "publicado") {
    throw new Error("Acto no disponible");
  }
  
  return acto;
}

export async function getEntryDetails(
  entryId: string,
): Promise<DetalleEspecifico[]> {
  const res = await apiFetch(
    `/detalles-especificos?where[id_entrada][equals]=${entryId}&depth=2`,
    { next: { revalidate: 60 } },
  );
  if (!res.ok) throw new Error("Failed to fetch entry details");
  const data = await res.json();
  return data.docs;
}

export async function getTaxonomy<T>(collection: string): Promise<T[]> {
  const res = await fetch(`${API_URL}/${collection}?limit=100`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${collection}`);
  const data = await res.json();
  return data.docs;
}
export async function createBulletin(
  data: Partial<Boletin>,
): Promise<{ doc: Boletin; message: string }> {
  const res = await fetch(`${API_URL}/boletines`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    console.error("API: createBulletin error:", res.status, res.statusText);
    const errorData = await res.json().catch(() => ({}));
    console.error(
      "API: createBulletin error details:",
      JSON.stringify(errorData, null, 2),
    );
    throw new Error(`Failed to create bulletin: ${res.statusText}`);
  }
  return res.json();
}

export async function updateBulletin(
  id: string,
  data: Partial<Boletin>,
  authToken?: string,
): Promise<{ doc: Boletin; message: string }> {
  const res = await apiFetch(
    `/boletines/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
    authToken,
  );

  if (!res.ok) {
    console.error("API: updateBulletin error:", res.status, res.statusText);
    const errorData = await res.json().catch(() => ({}));
    console.error(
      "API: updateBulletin error details:",
      JSON.stringify(errorData, null, 2),
    );
    throw new Error(`Failed to update bulletin: ${res.statusText}`);
  }
  return res.json();
}

export async function deleteBulletin(
  id: string,
  authToken?: string,
): Promise<{ message: string }> {
  const res = await apiFetch(
    `/boletines/${id}`,
    {
      method: "DELETE",
    },
    authToken,
  );

  if (!res.ok) {
    console.error("API: deleteBulletin error:", res.status, res.statusText);
    const errorData = await res.json().catch(() => ({}));
    console.error(
      "API: deleteBulletin error details:",
      JSON.stringify(errorData, null, 2),
    );
    throw new Error(`Failed to delete bulletin: ${res.statusText}`);
  }
  return res.json();
}

export async function createActoAdministrativo(
  data: Partial<ActoAdministrativo>,
): Promise<{ doc: ActoAdministrativo; message: string }> {
  const res = await apiFetch("/actos-administrativos", {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    console.error("API: createEntry error:", res.status, res.statusText);
    const errorData = await res.json().catch(() => ({}));
    console.error(
      "API: createEntry error details:",
      JSON.stringify(errorData, null, 2),
    );
    throw new Error(`Failed to create entry: ${res.statusText}`);
  }
  return res.json();
}

export async function updateActoAdministrativo(
  id: string,
  data: Partial<ActoAdministrativo>,
  authToken?: string,
): Promise<{ doc: ActoAdministrativo; message: string }> {
  const isClient = typeof window !== "undefined";

  console.log(`[updateActoAdministrativo] id=${id}, isClient=${isClient}, hasAuthToken=${!!authToken}`);
  console.log(`[updateActoAdministrativo] data=`, JSON.stringify(data));

  // En el cliente, usar el BFF /api/cms que maneja la cookie de autenticación
  if (isClient && !authToken) {
    const url = `/api/cms?path=/actos-administrativos/${encodeURIComponent(id)}`;
    console.log(`[updateActoAdministrativo] Using BFF: ${url}`);
    
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    console.log(`[updateActoAdministrativo] BFF response status: ${res.status}`);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error("[updateActoAdministrativo] Error response:", errorData);
      const errorMessage = errorData.error || errorData.message || errorData.errors?.[0]?.message || `Error ${res.status}: ${res.statusText}`;
      throw new Error(errorMessage);
    }
    
    const result = await res.json();
    console.log("[updateActoAdministrativo] Success:", result);
    return result;
  }

  // En el servidor o con token explícito, usar apiFetch directo
  const res = await apiFetch(
    `/actos-administrativos/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
    authToken,
  );

  if (!res.ok) {
    console.error("API: updateActo error:", res.status, res.statusText);
    const errorData = await res.json().catch(() => ({}));
    console.error(
      "API: updateActo error details:",
      JSON.stringify(errorData, null, 2),
    );
    throw new Error(`Failed to update acto: ${res.statusText}`);
  }
  return res.json();
}

export async function createTaxonomy(
  collection: string,
  data: { nombre: string },
): Promise<unknown> {
  const res = await apiFetch(`/${collection}`, {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    console.error(
      `API: createTaxonomy (${collection}) error:`,
      res.status,
      res.statusText,
    );
    const errorData = await res.json().catch(() => ({}));
    console.error(
      `API: createTaxonomy (${collection}) error details:`,
      JSON.stringify(errorData, null, 2),
    );
    throw new Error(`Failed to create ${collection}: ${res.statusText}`);
  }
  return res.json();
}

// --- Agents & Learning API Functions ---

export async function getAgents(authToken?: string): Promise<Agent[]> {
  const res = await apiFetch("/agents", { cache: "no-store" }, authToken);

  if (!res.ok) {
    console.error("API: getAgents error:", res.status, res.statusText);
    return [];
  }

  const data = await res.json();
  return data.docs || [];
}

export async function getAgent(
  id: string,
  authToken?: string,
): Promise<Agent | null> {
  const res = await apiFetch(`/agents/${id}`, { cache: "no-store" }, authToken);

  if (!res.ok) {
    console.error(`API: getAgent(${id}) error:`, res.status, res.statusText);
    return null;
  }

  return res.json();
}

/** Recursively updates tipo_visualizacion on a block by ID within Lexical JSON */
function patchBlockInNode(node: any, blockId: string, tipo_visualizacion: string): boolean {
  if (!node) return false;
  if (node.type === "block" && node.fields?.id === blockId) {
    node.fields.tipo_visualizacion = tipo_visualizacion;
    return true;
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      if (patchBlockInNode(child, blockId, tipo_visualizacion)) return true;
    }
  }
  return false;
}

function patchBlockCustomMarkupInNode(node: any, blockId: string, custom_markup: string): boolean {
  if (!node) return false;
  if (node.type === "block" && node.fields?.id === blockId) {
    node.fields.custom_markup = custom_markup;
    return true;
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      if (patchBlockCustomMarkupInNode(child, blockId, custom_markup)) return true;
    }
  }
  return false;
}

export async function updatePublicacionBlockCustomMarkup(
  publicacionId: string | number,
  blockId: string,
  custom_markup: string,
): Promise<void> {
  const isClient = typeof window !== "undefined";

  const getUrl = isClient
    ? `/api/cms?path=/publicaciones/${publicacionId}&qs=depth%3D0`
    : null;
  const getRes = getUrl
    ? await fetch(getUrl, { cache: "no-store" })
    : await apiFetch(`/publicaciones/${publicacionId}?depth=0`);

  if (!getRes.ok) {
    throw new Error(`No se pudo obtener la publicación (${getRes.status})`);
  }
  const pub = await getRes.json();

  const contenido = pub.contenido;
  if (!contenido?.root) throw new Error("La publicación no tiene contenido Lexical");
  const found = patchBlockCustomMarkupInNode(contenido.root, blockId, custom_markup);
  if (!found) throw new Error("Bloque no encontrado en el contenido");

  if (isClient) {
    const patchRes = await fetch(`/api/cms?path=/publicaciones/${publicacionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contenido }),
    });
    if (!patchRes.ok) {
      const err = await patchRes.json().catch(() => ({}));
      throw new Error(err.errors?.[0]?.message || err.message || `Error ${patchRes.status}`);
    }
  } else {
    const patchRes = await apiFetch(`/publicaciones/${publicacionId}`, {
      method: "PATCH",
      body: JSON.stringify({ contenido }),
    });
    if (!patchRes.ok) {
      const err = await patchRes.json().catch(() => ({}));
      throw new Error(err.errors?.[0]?.message || err.message || `Error ${patchRes.status}`);
    }
  }
}

export async function updatePublicacionBlockVisualizacion(
  publicacionId: string | number,
  blockId: string,
  tipo_visualizacion: string,
): Promise<void> {
  const isClient = typeof window !== "undefined";

  // 1. Fetch current publication (via BFF on client to get auth, direct on server)
  const getUrl = isClient
    ? `/api/cms?path=/publicaciones/${publicacionId}&qs=depth%3D0`
    : null;
  const getRes = getUrl
    ? await fetch(getUrl, { cache: "no-store" })
    : await apiFetch(`/publicaciones/${publicacionId}?depth=0`);

  if (!getRes.ok) {
    throw new Error(`No se pudo obtener la publicación (${getRes.status})`);
  }
  const pub = await getRes.json();

  // 2. Patch the block in the Lexical contenido tree
  const contenido = pub.contenido;
  if (!contenido?.root) throw new Error("La publicación no tiene contenido Lexical");
  const found = patchBlockInNode(contenido.root, blockId, tipo_visualizacion);
  if (!found) throw new Error("Bloque no encontrado en el contenido");

  // 3. PATCH via BFF on client (adds auth cookie), direct apiFetch on server
  if (isClient) {
    const patchRes = await fetch(`/api/cms?path=/publicaciones/${publicacionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contenido }),
    });
    if (!patchRes.ok) {
      const err = await patchRes.json().catch(() => ({}));
      throw new Error(err.errors?.[0]?.message || err.message || `Error ${patchRes.status}`);
    }
  } else {
    const patchRes = await apiFetch(`/publicaciones/${publicacionId}`, {
      method: "PATCH",
      body: JSON.stringify({ contenido }),
    });
    if (!patchRes.ok) {
      const err = await patchRes.json().catch(() => ({}));
      throw new Error(err.errors?.[0]?.message || err.message || `Error ${patchRes.status}`);
    }
  }
}

export async function updateAgent(
  id: string,
  data: Partial<Omit<Agent, "id" | "createdAt" | "updatedAt">>,
): Promise<Agent> {
  const res = await apiFetch(`/agents/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.errors?.[0]?.message || err.message || `Error ${res.status}`);
  }

  const body = await res.json();
  return body.doc ?? body;
}

export async function createAgent(
  data: Partial<Omit<Agent, "id" | "createdAt" | "updatedAt">>,
): Promise<Agent> {
  const res = await apiFetch("/agents", {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.errors?.[0]?.message || err.message || `Error ${res.status}`);
  }

  const body = await res.json();
  return body.doc ?? body;
}

export async function createLearningRecord(
  data: Partial<LearningRecord>,
  authToken?: string,
): Promise<{ doc: LearningRecord; message: string }> {
  const res = await apiFetch(
    "/learning",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    authToken,
  );

  if (!res.ok) {
    console.error(
      "API: createLearningRecord error:",
      res.status,
      res.statusText,
    );
    const errorData = await res.json().catch(() => ({}));
    console.error(
      "API: createLearningRecord error details:",
      JSON.stringify(errorData, null, 2),
    );
    throw new Error(`Failed to create learning record: ${res.statusText}`);
  }
  return res.json();
}

export async function getLearningRecords(
  agentId: string,
  authToken?: string,
): Promise<LearningRecord[]> {
  const res = await apiFetch(
    `/learning?where[agent][equals]=${agentId}&sort=-createdAt&limit=10&depth=2`,
    { cache: "no-store" },
    authToken,
  );

  if (!res.ok) {
    console.error(
      `API: getLearningRecords(${agentId}) error:`,
      res.status,
      res.statusText,
    );
    return [];
  }

  const data = await res.json();
  return data.docs || [];
}

// --- Procesamientos API Functions ---

export interface Procesamiento {
  id: string;
  nombre: string;
  status: "en_cola" | "procesando" | "completado" | "error" | "cancelado";
  documento_relacionado: {
    relationTo: "boletines" | "actos-administrativos";
    value: string | number | Boletin | ActoAdministrativo;
  };
  agente?: string | number | Agent;
  resultado?: any;
  info_progreso?: any;
  createdAt: string;
  updatedAt: string;
}

export async function updateProcesamiento(
  id: string,
  data: Partial<Procesamiento>,
): Promise<{ doc: Procesamiento; message: string }> {
  const res = await apiFetch(`/procesamientos/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    console.error(
      "API: updateProcesamiento error:",
      res.status,
      res.statusText,
    );
    throw new Error(`Failed to update procesamiento: ${res.statusText}`);
  }
  return res.json();
}

export async function createProcesamiento(
  data: Partial<Procesamiento>,
  authToken?: string,
): Promise<{ doc: Procesamiento; message: string }> {
  const res = await apiFetch(
    "/procesamientos",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    authToken,
  );

  if (!res.ok) {
    console.error(
      "API: createProcesamiento error:",
      res.status,
      res.statusText,
    );
    const errorData = await res.json().catch(() => ({}));
    console.error(
      "API: createProcesamiento error details:",
      JSON.stringify(errorData, null, 2),
    );
    throw new Error(`Failed to create processing: ${res.statusText}`);
  }
  return res.json();
}

export async function getProcesamiento(
  id: string,
  authToken?: string,
): Promise<Procesamiento> {
  const res = await apiFetch(
    `/procesamientos/${id}`,
    { cache: "no-store" },
    authToken,
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch processing ${id}`);
  }

  return res.json();
}

// ── Site stat counts ──────────────────────────────────────────────────────────

export interface SiteStatCounts {
  informes: number;
  estadisticas: number;
  categorias: number;
  boletines: number;
}

export async function getSiteStatCounts(): Promise<SiteStatCounts> {
  const safeFetch = (url: string) =>
    fetch(url, { next: { revalidate: 3600 } })
      .then((r) => (r.ok ? r.json() : { totalDocs: 0 }))
      .catch(() => ({ totalDocs: 0 }));

  const [informes, estadisticas, categorias, boletines] = await Promise.all([
    safeFetch(`${API_URL}/publicaciones?limit=1`),
    safeFetch(`${API_URL}/tablas?limit=1`),
    safeFetch(`${API_URL}/taxonomias?where[tipo][equals]=categoria&limit=1`),
    safeFetch(`${API_URL}/boletines?limit=1`),
  ]);

  return {
    informes: informes.totalDocs ?? 0,
    estadisticas: estadisticas.totalDocs ?? 0,
    categorias: categorias.totalDocs ?? 0,
    boletines: boletines.totalDocs ?? 0,
  };
}

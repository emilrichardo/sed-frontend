export const API_URL = "http://localhost:3000/api";

/**
 * Shared fetch wrapper to handle auth tokens and 401 redirects
 */
async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
  authToken?: string,
) {
  const isClient = typeof window !== "undefined";
  const token =
    authToken || (isClient ? localStorage.getItem("payload-token") : null);

  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  } as any;

  if (
    options.body &&
    !headers["Content-Type"] &&
    !(options.body instanceof FormData)
  ) {
    headers["Content-Type"] = "application/json";
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_URL}${endpoint}`;
  let res = await fetch(url, {
    ...options,
    headers,
  });

  // Handle Auth Errors (401/403)
  if ((res.status === 401 || res.status === 403) && isClient && token) {
    console.warn(
      `Unauthorized/Forbidden (${res.status}) - potentially stale token. clearing and retrying as guest.`,
    );
    // 1. Clear bad token
    localStorage.removeItem("payload-token");
    localStorage.removeItem("payload-user");

    // 2. Retry without token
    const { Authorization, ...retryHeaders } = headers;
    const retryRes = await fetch(url, {
      ...options,
      headers: retryHeaders,
    });

    if (retryRes.ok) {
      // 3a. Retry succeeded (resource was public) -> Return success
      return retryRes;
    } else {
      // 3b. Retry failed (resource is private) -> Redirect to login
      if (!window.location.pathname.includes("/login")) {
        window.location.href = `/login?expired=true`;
      }
      return retryRes;
    }
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

export interface NewsItem {
  id: number;
  titulo: string;
  slug: string;
  publishedDate?: string;
  createdAt?: string;
  layout?: PayloadBlock[];
  contenido?: {
    root?: {
      children?: Array<{ type?: string; children?: Array<{ text?: string }> }>;
    };
  } | null;
  [key: string]: unknown;
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
  status_procesamiento?: ("unprocessed" | "basic" | "ai_enhanced") | null;
  procesamiento_asociado?: (string | Procesamiento)[] | null;
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
  nivel_opacidad?: "Transparente" | "Parcial" | "Opaco";
  parent_id?: string | ActoAdministrativo;
  lugar_fecha?: string;
  resolucion?: string;
  paginas?: string;
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

export async function getNews(
  params: {
    page?: number;
    limit?: number;
    sort?: string;
    where?: Record<string, unknown>;
  } = {},
): Promise<PayloadResponse<NewsItem>> {
  const { page = 1, limit = 10, sort = "-createdAt", where } = params;
  let url = `${API_URL}/noticias?page=${page}&limit=${limit}&sort=${sort}&draft=false`;

  if (where) {
    Object.entries(where).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url += `&where[${key}][equals]=${value}`;
      }
    });
  }

  try {
    const res = await fetch(url, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch news");
    }

    return res.json();
  } catch (error) {
    console.error("Error fetching news:", error);
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

export async function getNewsItem(slug: string): Promise<NewsItem | null> {
  try {
    // Search by slug
    const res = await fetch(
      `${API_URL}/noticias?where[slug][equals]=${slug}&depth=2&draft=false`,
      {
        next: { revalidate: 60 },
      },
    );

    if (!res.ok) {
      return null;
    }

    const data: PayloadResponse<NewsItem> = await res.json();

    if (data.docs.length === 0) {
      return null;
    }

    return data.docs[0];
  } catch (error) {
    console.error(`Error fetching news item ${slug}:`, error);
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
  let url = `${API_URL}/boletines?page=${page}&limit=${limit}&sort=${sort}&depth=2`;

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

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch bulletins");
  return res.json();
}

export async function getBulletin(
  idOrSlug: string,
  authToken?: string,
): Promise<Boletin> {
  if (!idOrSlug) throw new Error("ID or Slug is required");
  const idStr = String(idOrSlug);
  console.log(`fetching bulletin: ${idStr}`);

  // 1. Try direct ID fetch first
  try {
    const res = await apiFetch(
      `/boletines/${idStr}`,
      {
        next: { revalidate: 3600 },
      },
      authToken,
    );

    if (res.ok) {
      console.log(`bulletin found as direct ID: ${idStr}`);
      return await res.json();
    }
  } catch (e) {
    console.log(`direct ID fetch failed for ${idStr}, trying slug search...`);
  }

  // 2. Fallback: Search by slug or numero
  const isNumber = /^\d+$/.test(idStr);
  const query = isNumber
    ? `?where[numero][equals]=${idStr}&sort=-createdAt`
    : `?where[slug][equals]=${idStr}`;

  const res = await apiFetch(
    `/boletines${query}`,
    {
      next: { revalidate: 3600 },
    },
    authToken,
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch bulletin (search): ${res.status}`);
  }

  const data = await res.json();
  if (data.docs && data.docs.length > 0) {
    console.log(`bulletin found via search: ${idStr}`);
    return data.docs[0];
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
  let queryString = `?page=${page}&limit=${limit}&sort=${sort}&depth=${depth}`;

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

  if (!res.ok) throw new Error("Failed to fetch actos administrativos");
  return res.json();
}

export async function getActoAdministrativo(
  id: string,
): Promise<ActoAdministrativo> {
  const res = await apiFetch(`/actos-administrativos/${id}?depth=2`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error("Failed to fetch acto administrativo");
  return res.json();
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
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to fetch ${collection}`);
  const data = await res.json();
  return data.docs;
}
export async function createBulletin(
  data: Partial<Boletin>,
): Promise<{ doc: Boletin; message: string }> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("payload-token")
      : null;

  console.log("API: createBulletin - Token exists:", !!token);

  const res = await fetch(`${API_URL}/boletines`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
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
  status: "en_cola" | "procesando" | "completado" | "error";
  documento_relacionado: {
    relationTo: "boletines" | "noticias";
    value: string | number | Boletin | NewsItem;
  };
  agente?: string | number | Agent;
  resultado?: any;
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

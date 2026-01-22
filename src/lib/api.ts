import {} from "next/navigation";

export const API_URL = "http://localhost:3000/api";

export interface PayloadBlock {
  blockType: string;
  id: string;
  [key: string]: unknown;
}

export interface NewsItem {
  id: number;
  titulo: string;
  slug: string;
  publishedDate?: string;
  layout?: PayloadBlock[];
  contenido?: unknown;
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
  createdAt: string;
  updatedAt: string;
}

export interface EntradaInterna {
  id: string;
  id_boletin: string | Boletin;
  identificador_acto: string;
  seccion: string | Seccion;
  tipo_acto: string | TipoActo;
  jurisdiccion: string | Organismo;
  referencia: string;
  texto_completo: unknown;
  es_homologacion?: boolean;
  id_acto_referenciado?: string;
  nivel_opacidad?: "Transparente" | "Parcial" | "Opaco";
  parent_id?: string | EntradaInterna;
  lugar_fecha?: string;
  resolucion?: string;
  paginas?: number[];
}

export interface DetalleEspecifico {
  id: string;
  id_entrada: string | EntradaInterna;
  detalles: any[];
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
  let url = `${API_URL}/boletines?page=${page}&limit=${limit}&sort=${sort}`;

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

  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error("Failed to fetch bulletins");
  return res.json();
}

export async function getBulletin(
  idOrSlug: string,
  authToken?: string,
): Promise<Boletin> {
  if (!idOrSlug) throw new Error("ID or Slug is required");
  const idStr = String(idOrSlug);
  const token =
    authToken ||
    (typeof window !== "undefined"
      ? localStorage.getItem("payload-token")
      : null);

  // 1. Check if it's a numeric string (for 'numero')
  const isNumber = /^\d+$/.test(idStr);
  // 2. Check if it's a slug (contains hyphens)
  const isSlug = idStr.includes("-");

  let query = "";
  let isSearch = false;

  if (isNumber) {
    query = `?where[numero][equals]=${idStr}&sort=-createdAt`;
    isSearch = true;
  } else if (isSlug) {
    query = `?where[slug][equals]=${idStr}`;
    isSearch = true;
  } else {
    // Assume internal ID
    query = `/${idStr}`;
  }

  const res = await fetch(`${API_URL}/boletines${query}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    next: { revalidate: 3600 },
  });

  if (!res.ok) throw new Error("Failed to fetch bulletin");

  const data = await res.json();

  if (isSearch) {
    if (!data.docs || data.docs.length === 0) {
      // If authenticating, maybe no access or strictly not found
      // Try fetching as ID if number check failed but it was actually an ID
      if (isNumber) {
        // Fallback: Try fetching by ID directly
        try {
          const resFallback = await fetch(`${API_URL}/boletines/${idStr}`, {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            cache: "no-store",
          });
          if (resFallback.ok) {
            return await resFallback.json();
          }
        } catch (e) {
          console.warn("Fallback fetch by ID failed", e);
        }
      }
      throw new Error(`Bulletin not found: ${idStr}`);
    }
    return data.docs[0];
  }

  return data;
}

export async function getEntries(
  params: {
    page?: number;
    limit?: number;
    sort?: string;
    where?: Record<string, unknown>;
    depth?: number;
  } = {},
): Promise<PayloadResponse<EntradaInterna>> {
  const {
    page = 1,
    limit = 20,
    sort = "-id_boletin.fecha_publicacion",
    where,
    depth = 1,
  } = params;
  let url = `${API_URL}/entradas-internas?page=${page}&limit=${limit}&sort=${sort}&depth=${depth}`;

  if (where) {
    Object.entries(where).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        if (key === "search") {
          url += `&where[or][0][identificador_acto][contains]=${value}`;
          url += `&where[or][1][referencia][contains]=${value}`;
        } else if (key === "fecha_desde") {
          url += `&where[id_boletin.fecha_publicacion][greater_than_equal]=${value}`;
        } else if (key === "fecha_hasta") {
          url += `&where[id_boletin.fecha_publicacion][less_than_equal]=${value}`;
        } else {
          url += `&where[${key}][equals]=${value}`;
        }
      }
    });
  }

  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error("Failed to fetch entries");
  return res.json();
}

export async function getEntry(id: string): Promise<EntradaInterna> {
  const res = await fetch(`${API_URL}/entradas-internas/${id}?depth=2`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error("Failed to fetch entry");
  return res.json();
}

export async function getEntryDetails(
  entryId: string,
): Promise<DetalleEspecifico[]> {
  const res = await fetch(
    `${API_URL}/detalles-especificos?where[id_entrada][equals]=${entryId}&depth=2`,
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
  const token =
    authToken ||
    (typeof window !== "undefined"
      ? localStorage.getItem("payload-token")
      : null);

  const res = await fetch(`${API_URL}/boletines/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });

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

export async function createEntry(
  data: Partial<EntradaInterna>,
): Promise<{ doc: EntradaInterna; message: string }> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("payload-token")
      : null;

  console.log("API: createEntry - Token exists:", !!token);

  const res = await fetch(`${API_URL}/entradas-internas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
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
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("payload-token")
      : null;

  console.log(
    `API: createTaxonomy (${collection}) - Token exists:`,
    !!token,
    token ? `(starts with: ${token.substring(0, 10)}...)` : "",
  );

  const res = await fetch(`${API_URL}/${collection}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
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
  const token =
    authToken ||
    (typeof window !== "undefined"
      ? localStorage.getItem("payload-token")
      : null);

  const res = await fetch(`${API_URL}/agents`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("API: getAgents error:", res.status, res.statusText);
    // Return empty array instead of throwing to avoid breaking the UI
    return [];
  }

  const data = await res.json();
  console.log("API: getAgents response docs:", data.docs?.length);
  return data.docs || [];
}

export async function createLearningRecord(
  data: Partial<LearningRecord>, // or Partial<LearningRecord>
  authToken?: string,
): Promise<{ doc: LearningRecord; message: string }> {
  const token =
    authToken ||
    (typeof window !== "undefined"
      ? localStorage.getItem("payload-token")
      : null);

  const res = await fetch(`${API_URL}/learning`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });

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

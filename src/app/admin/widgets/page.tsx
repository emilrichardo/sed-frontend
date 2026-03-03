"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  LayoutGrid,
  Database,
  Search,
  RefreshCw,
  ChevronRight,
  Eye,
  X,
} from "lucide-react";
import { API_URL } from "@/lib/api";
import WidgetList from "@/components/widgets/WidgetList";
import type { ReportItem } from "@/lib/api";

// ── Widget doc shape (from /api/widgets) ────────────────────────────────────
interface WidgetCategory {
  id: number;
  nombre: string;
  tipo: string;
  slug: string;
  descripcion: string | null;
  parent: WidgetCategory | null;
  contenido: unknown;
  updatedAt: string;
  createdAt: string;
}

interface WidgetDoc {
  id: number;
  titulo: string;
  descripcion: string | null;
  slug: string;
  tipo_fuente: "coleccion" | "tabla" | "api" | string;
  tabla_relacionada: unknown;
  tipo_visualizacion: string;
  config_viz: Record<string, unknown>;
  nombre_widget: string | null;
  coleccion: string | null;
  modo_seleccion: string;
  cantidad: number;
  entradas_publicaciones: ReportItem[];
  entradas_tablas: unknown[];
  entradas_ahorros: unknown[];
  entradas_boletines: unknown[];
  entradas_actos: unknown[];
  categorias: WidgetCategory[];
  tags: unknown[];
  mostrar_en_home: boolean;
  orden: number | null;
  imagen_destacada: { url: string; alt?: string } | null;
  cta: {
    texto: string | null;
    tipo_enlace: string;
    url_interna: string | null;
    url_externa: string | null;
  };
  updatedAt: string;
  createdAt: string;
}

interface WidgetApiResponse {
  docs: WidgetDoc[];
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
  nextPage: number | null;
  page: number;
  pagingCounter: number;
  prevPage: number | null;
  totalDocs: number;
  totalPages: number;
}

// ── Dynamic widget loader ───────────────────────────────────────────────────
// Tries to load components/widgets/{nombre_widget}, falls back to WidgetJson

function DynamicWidget({ widget }: { widget: WidgetDoc }) {
  const [WidgetComponent, setWidgetComponent] = useState<React.ComponentType<{
    data: Record<string, unknown>;
  }> | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!widget.nombre_widget) {
      setLoadError(true);
      return;
    }

    const loadWidget = async () => {
      try {
        const mod = await import(
          `@/components/widgets/${widget.nombre_widget}`
        );
        setWidgetComponent(() => mod.default);
      } catch {
        console.warn(
          `[DynamicWidget] Could not load custom widget "${widget.nombre_widget}", falling back to WidgetJson`,
        );
        setLoadError(true);
      }
    };

    loadWidget();
  }, [widget.nombre_widget]);

  // Fallback: load WidgetJson
  useEffect(() => {
    if (loadError && !WidgetComponent) {
      import("@/components/widgets/WidgetJson").then((mod) => {
        setWidgetComponent(() => mod.default);
      });
    }
  }, [loadError, WidgetComponent]);

  if (!WidgetComponent) {
    return (
      <div className="flex items-center justify-center p-8 border rounded-xl bg-muted/20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <WidgetComponent data={widget as unknown as Record<string, unknown>} />
  );
}

// ── Single widget card ──────────────────────────────────────────────────────

function WidgetPanel({ widget }: { widget: WidgetDoc }) {
  const [expanded, setExpanded] = useState(false);

  const categoryLabels = widget.categorias?.map((c) => c.nombre) || [];
  const hasCustomWidget = !!widget.nombre_widget;
  const isCollection = widget.tipo_fuente === "coleccion";

  return (
    <div className="group flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
      {/* Header */}
      <div className="p-5 pb-3 space-y-2">
        {/* Tags row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              isCollection
                ? "bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800"
                : "bg-violet-50 text-violet-600 border border-violet-200 dark:bg-violet-950 dark:text-violet-400 dark:border-violet-800"
            }`}
          >
            {widget.tipo_fuente}
          </span>
          {widget.coleccion && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border">
              {widget.coleccion}
            </span>
          )}
          {hasCustomWidget && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800">
              Custom: {widget.nombre_widget}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold leading-tight group-hover:text-primary transition-colors">
          {widget.titulo}
        </h3>

        {/* Description */}
        {widget.descripcion && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {widget.descripcion}
          </p>
        )}

        {/* Categories */}
        {categoryLabels.length > 0 && (
          <div className="flex gap-1.5 flex-wrap pt-1">
            {categoryLabels.map((label) => (
              <span
                key={label}
                className="px-2 py-0.5 bg-muted rounded-md text-[10px] font-medium text-muted-foreground"
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Expand/Preview toggle */}
      <div className="px-5 pb-3">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          <Eye className="h-3.5 w-3.5" />
          {expanded ? "Ocultar" : "Vista previa"}
          <ChevronRight
            className={`h-3.5 w-3.5 transition-transform duration-200 ${
              expanded ? "rotate-90" : ""
            }`}
          />
        </button>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-border pt-4 animate-in slide-in-from-top-2 duration-200">
          {hasCustomWidget ? (
            <DynamicWidget widget={widget} />
          ) : isCollection ? (
            <WidgetList data={widget as unknown as Record<string, unknown>} />
          ) : (
            <DynamicWidget widget={widget} />
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          Actualizado:{" "}
          {new Date(widget.updatedAt).toLocaleDateString("es-AR", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
        <div className="flex items-center gap-2">
          {widget.mostrar_en_home && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              En Home
            </span>
          )}
          <span className="text-[10px] font-mono text-muted-foreground">
            #{widget.id}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function AdminWidgetsPage() {
  const { user } = useAuth();
  const [widgets, setWidgets] = useState<WidgetDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);

  const fetchWidgets = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("payload-token");
      const res = await fetch(
        `${API_URL}/widgets?limit=100&sort=-createdAt&depth=2`,
        {
          cache: "no-store",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );

      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);

      const data: WidgetApiResponse = await res.json();
      setWidgets(data.docs);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchWidgets();
  }, [user]);

  // Filtered widgets
  const filteredWidgets = useMemo(() => {
    let result = widgets;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (w) =>
          w.titulo.toLowerCase().includes(q) ||
          w.slug.toLowerCase().includes(q) ||
          (w.nombre_widget && w.nombre_widget.toLowerCase().includes(q)) ||
          (w.coleccion && w.coleccion.toLowerCase().includes(q)),
      );
    }

    if (filterType) {
      result = result.filter((w) => w.tipo_fuente === filterType);
    }

    return result;
  }, [widgets, search, filterType]);

  // Unique typed for filter buttons
  const uniqueTypes = useMemo(() => {
    const types = new Set(widgets.map((w) => w.tipo_fuente));
    return Array.from(types);
  }, [widgets]);

  // Not authenticated
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <h2 className="text-2xl font-bold">Acceso Denegado</h2>
        <p className="text-muted-foreground">
          Debes iniciar sesión para ver esta página.
        </p>
        <Link href="/" className="text-primary hover:underline">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 font-sans">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <LayoutGrid className="h-8 w-8 text-primary" />
            Widgets
          </h1>
          <p className="text-muted-foreground">
            Gestiona y previsualiza todos los widgets del sistema.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchWidgets}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg font-medium hover:bg-accent transition-colors text-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Recargar
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg font-medium hover:bg-accent transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Inicio
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar widgets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Type filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterType(null)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              filterType === null
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-background text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            Todos
            <span className="ml-1.5 tabular-nums opacity-60">
              {widgets.length}
            </span>
          </button>
          {uniqueTypes.map((type) => {
            const count = widgets.filter((w) => w.tipo_fuente === type).length;
            return (
              <button
                key={type}
                onClick={() => setFilterType(filterType === type ? null : type)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  filterType === type
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                {type}
                <span className="ml-1.5 tabular-nums opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results bar */}
      <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground border-b border-border pb-3">
        <span>
          <span className="font-medium text-foreground">
            {filteredWidgets.length}
          </span>{" "}
          widget{filteredWidgets.length !== 1 ? "s" : ""}
          {(search || filterType) && " encontrados"}
        </span>
        {(search || filterType) && (
          <button
            onClick={() => {
              setSearch("");
              setFilterType(null);
            }}
            className="flex items-center gap-1 text-primary hover:underline"
          >
            <X className="h-3 w-3" />
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Cargando widgets...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <div>
            <h3 className="text-lg font-bold mb-1">Error al cargar</h3>
            <p className="text-muted-foreground text-sm">{error}</p>
          </div>
          <button
            onClick={fetchWidgets}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-all"
          >
            Reintentar
          </button>
        </div>
      ) : filteredWidgets.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-xl">
          <Database className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">
            {search || filterType
              ? "No hay widgets que coincidan con los filtros."
              : "No hay widgets registrados."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredWidgets.map((widget) => (
            <WidgetPanel key={widget.id} widget={widget} />
          ))}
        </div>
      )}
    </div>
  );
}

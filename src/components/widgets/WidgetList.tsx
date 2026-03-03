"use client";

import React, { useEffect, useState } from "react";
import { Loader2, List, AlertCircle, ArrowRight, ChevronRight } from "lucide-react";
import { API_URL } from "@/lib/api";
import Link from "next/link";
import type { ReportItem } from "@/lib/api";

interface WidgetCategory {
  id: number;
  nombre: string;
  slug: string;
}

interface WidgetData {
  id: number;
  titulo: string;
  descripcion: string | null;
  slug: string;
  tipo_fuente: string;
  coleccion: string | null;
  modo_seleccion: string;
  cantidad: number;
  entradas: ReportItem[];
  entradas_publicaciones: ReportItem[];
  entradas_boletines: unknown[];
  entradas_ahorros: unknown[];
  entradas_actos: unknown[];
  categorias: WidgetCategory[];
  cta?: {
    texto: string | null;
    tipo_enlace: string;
    url_interna: string | null;
    url_externa: string | null;
  };
  _variant?: string;
  [key: string]: unknown;
}

function entryHref(entry: ReportItem, coleccion: string | null): string {
  const slug = (entry as Record<string, unknown>).slug as string | undefined;
  if (!slug) return "#";
  const base = coleccion === "publicaciones" ? "/publicaciones" : `/${coleccion ?? "publicaciones"}`;
  return `${base}/${slug}`;
}

// ── XS — lista ultra compacta ────────────────────────────────────────────────

function VariantXS({ entries, coleccion }: { entries: ReportItem[]; coleccion: string | null }) {
  return (
    <ul className="divide-y divide-border">
      {entries.map((entry) => (
        <li key={entry.id}>
          <Link
            href={entryHref(entry, coleccion)}
            className="flex items-center justify-between gap-2 px-4 py-2 hover:bg-muted/40 transition-colors group"
          >
            <span className="text-xs font-medium leading-tight truncate group-hover:text-primary transition-colors">
              {entry.titulo}
            </span>
            <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

// ── MD — lista con separadores ───────────────────────────────────────────────

function VariantMD({ entries, coleccion }: { entries: ReportItem[]; coleccion: string | null }) {
  return (
    <ul className="divide-y divide-border">
      {entries.map((entry) => (
        <li key={entry.id}>
          <Link
            href={entryHref(entry, coleccion)}
            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors group"
          >
            <span className="flex-1 text-sm font-medium leading-snug group-hover:text-primary transition-colors">
              {entry.titulo}
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

// ── LG — lista con fecha y flecha prominente ─────────────────────────────────

function VariantLG({ entries, coleccion }: { entries: ReportItem[]; coleccion: string | null }) {
  return (
    <ul className="divide-y divide-border">
      {entries.map((entry) => {
        const date = entry.publishedDate ?? entry.createdAt;
        const formattedDate = date
          ? new Date(date).toLocaleDateString("es-AR", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : null;

        return (
          <li key={entry.id}>
            <Link
              href={entryHref(entry, coleccion)}
              className="flex items-center gap-4 px-5 py-4 hover:bg-muted/40 transition-colors group"
            >
              <div className="flex-1 min-w-0 space-y-0.5">
                <p className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors">
                  {entry.titulo}
                </p>
                {formattedDate && (
                  <p className="text-[11px] text-muted-foreground">{formattedDate}</p>
                )}
              </div>
              <div className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

// ── Export — variant via data._variant ("xs" | "md" | "lg", default "md") ────

export default function WidgetList({ data }: { data: Record<string, unknown> }) {
  const widget = data as unknown as WidgetData;
  const variant = ((data._variant as string) ?? "md").toLowerCase();

  const [entries, setEntries] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      // 1. inline via "entradas"
      if (Array.isArray(widget.entradas) && widget.entradas.length > 0) {
        setEntries(widget.entradas);
        setLoading(false);
        return;
      }

      // 2. inline via "entradas_*"
      const inline = [
        ...(widget.entradas_publicaciones || []),
        ...(widget.entradas_boletines || []),
        ...(widget.entradas_ahorros || []),
        ...(widget.entradas_actos || []),
      ].filter(Boolean) as ReportItem[];

      if (inline.length > 0) {
        setEntries(inline);
        setLoading(false);
        return;
      }

      // 3. fetch from collection
      if (!widget.coleccion) {
        setError("No se especificó una colección.");
        setLoading(false);
        return;
      }

      try {
        const catFilter = (widget.categorias ?? [])
          .map((c, i) => `&where[categorias][in][${i}]=${c.id}`)
          .join("");
        const limit = widget.cantidad || 12;
        const sort =
          widget.modo_seleccion === "populares" ? "-views" : "-createdAt";

        const res = await fetch(
          `${API_URL}/${widget.coleccion}?limit=${limit}&sort=${sort}&depth=1${catFilter}`,
          { cache: "no-store" },
        );
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const json = await res.json();
        setEntries(json.docs || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widget.coleccion, widget.cantidad, widget.modo_seleccion]);

  const ctaHref = widget.cta?.url_externa ?? widget.cta?.url_interna ?? null;
  const ctaText = widget.cta?.texto ?? "Ver más";

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center gap-2.5">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 shrink-0">
          <List className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold leading-tight truncate">{widget.titulo}</p>
          {widget.coleccion && (
            <p className="text-[10px] font-mono text-muted-foreground">
              /{widget.coleccion}
            </p>
          )}
        </div>
        {!loading && !error && entries.length > 0 && (
          <span className="text-[10px] font-mono text-muted-foreground tabular-nums shrink-0">
            {entries.length}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8 gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Cargando...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-8 gap-2 text-center">
            <AlertCircle className="h-7 w-7 text-destructive/60" />
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <p className="text-sm text-muted-foreground italic">
              No hay entradas disponibles.
            </p>
          </div>
        ) : variant === "xs" ? (
          <VariantXS entries={entries} coleccion={widget.coleccion} />
        ) : variant === "lg" ? (
          <VariantLG entries={entries} coleccion={widget.coleccion} />
        ) : (
          <VariantMD entries={entries} coleccion={widget.coleccion} />
        )}
      </div>

      {/* CTA */}
      {ctaHref && (
        <div className="px-4 py-2.5 border-t border-border bg-muted/10">
          <Link
            href={ctaHref}
            className="flex items-center justify-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {ctaText}
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

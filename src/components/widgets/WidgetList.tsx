"use client";

import React, { useEffect, useState } from "react";
import { Loader2, List, AlertCircle, ExternalLink } from "lucide-react";
import { API_URL } from "@/lib/api";
import { ResponsivePublicationCard } from "@/components/PublicationCard";
import Link from "next/link";
import type { ReportItem } from "@/lib/api";

// ── Types ───────────────────────────────────────────────────────────────────

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
  [key: string]: unknown;
}

interface WidgetListProps {
  data: Record<string, unknown>;
}

// ── Component ───────────────────────────────────────────────────────────────

export default function WidgetList({ data }: WidgetListProps) {
  const widget = data as unknown as WidgetData;
  const [entries, setEntries] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEntries = async () => {
      // 1. Check for inline entries first
      const inlineEntries = [
        ...(widget.entradas_publicaciones || []),
        ...(widget.entradas_boletines || []),
        ...(widget.entradas_ahorros || []),
        ...(widget.entradas_actos || []),
      ].filter(Boolean);

      if (inlineEntries.length > 0) {
        setEntries(inlineEntries as ReportItem[]);
        setLoading(false);
        return;
      }

      // 2. Fetch from the collection endpoint
      if (!widget.coleccion) {
        setError("No se especificó una colección.");
        setLoading(false);
        return;
      }

      try {
        let catFilter = "";
        if (widget.categorias?.length > 0) {
          catFilter = widget.categorias
            .map((c, i) => `&where[categorias][in][${i}]=${c.id}`)
            .join("");
        }

        const limit = widget.cantidad || 12;
        const sort =
          widget.modo_seleccion === "ultimas"
            ? "-createdAt"
            : widget.modo_seleccion === "populares"
              ? "-views"
              : "-createdAt";

        const res = await fetch(
          `${API_URL}/${widget.coleccion}?limit=${limit}&sort=${sort}&depth=1${catFilter}`,
          { cache: "no-store" },
        );

        if (!res.ok) throw new Error(`Error ${res.status}`);
        const json = await res.json();
        setEntries(json.docs || []);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error desconocido";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widget.coleccion, widget.cantidad, widget.modo_seleccion]);

  // CTA link
  const ctaHref = widget.cta?.url_externa || widget.cta?.url_interna || null;
  const ctaText = widget.cta?.texto || "Ver más";

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-muted/20">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 shrink-0">
              <List className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold leading-tight truncate">
                {widget.titulo}
              </h3>
              {widget.coleccion && (
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                  {widget.coleccion}
                </span>
              )}
            </div>
          </div>
          {!loading && !error && (
            <span className="text-[10px] font-mono text-muted-foreground tabular-nums shrink-0">
              {entries.length} items
            </span>
          )}
        </div>
        {widget.descripcion && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {widget.descripcion}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center p-10">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">
              Cargando...
            </span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-8 gap-2 text-center">
            <AlertCircle className="h-8 w-8 text-destructive/60" />
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <p className="text-sm text-muted-foreground italic">
              No hay entradas disponibles.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <ResponsivePublicationCard item={entry} showParent={false} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA Footer */}
      {ctaHref && (
        <div className="px-5 py-3 border-t border-border bg-muted/10">
          <Link
            href={ctaHref}
            className="flex items-center justify-center gap-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {ctaText}
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

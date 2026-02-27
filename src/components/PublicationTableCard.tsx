"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import { TableBlock } from "./TableBlock";
import type { TablaBlockData } from "@/utils/publicacion";

interface Props {
  titulo: string;
  slug: string;
  description?: string;
  date?: string;
  tablas: TablaBlockData[];
}

export function PublicationTableCard({
  titulo,
  slug,
  description,
  date,
  tablas,
}: Props) {
  const [idx, setIdx] = useState(0);
  const hasMultiple = tablas.length > 1;
  const current = tablas[idx];

  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden flex flex-col">
      {/* ── Table / chart area ── */}
      <div className="relative flex-1">
        {/* Slider controls */}
        {hasMultiple && (
          <div className="flex items-center justify-between px-4 py-2 bg-muted/40 border-b border-border">
            <span className="text-xs font-mono text-muted-foreground">
              {idx + 1} / {tablas.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIdx((i) => Math.max(0, i - 1))}
                disabled={idx === 0}
                className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors"
                aria-label="Tabla anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex gap-1 mx-1">
                {tablas.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIdx(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      i === idx
                        ? "bg-primary"
                        : "bg-border hover:bg-muted-foreground"
                    }`}
                    aria-label={`Tabla ${i + 1}`}
                  />
                ))}
              </div>
              <button
                onClick={() =>
                  setIdx((i) => Math.min(tablas.length - 1, i + 1))
                }
                disabled={idx === tablas.length - 1}
                className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors"
                aria-label="Tabla siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* TableBlock — exactly as it appears inside the publication */}
        <TableBlock
          fields={{
            ...current,
            blockType: "tabla",
            configuracion_visualizacion:
              current.configuracion_visualizacion ?? current.config_viz,
          }}
        />
      </div>

      {/* ── Card footer with link ── */}
      <Link
        href={`/publicaciones/${slug}`}
        className="group block px-5 py-4 border-t border-border hover:bg-muted/30 transition-colors"
      >
        {date && (
          <time className="text-xs text-muted-foreground font-mono mb-1.5 block">
            {new Date(date).toLocaleDateString("es-AR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        )}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-xl font-heading font-bold leading-tight group-hover:text-primary transition-colors">
            {titulo}
          </h3>
          <ArrowUpRight className="h-5 w-5 shrink-0 mt-0.5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        {description && (
          <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}
      </Link>
    </div>
  );
}

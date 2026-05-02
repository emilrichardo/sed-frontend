"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ReportItem } from "@/lib/api";

interface Props {
  publications: ReportItem[];
}

type TipoPublicacion = { id: number | string; nombre: string; slug?: string };

function getTipo(pub: ReportItem): TipoPublicacion | null {
  const tp = pub.tipo_publicacion;
  if (!tp || typeof tp !== "object") return null;
  return tp as TipoPublicacion;
}

function getDateMs(pub: ReportItem): number {
  const d = pub.publishedDate || pub.createdAt;
  return d ? new Date(d).getTime() : 0;
}

export function CategoryPublicationsList({ publications }: Props) {
  const tipos = useMemo(() => {
    const map = new Map<string | number, TipoPublicacion>();
    publications.forEach((pub) => {
      const tp = getTipo(pub);
      if (tp && !map.has(tp.id)) map.set(tp.id, tp);
    });
    return Array.from(map.values());
  }, [publications]);

  const [selectedTipo, setSelectedTipo] = useState<string | number | null>(
    null,
  );

  const visible = useMemo(() => {
    const filtered =
      selectedTipo === null
        ? publications
        : publications.filter((pub) => getTipo(pub)?.id === selectedTipo);
    return [...filtered].sort((a, b) => getDateMs(b) - getDateMs(a));
  }, [publications, selectedTipo]);

  return (
    <div className="space-y-4">
      {tipos.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSelectedTipo(null)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              selectedTipo === null
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-background text-muted-foreground border-border hover:text-foreground hover:border-foreground/30"
            }`}
          >
            Todos
            <span className="ml-1.5 tabular-nums opacity-60">
              {publications.length}
            </span>
          </button>
          {tipos.map((tp) => {
            const count = publications.filter(
              (pub) => getTipo(pub)?.id === tp.id,
            ).length;
            return (
              <button
                key={tp.id}
                onClick={() =>
                  setSelectedTipo(selectedTipo === tp.id ? null : tp.id)
                }
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  selectedTipo === tp.id
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background text-muted-foreground border-border hover:text-foreground hover:border-foreground/30"
                }`}
              >
                {tp.nombre}
                <span className="ml-1.5 tabular-nums opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {visible.length === 0 ? (
        <div className="border border-border rounded-lg p-8 text-center text-muted-foreground">
          <p className="text-sm">No hay publicaciones en esta categoría.</p>
        </div>
      ) : (
        <div className="border-t border-border">
          {visible.map((pub) => {
            const tipo = getTipo(pub);
            const date = pub.publishedDate || pub.createdAt;
            return (
              <Link
                key={pub.id}
                href={`/publicaciones/${pub.slug}`}
                className="flex items-center justify-between gap-4 py-4 border-b border-border hover:bg-muted/50 transition-colors group -mx-4 px-4 md:-mx-8 md:px-8"
              >
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-base md:text-lg font-heading font-semibold tracking-tight group-hover:text-primary transition-colors line-clamp-2">
                    {pub.titulo}
                  </span>
                  {(tipo?.nombre || date) && (
                    <span className="mt-1 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                      {tipo?.nombre}
                      {tipo?.nombre && date ? " · " : ""}
                      {date &&
                        new Date(date).toLocaleDateString("es-AR", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                    </span>
                  )}
                </div>
                <ArrowUpRight className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

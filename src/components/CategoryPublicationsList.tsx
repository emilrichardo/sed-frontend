"use client";

import { useState, useMemo } from "react";
import type { ReportItem } from "@/lib/api";
import { ResponsivePublicationCard } from "@/components/PublicationCard";

interface Props {
  publications: ReportItem[];
}

type TipoPublicacion = { id: number | string; nombre: string; slug?: string };

function getTipo(pub: ReportItem): TipoPublicacion | null {
  const tp = pub.tipo_publicacion;
  if (!tp || typeof tp !== "object") return null;
  return tp as TipoPublicacion;
}

export function CategoryPublicationsList({ publications }: Props) {
  // Collect unique tipos present in the data
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

  const visible = useMemo(
    () =>
      selectedTipo === null
        ? publications
        : publications.filter((pub) => getTipo(pub)?.id === selectedTipo),
    [publications, selectedTipo],
  );

  return (
    <div className="space-y-5">
      {/* Filtro por tipo */}
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

      {/* Lista */}
      {visible.length === 0 ? (
        <div className="border border-border rounded-lg p-8 text-center text-muted-foreground">
          <p className="text-sm">No hay publicaciones en esta categoría.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((pub) => (
            <ResponsivePublicationCard
              key={pub.id}
              item={pub}
              showParent={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}

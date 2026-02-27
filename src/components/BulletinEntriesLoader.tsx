"use client";

import React, { useState, useEffect } from "react";
import {
  getActosAdministrativos,
  ActoAdministrativo,
  updateBulletin,
  Boletin,
} from "@/lib/api";
import BulletinEntriesBySection from "./BulletinEntriesBySection";
import { Loader2, AlertCircle, FileText, Newspaper } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BulletinEntriesLoaderProps {
  bulletin: Boletin;
}

export default function BulletinEntriesLoader({
  bulletin,
}: BulletinEntriesLoaderProps) {
  const [entries, setEntries] = useState<ActoAdministrativo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEntries() {
      setLoading(true);
      setError(null);
      try {
        const data = await getActosAdministrativos({
          where: { boletin: bulletin.id },
          limit: 100,
          sort: "-createdAt",
        });

        // Sort entries locally: Destacados first
        const sortedDocs = data.docs.sort((a, b) => {
          if (a.destacado === b.destacado) {
            // Keep original order if both are same destacados status
            return 0;
          }
          return a.destacado ? -1 : 1;
        });

        setEntries(sortedDocs);

        // SELF-HEALING: If the actual number of acts differs from the bulletin metadata, update it.
        // This fixes cases where cant_actos is 0 but acts exist.
        if (
          sortedDocs.length > 0 &&
          (bulletin.cant_actos === 0 ||
            bulletin.cant_actos !== sortedDocs.length)
        ) {
          console.log(
            `Self-healing: Updating cant_actos for bulletin ${bulletin.numero} from ${bulletin.cant_actos} to ${sortedDocs.length}`,
          );
          updateBulletin(String(bulletin.id), {
            cant_actos: sortedDocs.length,
          }).catch((err) =>
            console.error("Failed to update bulletin cant_actos:", err),
          );
        }
      } catch (err: unknown) {
        console.error("Error loading entries for bulletin:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Error al cargar los actos administrativos";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    if (bulletin.id) {
      loadEntries();
    }
  }, [bulletin]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-2" />
        <span>Cargando actos administrativos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 border rounded-lg border-destructive/50 bg-destructive/10 text-destructive">
        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
        <p className="font-bold tracking-tight">Error al cargar actos</p>
        <p className="text-sm opacity-80 font-mono">{error}</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed rounded-lg bg-muted/30">
        <p className="text-muted-foreground font-medium uppercase text-sm">
          No hay actos registrados para este boletín.
        </p>
      </div>
    );
  }

  // Filter for Journalistic Version
  // Show acts that have journalistic content OR are destacado
  const journalistActs = entries.filter(
    (act) => act.destacado || act.titulo_periodistico || act.resumen,
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* Left Column: Journalistic Version */}
      <div className="w-full lg:flex-1 space-y-8">
        <div className="flex items-center gap-2 pb-4">
          <Newspaper className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-2xl font-heading font-bold tracking-tight">
            Versión Periodística
          </h2>
        </div>

        {journalistActs.length === 0 ? (
          <div className="text-center py-12 px-4 bg-muted/20 border-2 border-dashed border-muted-foreground/30">
            <h3 className="text-lg font-bold uppercase tracking-normal text-muted-foreground">
              No hay análisis periodísticos disponibles.
            </h3>
            <p className="text-sm text-muted-foreground/70 mt-2 font-mono">
              Revisa la lista oficial para ver todos los actos.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {journalistActs.map((act) => {
              let slug = "";
              if (typeof act.boletin === "string") {
                slug = act.boletin;
              } else if (act.boletin && typeof act.boletin === "object") {
                slug = act.boletin.slug || act.boletin.id;
              }

              return (
                <Link
                  href={`/boletines/${slug}/${act.identificador_de_acto}`}
                  key={act.id}
                  className="group block"
                >
                  <article
                    className={cn(
                      "p-6 md:p-8 border rounded-lg bg-card text-card-foreground shadow-sm transition-all hover:shadow-md",
                      act.destacado && "ring-1 ring-primary/20 bg-primary/5",
                    )}
                  >
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {act.destacado && (
                          <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded-full flex items-center gap-1 text-[10px]">
                            DESTACADO
                          </span>
                        )}
                        <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full text-[10px]">
                          {act.seccion}
                        </span>
                      </div>

                      <h2 className="text-2xl md:text-3xl font-heading font-bold leading-tight group-hover:text-primary transition-colors">
                        {act.titulo_periodistico || act.identificador_de_acto}
                      </h2>

                      {act.resumen ? (
                        <p className="text-lg text-muted-foreground line-clamp-3 leading-relaxed font-sans">
                          {act.resumen}
                        </p>
                      ) : (
                        <p className="text-base text-muted-foreground italic truncate">
                          {act.titulo}
                        </p>
                      )}

                      <div className="text-sm font-medium text-primary flex items-center gap-1 pt-2">
                        Leer análisis completo
                        <span className="group-hover:translate-x-1 transition-transform">
                          →
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Column: Official List (40% on Desktop) */}
      <aside className="w-full lg:w-[40%] space-y-8 lg:sticky lg:top-24 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto custom-scrollbar">
        <div className="flex items-center gap-2 pb-4 sticky top-0 bg-background/95 backdrop-blur z-10 pt-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-heading font-bold tracking-tight">Lista Oficial</h2>
        </div>

        <div className="bg-muted/10 p-1 rounded-lg">
          <BulletinEntriesBySection entries={entries} />
        </div>
      </aside>
    </div>
  );
}

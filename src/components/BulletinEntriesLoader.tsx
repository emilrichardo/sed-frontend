"use client";

import React, { useState, useEffect } from "react";
import { getActosAdministrativos, ActoAdministrativo } from "@/lib/api";
import BulletinEntriesBySection from "./BulletinEntriesBySection";
import { Loader2, AlertCircle, FileText, Newspaper } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BulletinEntriesLoaderProps {
  bulletinId: string | number;
}

export default function BulletinEntriesLoader({
  bulletinId,
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
          where: { boletin: bulletinId },
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

    if (bulletinId) {
      loadEntries();
    }
  }, [bulletinId]);

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
      <div className="text-center py-12 border rounded-lg border-red-200 bg-red-50 text-red-600">
        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
        <p className="font-medium">Error al cargar actos</p>
        <p className="text-sm opacity-80">{error}</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg border-dashed">
        <p className="text-muted-foreground">
          No hay actos registrados para este boletín.
        </p>
      </div>
    );
  }

  // Filter for "Journalistic Version" tab
  // Show acts that have journalistic content OR are destacado
  const journalistActs = entries.filter(
    (act) => act.destacado || act.titulo_periodistico || act.resumen,
  );

  return (
    <div className="space-y-6">
      <Tabs defaultValue="periodistica" className="w-full">
        <div className="flex justify-center mb-8">
          <TabsList className="grid w-[400px] grid-cols-2">
            <TabsTrigger
              value="periodistica"
              className="flex items-center gap-2"
            >
              <Newspaper className="h-4 w-4" />
              Versión Periodística
            </TabsTrigger>
            <TabsTrigger value="oficial" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Lista Oficial
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="periodistica"
          className="space-y-8 animate-in fade-in-50 duration-500"
        >
          {journalistActs.length === 0 ? (
            <div className="text-center py-16 px-4 bg-muted/20 rounded-lg border border-dashed">
              <h3 className="text-lg font-medium text-muted-foreground">
                No hay análisis periodísticos disponibles aun.
              </h3>
              <p className="text-sm text-muted-foreground/70 mt-2">
                Visita la pestaña &quot;Lista Oficial&quot; para ver todos los
                actos.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 max-w-4xl mx-auto">
              {journalistActs.map((act) => (
                <Link
                  href={
                    typeof act.boletin === "object"
                      ? `/boletines/${(act.boletin as any).slug || act.boletin.id}/${act.identificador_de_acto}`
                      : "#"
                  }
                  key={act.id}
                  className="group block"
                >
                  <article
                    className={cn(
                      "p-6 md:p-8 rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md",
                      act.destacado &&
                        "border-l-4 border-l-black ring-1 ring-black/5",
                    )}
                  >
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {act.destacado && (
                          <span className="bg-black text-white px-2 py-0.5 rounded-sm flex items-center gap-1">
                            DESTACADO
                          </span>
                        )}
                        <span className="bg-muted px-2 py-0.5 rounded-sm">
                          {act.seccion}
                        </span>
                      </div>

                      <h2 className="text-2xl md:text-3xl font-bold leading-tight group-hover:text-primary transition-colors font-serif">
                        {act.titulo_periodistico || act.identificador_de_acto}
                      </h2>

                      {act.resumen ? (
                        <p className="text-lg text-muted-foreground line-clamp-3 leading-relaxed">
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
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent
          value="oficial"
          className="animate-in fade-in-50 duration-500"
        >
          <BulletinEntriesBySection entries={entries} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

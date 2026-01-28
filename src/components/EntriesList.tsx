"use client";

import React, { useState, useEffect } from "react";
import {
  ActoAdministrativo,
  getActosAdministrativos,
  PayloadResponse,
} from "@/lib/api";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import EntryExpandedContent from "./EntryExpandedContent";

interface EntriesListProps {
  filters?: any;
}

export default function EntriesList({ filters }: EntriesListProps) {
  const [entries, setEntries] =
    useState<PayloadResponse<ActoAdministrativo> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  useEffect(() => {
    async function loadEntries() {
      setLoading(true);
      try {
        const data = await getActosAdministrativos({
          page,
          limit: 20,
          where: filters,
          depth: 1,
        });
        setEntries(data);
      } catch (error) {
        console.error("Error loading entries:", error);
      } finally {
        setLoading(false);
      }
    }
    loadEntries();
  }, [page, filters]);

  useEffect(() => {
    setExpandedEntryId(null);
  }, [filters, page]);

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {entries?.docs.map((entry) => (
              <div
                key={entry.id}
                className={`p-4 border rounded-lg transition-all ${
                  expandedEntryId === entry.id
                    ? "border-primary ring-1 ring-primary/20 bg-card shadow-md"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div
                    className="space-y-2 flex-1 cursor-pointer"
                    onClick={() =>
                      setExpandedEntryId(
                        expandedEntryId === entry.id ? null : entry.id,
                      )
                    }
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary">
                        {entry.seccion || "Sección"}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs font-medium text-muted-foreground">
                        {entry.tipo_de_acto &&
                        typeof entry.tipo_de_acto === "object"
                          ? entry.tipo_de_acto.nombre
                          : "Acto"}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        Boletín Nº{" "}
                        {entry.boletin && typeof entry.boletin === "object"
                          ? entry.boletin.numero
                          : "N/A"}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                      {entry.identificador_de_acto}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {entry.titulo}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                      {entry.jurisdiccion && (
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-foreground/70">
                            Jurisdicción:
                          </span>
                          <span>
                            {typeof entry.jurisdiccion === "object"
                              ? entry.jurisdiccion.nombre
                              : entry.jurisdiccion}
                          </span>
                        </div>
                      )}
                      {entry.lugar_fecha && (
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-foreground/70">
                            Fecha:
                          </span>
                          <span className="italic">{entry.lugar_fecha}</span>
                        </div>
                      )}
                      {entry.paginas && (
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-foreground/70">
                            Páginas:
                          </span>
                          <span>{entry.paginas}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setExpandedEntryId(
                        expandedEntryId === entry.id ? null : entry.id,
                      )
                    }
                    className="flex items-center gap-1 text-sm font-medium text-primary hover:underline self-start"
                  >
                    {expandedEntryId === entry.id ? (
                      <>
                        Contraer <ChevronUp className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Expandir <ChevronDown className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>

                {expandedEntryId === entry.id && (
                  <EntryExpandedContent entry={entry} />
                )}
              </div>
            ))}
            {entries?.docs.length === 0 && (
              <div className="text-center py-12 border rounded-lg border-dashed">
                <p className="text-muted-foreground">
                  No se encontraron actos administrativos con los filtros
                  seleccionados.
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">
              Mostrando {entries?.docs.length} de {entries?.totalDocs} actos
            </p>
            <div className="flex gap-2">
              <button
                disabled={!entries?.hasPrevPage}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 border rounded-md disabled:opacity-50 hover:bg-muted transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center px-4 text-sm font-medium">
                Página {entries?.page} de {entries?.totalPages}
              </div>
              <button
                disabled={!entries?.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 border rounded-md disabled:opacity-50 hover:bg-muted transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

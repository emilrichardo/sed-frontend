"use client";

import React, { useState, useEffect } from "react";
import {
  ActoAdministrativo,
  getActosAdministrativos,
  PayloadResponse,
  getAgents,
  Agent,
  createProcesamiento,
  updateActoAdministrativo,
} from "@/lib/api";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List as ListIcon,
  Play,
  Check,
  Star,
} from "lucide-react";
import EntryExpandedContent from "./EntryExpandedContent";
import { useAuth } from "@/context/AuthContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ProcessingButton } from "@/components/ProcessingButton";
import Link from "next/link";

interface EntriesListProps {
  filters?: Record<string, unknown>;
}

export default function EntriesList({ filters }: EntriesListProps) {
  const [entries, setEntries] =
    useState<PayloadResponse<ActoAdministrativo> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  // New State for Table/Processing
  const [viewMode, setViewMode] = useState<"table" | "list">("table");
  const { isEditing } = useAuth();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [localStatuses, setLocalStatuses] = useState<Record<string, string>>(
    {},
  );
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isAgentsLoading, setIsAgentsLoading] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  useEffect(() => {
    async function loadEntries() {
      setLoading(true);
      try {
        const data = await getActosAdministrativos({
          page,
          limit: 20,
          where: filters,
          depth: 1,
          sort: "-createdAt",
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
    // Reset selection on page/filter change if desired, or keep it.
    // Typically better to clear on major context shift.
    setSelectedIds(new Set());
  }, [filters, page]);

  const fetchAgents = async () => {
    if (agents.length > 0) return;
    setIsAgentsLoading(true);
    try {
      const agentList = await getAgents();
      setAgents(agentList);
      if (agentList.length > 0 && !selectedAgentId) {
        setSelectedAgentId(agentList[0].id);
      }
    } catch (err) {
      console.error("Error fetching agents:", err);
    } finally {
      setIsAgentsLoading(false);
    }
  };

  const handleBulkProcessing = async () => {
    if (!selectedAgentId || selectedIds.size === 0) return;

    setBulkProcessing(true);
    const idsToProcess = Array.from(selectedIds);

    // Initial status update
    const newStatuses: Record<string, string> = { ...localStatuses };
    idsToProcess.forEach((id) => {
      newStatuses[id] = "en_cola";
    });
    setLocalStatuses(newStatuses);

    // Process in batches
    const batchSize = 5;
    for (let i = 0; i < idsToProcess.length; i += batchSize) {
      const batch = idsToProcess.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (id) => {
          try {
            setLocalStatuses((prev) => ({ ...prev, [id]: "procesando" }));

            // Note: relationTo depends on backend collection name for Acts.
            // Assuming "actos-administrativos" based on API endpoint structure.
            await createProcesamiento({
              nombre: `Procesamiento Acto ${id}`,
              documento_relacionado: {
                relationTo: "actos-administrativos",
                value: id,
              },
              agente: selectedAgentId,
              status: "en_cola",
            });
          } catch (error) {
            console.error(`Error initiating processing for ${id}:`, error);
            setLocalStatuses((prev) => ({ ...prev, [id]: "error" }));
          }
        }),
      );
    }

    setBulkProcessing(false);
    setOpenCombobox(false);
  };

  const toggleSelectAll = () => {
    if (entries?.docs && selectedIds.size === entries.docs.length) {
      setSelectedIds(new Set());
    } else if (entries?.docs) {
      setSelectedIds(new Set(entries.docs.map((b) => b.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end items-center gap-4">
        <div className="flex border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <button
            onClick={() => setViewMode("table")}
            className={`p-2 transition-colors ${
              viewMode === "table"
                ? "bg-black text-white"
                : "bg-white text-black hover:bg-neutral-100"
            }`}
            title="Vista Tabla"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 transition-colors ${
              viewMode === "list"
                ? "bg-black text-white"
                : "bg-white text-black hover:bg-neutral-100"
            }`}
            title="Vista Lista"
          >
            <ListIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="bg-muted/30 p-4 flex items-center justify-between border-2 border-black">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={
                  (entries?.docs?.length ?? 0) > 0 &&
                  selectedIds.size === entries?.docs?.length
                }
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm font-medium">
                {selectedIds.size} seleccionados
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {selectedIds.size > 0 && (
              <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    className="flex items-center gap-2 bg-primary text-primary-foreground"
                    onClick={() => {
                      setOpenCombobox(true);
                      fetchAgents();
                    }}
                  >
                    <Play className="h-4 w-4 fill-current" />
                    Procesar {selectedIds.size} en lote
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="end">
                  <div className="p-4 space-y-4">
                    <h4 className="font-medium leading-none">
                      Seleccionar Agente
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Elige el agente para procesar los actos seleccionados.
                    </p>

                    {isAgentsLoading ? (
                      <div className="py-2 text-center text-sm text-muted-foreground">
                        Cargando agentes...
                      </div>
                    ) : agents.length === 0 ? (
                      <div className="py-2 text-center text-sm text-muted-foreground">
                        No se encontraron agentes.
                      </div>
                    ) : (
                      <div className="grid gap-2">
                        {agents.map((agent) => (
                          <div
                            key={agent.id}
                            className={cn(
                              "flex items-center gap-2 p-2 hover:bg-black hover:text-white cursor-pointer border-2 border-transparent",
                              selectedAgentId === agent.id
                                ? "border-primary bg-primary/5"
                                : "border-transparent",
                            )}
                            onClick={() => setSelectedAgentId(agent.id)}
                          >
                            <div className="flex-1 text-sm font-medium">
                              {agent.name}
                            </div>
                            {selectedAgentId === agent.id && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <Button
                      disabled={
                        !selectedAgentId || bulkProcessing || isAgentsLoading
                      }
                      onClick={handleBulkProcessing}
                      className="w-full"
                    >
                      {bulkProcessing ? "Iniciando..." : "Confirmar e Iniciar"}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-b-2 border-black"></div>
        </div>
      ) : (
        <>
          {viewMode === "table" ? (
            <div className="border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                  <tr>
                    {isEditing && (
                      <th className="px-4 py-3 w-10">
                        <Checkbox
                          checked={
                            (entries?.docs?.length ?? 0) > 0 &&
                            selectedIds.size === entries?.docs?.length
                          }
                          onCheckedChange={toggleSelectAll}
                        />
                      </th>
                    )}
                    <th className="px-4 py-3">ID Acto</th>
                    <th className="px-4 py-3">Sección</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Boletín</th>
                    {isEditing && (
                      <>
                        <th className="px-4 py-3">Procesamiento</th>
                        <th className="px-4 py-3 text-center">
                          <Star className="h-4 w-4 mx-auto" />
                        </th>
                      </>
                    )}
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-muted-foreground">
                  {entries?.docs.map((entry) => {
                    // Status handling logic
                    const procs = Array.isArray(entry.procesamiento_asociado)
                      ? entry.procesamiento_asociado
                      : entry.procesamiento_asociado
                        ? [entry.procesamiento_asociado]
                        : [];

                    const validProcs = procs.filter(
                      (p) => typeof p !== "string",
                    ) as any[];

                    const latestProc =
                      validProcs.length > 0
                        ? validProcs.sort(
                            (a, b) =>
                              new Date(b.createdAt).getTime() -
                              new Date(a.createdAt).getTime(),
                          )[0]
                        : undefined;

                    const initialStatus = latestProc?.status;
                    const currentStatus =
                      localStatuses[entry.id] || initialStatus;

                    return (
                      <tr
                        key={entry.id}
                        className={cn(
                          "hover:bg-muted/30 transition-colors text-foreground",
                          isEditing &&
                            currentStatus === "completado" &&
                            "bg-green-50/50 dark:bg-green-950/20",
                          isEditing &&
                            currentStatus === "procesando" &&
                            "bg-blue-50/50 dark:bg-blue-950/20",
                          isEditing &&
                            currentStatus === "en_cola" &&
                            "bg-amber-50/50 dark:bg-amber-950/20",
                          isEditing &&
                            currentStatus === "error" &&
                            "bg-red-50/50 dark:bg-red-950/20",
                        )}
                      >
                        {isEditing && (
                          <td className="px-4 py-3">
                            <Checkbox
                              checked={selectedIds.has(entry.id)}
                              onCheckedChange={() => toggleSelect(entry.id)}
                            />
                          </td>
                        )}
                        <td className="px-4 py-3 font-medium text-foreground">
                          {entry.identificador_de_acto}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs bg-muted px-2 py-1 border border-black inline-block font-bold">
                            {entry.seccion || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {entry.tipo_de_acto &&
                          typeof entry.tipo_de_acto === "object"
                            ? entry.tipo_de_acto.nombre
                            : "-"}
                        </td>
                        <td className="px-4 py-3">
                          Nº{" "}
                          {entry.boletin && typeof entry.boletin === "object"
                            ? entry.boletin.numero
                            : "?"}
                        </td>
                        {isEditing && (
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-2 relative">
                              <ProcessingButton
                                relationTo="actos-administrativos"
                                relatedId={entry.id}
                                existingProcessingId={latestProc?.id}
                                onStatusChange={(status) => {
                                  setLocalStatuses((prev) => ({
                                    ...prev,
                                    [entry.id]: status,
                                  }));
                                }}
                                className="scale-90 origin-left"
                              />
                            </div>
                          </td>
                        )}
                        {isEditing && (
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={async () => {
                                try {
                                  const newStatus = !entry.destacado;
                                  // Optimistic update
                                  setEntries((prev) => {
                                    if (!prev) return null;
                                    const newDocs = prev.docs.map((d) =>
                                      d.id === entry.id
                                        ? { ...d, destacado: newStatus }
                                        : d,
                                    );
                                    return { ...prev, docs: newDocs };
                                  });

                                  // API call
                                  await updateActoAdministrativo(entry.id, {
                                    destacado: newStatus,
                                  });
                                } catch (err) {
                                  console.error(
                                    "Failed to toggle destacado",
                                    err,
                                  );
                                }
                              }}
                              className={cn(
                                "p-1 hover:bg-black hover:text-white transition-colors border border-transparent",
                                entry.destacado
                                  ? "text-yellow-500"
                                  : "text-muted-foreground/30",
                              )}
                              title={
                                entry.destacado
                                  ? "Quitar destacado"
                                  : "Destacar"
                              }
                            >
                              <Star
                                className={cn(
                                  "h-5 w-5",
                                  entry.destacado && "fill-current",
                                )}
                              />
                            </button>
                          </td>
                        )}
                        {isEditing && (
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={async () => {
                                try {
                                  const newStatus = !entry.destacado;
                                  // Optimistic update
                                  setEntries((prev) => {
                                    if (!prev) return null;
                                    const newDocs = prev.docs.map((d) =>
                                      d.id === entry.id
                                        ? { ...d, destacado: newStatus }
                                        : d,
                                    );
                                    return { ...prev, docs: newDocs };
                                  });

                                  // API call
                                  await updateActoAdministrativo(entry.id, {
                                    destacado: newStatus,
                                  });
                                } catch (err) {
                                  console.error(
                                    "Failed to toggle destacado",
                                    err,
                                  );
                                  // Revert on error could be implemented here
                                }
                              }}
                              className={cn(
                                "p-1 hover:bg-black hover:text-white transition-colors border border-transparent",
                                entry.destacado
                                  ? "text-yellow-500"
                                  : "text-muted-foreground/30",
                              )}
                              title={
                                entry.destacado
                                  ? "Quitar destacado"
                                  : "Destacar"
                              }
                            >
                              <Star
                                className={cn(
                                  "h-5 w-5",
                                  entry.destacado && "fill-current",
                                )}
                              />
                            </button>
                          </td>
                        )}
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/boletines/${typeof entry.boletin === "object" && entry.boletin ? entry.boletin.slug || entry.boletin.id : entry.boletin}/${entry.identificador_de_acto}`}
                            className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                          >
                            Ver Detalle
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid gap-4">
              {entries?.docs.map((entry) => {
                // Status handling logic for List View
                const procs = Array.isArray(entry.procesamiento_asociado)
                  ? entry.procesamiento_asociado
                  : entry.procesamiento_asociado
                    ? [entry.procesamiento_asociado]
                    : [];

                const validProcs = procs.filter(
                  (p) => typeof p !== "string",
                ) as any[];

                const latestProc =
                  validProcs.length > 0
                    ? validProcs.sort(
                        (a, b) =>
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime(),
                      )[0]
                    : undefined;

                const initialStatus = latestProc?.status;
                const currentStatus = localStatuses[entry.id] || initialStatus;

                return (
                  <div
                    key={entry.id}
                    className={cn(
                      "p-4 border-2 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-black/50",
                      expandedEntryId === entry.id
                        ? "border-black bg-muted shadow-none"
                        : "bg-card border-black",
                      // Status styles
                      currentStatus === "completado" && "bg-green-50/10",
                      currentStatus === "procesando" && "bg-blue-50/10",
                      currentStatus === "error" && "bg-red-50/10",
                      !currentStatus && "border-black",
                    )}
                  >
                    {/* List View Content (Simplified from original for brevity, keeping main struct) */}
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div
                        className="space-y-2 flex-1 cursor-pointer"
                        onClick={() =>
                          setExpandedEntryId(
                            expandedEntryId === entry.id ? null : entry.id,
                          )
                        }
                      >
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {isEditing && (
                            <div onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedIds.has(entry.id)}
                                onCheckedChange={() => toggleSelect(entry.id)}
                              />
                            </div>
                          )}
                          <span className="text-xs font-bold uppercase tracking-wider text-primary">
                            {entry.seccion || "Sección"}
                          </span>
                          <span className="text-muted-foreground text-[10px]">
                            •
                          </span>
                          <span className="text-xs font-medium text-muted-foreground">
                            {entry.tipo_de_acto &&
                            typeof entry.tipo_de_acto === "object"
                              ? entry.tipo_de_acto.nombre
                              : "Acto"}
                          </span>

                          {entry.nivel_opacidad !== undefined && (
                            <>
                              <span className="text-muted-foreground text-[10px]">
                                •
                              </span>
                              <span
                                className={`text-[10px] uppercase font-bold px-1.5 py-0.5 border-2 ${
                                  entry.nivel_opacidad === "Transparente" ||
                                  (typeof entry.nivel_opacidad === "number" &&
                                    entry.nivel_opacidad < 5)
                                    ? "bg-green-50 text-green-700 border-green-700"
                                    : entry.nivel_opacidad === "Parcial"
                                      ? "bg-yellow-50 text-yellow-700 border-yellow-700"
                                      : "bg-red-50 text-red-700 border-red-700"
                                }`}
                              >
                                {typeof entry.nivel_opacidad === "number"
                                  ? `Nivel ${entry.nivel_opacidad}`
                                  : entry.nivel_opacidad}
                              </span>
                            </>
                          )}
                        </div>

                        <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors mb-1">
                          {entry.titulo_periodistico ||
                            entry.titulo ||
                            entry.identificador_de_acto}
                        </h3>

                        {/* Subtitle / Metadata Context */}
                        <div className="flex flex-col gap-1 mb-2">
                          {entry.titulo_periodistico && (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 border border-black bg-white text-black uppercase tracking-wide">
                                Periodístico
                              </span>
                              {entry.titulo && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {entry.titulo}
                                </p>
                              )}
                            </div>
                          )}

                          <p className="text-xs font-mono text-muted-foreground/70">
                            {entry.identificador_de_acto}
                          </p>
                        </div>

                        <div className="text-sm text-foreground/80 line-clamp-3">
                          {entry.nota_periodistica ||
                            entry.resumen ||
                            "Sin resumen disponible."}
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
                );
              })}
              {entries?.docs.length === 0 && (
                <div className="text-center py-12 border-2 border-black border-dashed">
                  <p className="text-muted-foreground font-mono uppercase">
                    No se encontraron actos administrativos.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Mostrando {entries?.docs.length} de {entries?.totalDocs} actos
            </p>
            <div className="flex gap-2">
              <button
                disabled={!entries?.hasPrevPage}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 border-2 border-black disabled:opacity-50 hover:bg-black hover:text-white transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none bg-white"
                title="Página Anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center px-4 text-sm font-medium">
                Página {entries?.page} de {entries?.totalPages}
              </div>
              <button
                disabled={!entries?.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 border-2 border-black disabled:opacity-50 hover:bg-black hover:text-white transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none bg-white"
                title="Página Siguiente"
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

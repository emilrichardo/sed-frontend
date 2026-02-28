"use client";

import React, { useState, useEffect } from "react";
import {
  Boletin,
  getBulletins,
  PayloadResponse,
  Procesamiento,
  getAgents,
  Agent,
  createProcesamiento,
  deleteBulletin,
} from "@/lib/api";
import Link from "next/link";
import {
  LayoutGrid,
  List as ListIcon,
  ChevronLeft,
  ChevronRight,
  Upload,
  Play,
  Check,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ProcessingButton } from "@/components/ProcessingButton";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import BulletinFilters from "./BulletinFilters";
import { BulletinListSkeleton } from "./BulletinListSkeleton";

interface BulletinArchiveProps {
  filters?: Record<string, unknown>;
}

export default function BulletinArchive({
  filters: initialFilters,
}: BulletinArchiveProps) {
  const [bulletins, setBulletins] = useState<PayloadResponse<Boletin> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "list">("table");
  const [page, setPage] = useState(1);
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

  // Filters State
  const [filters, setFilters] = useState<Record<string, unknown>>(
    initialFilters || {},
  );

  const fetchAgents = async () => {
    if (agents.length > 0) return;
    setIsAgentsLoading(true);
    try {
      const agentList = await getAgents();
      // Only keep "Boletín Extractor" (ID 5)
      const filteredAgents = agentList.filter((a) => String(a.id) === "5");
      setAgents(filteredAgents);
      if (filteredAgents.length > 0 && !selectedAgentId) {
        setSelectedAgentId(filteredAgents[0].id);
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

    // Initial status update for UI feedback
    const newStatuses: Record<string, string> = { ...localStatuses };
    idsToProcess.forEach((id) => {
      newStatuses[id] = "en_cola";
    });
    setLocalStatuses(newStatuses);

    // Process sequentially to be nice to the backend
    // Let's do batches of 5
    const batchSize = 5;
    for (let i = 0; i < idsToProcess.length; i += batchSize) {
      const batch = idsToProcess.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (id) => {
          try {
            // Update status to processing
            setLocalStatuses((prev) => ({ ...prev, [id]: "procesando" }));

            await createProcesamiento({
              nombre: `Procesamiento Boletín ${id}`,
              documento_relacionado: {
                relationTo: "boletines",
                value: id,
              },
              agente: selectedAgentId,
              status: "en_cola", // Backend will pick it up
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

  const handleDelete = async (id: string, numero: number) => {
    if (
      !confirm(
        `¿Estás seguro de que deseas eliminar el boletín Nº ${numero}? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }

    try {
      await deleteBulletin(id);
      // Refresh list
      setLoading(true);
      const queryFilters = { ...filters };
      const search = queryFilters.search as string;
      delete queryFilters.search;

      const data = await getBulletins({
        page,
        limit: 10,
        where: {
          ...queryFilters,
          ...(search ? { numero: search } : {}),
        },
      });
      setBulletins(data);
    } catch (error) {
      console.error("Error deleting bulletin:", error);
      alert("Error eliminando el boletín.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function loadBulletins() {
      setLoading(true);
      try {
        const queryFilters = { ...filters };
        const search = queryFilters.search as string;
        delete queryFilters.search;

        const data = await getBulletins({
          page,
          limit: 10,
          where: {
            ...queryFilters,
            ...(search ? { numero: search } : {}),
          },
        });
        setBulletins(data);
      } catch (error) {
        console.error("Error loading bulletins:", error);
      } finally {
        setLoading(false);
      }
    }
    loadBulletins();
  }, [page, filters]);

  // Removed auto-select useEffect

  const toggleSelectAll = () => {
    if (bulletins?.docs && selectedIds.size === bulletins.docs.length) {
      setSelectedIds(new Set());
    } else if (bulletins?.docs) {
      setSelectedIds(new Set(bulletins.docs.map((b) => b.id)));
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR", {
      timeZone: "UTC",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        {/* Top Controls Bar */}
        {/* Top Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border bg-card rounded-lg shadow-sm">
          {/* Integrated Filters (Search + Dates) */}
          <div className="flex-1">
            <BulletinFilters onFilterChange={setFilters} />
          </div>

          <div className="flex items-center gap-4">
            {isEditing && (
              <Link
                href="/admin/subir-boletin"
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground border border-primary hover:bg-primary/90 transition-all rounded-md shadow-sm font-bold text-sm tracking-normal whitespace-nowrap"
              >
                <Upload className="w-4 h-4" />
                Cargar Boletín
              </Link>
            )}
            <div className="flex border rounded-md overflow-hidden bg-card">
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 border-r hover:bg-muted transition-colors ${
                  viewMode === "table" ? "bg-muted" : "bg-card"
                }`}
                title="Vista Tabla"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 hover:bg-muted transition-colors ${
                  viewMode === "list" ? "bg-muted" : "bg-card"
                }`}
                title="Vista Lista"
              >
                <ListIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {isEditing && selectedIds.size > 0 && (
        <div className="bg-muted/30 p-4 flex items-center justify-between border rounded-lg">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={
                  (bulletins?.docs?.length ?? 0) > 0 &&
                  selectedIds.size === bulletins?.docs?.length
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
                    className="flex items-center gap-2 bg-black text-white hover:bg-black/90"
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
                      Elige el agente para procesar los documentos
                      seleccionados.
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
                              "flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer border",
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
        <BulletinListSkeleton viewMode={viewMode} />
      ) : (
        <>
          {viewMode === "table" ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block border rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground font-medium text-xs border-b">
                    <tr>
                      {isEditing && (
                        <th className="px-4 py-3 w-10">
                          <Checkbox
                            checked={
                              (bulletins?.docs?.length ?? 0) > 0 &&
                              selectedIds.size === bulletins?.docs?.length
                            }
                            onCheckedChange={toggleSelectAll}
                          />
                        </th>
                      )}
                      <th className="px-4 py-3">Número</th>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Año Edición</th>
                      <th className="px-4 py-3">Páginas</th>
                      <th className="px-4 py-3">Actos</th>
                      {isEditing && (
                        <th className="px-4 py-3">Procesamiento</th>
                      )}
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y relative">
                    {bulletins?.docs.map((b) => {
                      const procs = Array.isArray(b.procesamiento_asociado)
                        ? b.procesamiento_asociado
                        : b.procesamiento_asociado
                          ? [b.procesamiento_asociado]
                          : [];
                      const validProcs = procs.filter(
                        (p) => typeof p !== "string",
                      ) as Procesamiento[];
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
                        localStatuses[b.id] || initialStatus;

                      const isProcessing = currentStatus === "procesando";
                      const isQueued = currentStatus === "en_cola";
                      const isError =
                        currentStatus === "error" ||
                        currentStatus === "cancelado";

                      const isExplicitlyCompleted = (b.cant_actos || 0) > 0;

                      return (
                        <tr
                          key={b.id}
                          className={cn(
                            "hover:bg-muted/30 transition-colors",
                            isEditing &&
                              isProcessing &&
                              "bg-blue-50/50 dark:bg-blue-950/20",
                            isEditing &&
                              isQueued &&
                              "bg-amber-50/50 dark:bg-amber-950/20",
                            isEditing &&
                              isError &&
                              "bg-red-50/50 dark:bg-red-950/20",
                            isEditing &&
                              !isProcessing &&
                              !isQueued &&
                              !isError &&
                              isExplicitlyCompleted &&
                              "bg-green-50/50 dark:bg-green-950/20",
                          )}
                        >
                          {isEditing && (
                            <td className="px-4 py-3">
                              <Checkbox
                                checked={selectedIds.has(b.id)}
                                onCheckedChange={() => toggleSelect(b.id)}
                              />
                            </td>
                          )}
                          <td className="px-4 py-3 font-medium">{b.numero}</td>
                          <td className="px-4 py-3">
                            {formatDate(b.fecha_publicacion)}
                          </td>
                          <td className="px-4 py-3">{b.año_edicion}</td>
                          <td className="px-4 py-3">{b.cantidad_paginas}</td>
                          <td className="px-4 py-3">{b.cant_actos || 0}</td>
                          {isEditing && (
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-2 relative">
                                <ProcessingButton
                                  relationTo="boletines"
                                  relatedId={b.id}
                                  existingProcessingId={latestProc?.id}
                                  requiredAgentId="5"
                                  hasExistingResults={
                                    !isError && isExplicitlyCompleted
                                  }
                                  onStatusChange={(status) => {
                                    setLocalStatuses((prev) => ({
                                      ...prev,
                                      [b.id]: status,
                                    }));
                                  }}
                                  className="scale-90 origin-left"
                                />
                              </div>
                            </td>
                          )}
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isEditing && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDelete(b.id, b.numero)}
                                  title="Eliminar boletín"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                              <Link
                                href={`/boletines/${b.slug}`}
                                className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                              >
                                Ver Detalle
                                <ChevronRight className="h-4 w-4" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile List View (replaces table on small screens) */}
              <div className="md:hidden space-y-4">
                {bulletins?.docs.map((b) => {
                  const procs = Array.isArray(b.procesamiento_asociado)
                    ? b.procesamiento_asociado
                    : b.procesamiento_asociado
                      ? [b.procesamiento_asociado]
                      : [];
                  const validProcs = procs.filter(
                    (p) => typeof p !== "string",
                  ) as Procesamiento[];
                  const latestProc =
                    validProcs.length > 0
                      ? validProcs.sort(
                          (a, b) =>
                            new Date(b.createdAt).getTime() -
                            new Date(a.createdAt).getTime(),
                        )[0]
                      : undefined;

                  const initialStatus = latestProc?.status;
                  const currentStatus = localStatuses[b.id] || initialStatus;

                  const isProcessing = currentStatus === "procesando";
                  const isQueued = currentStatus === "en_cola";
                  const isError =
                    currentStatus === "error" || currentStatus === "cancelado";

                  const isExplicitlyCompleted = (b.cant_actos || 0) > 0;

                  return (
                    <div
                      key={b.id}
                      className={cn(
                        "flex flex-col gap-3 p-4 border rounded-lg shadow-sm bg-card",
                        isEditing &&
                          isProcessing &&
                          "bg-blue-50/50 dark:bg-blue-950/20",
                        isEditing &&
                          isQueued &&
                          "bg-amber-50/50 dark:bg-amber-950/20",
                        isEditing &&
                          isError &&
                          "bg-red-50/50 dark:bg-red-950/20",
                        isEditing &&
                          !isProcessing &&
                          !isQueued &&
                          !isError &&
                          isExplicitlyCompleted &&
                          "bg-green-50/50 dark:bg-green-950/20",
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className="font-bold text-lg">#{b.numero}</span>
                          <span className="text-xs text-muted-foreground uppercase">
                            {formatDate(b.fecha_publicacion)}
                          </span>
                        </div>
                        {isEditing && (
                          <Checkbox
                            checked={selectedIds.has(b.id)}
                            onCheckedChange={() => toggleSelect(b.id)}
                          />
                        )}
                      </div>

                      <div className="flex gap-4 text-sm text-muted-foreground border-y border-dashed border-gray-300 py-2">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase">
                            Año
                          </span>
                          <span>{b.año_edicion}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase">
                            Páginas
                          </span>
                          <span>{b.cantidad_paginas}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase">
                            Actos
                          </span>
                          <span>{b.cant_actos || 0}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 mt-1">
                        {isEditing && (
                          <ProcessingButton
                            relationTo="boletines"
                            relatedId={b.id}
                            existingProcessingId={latestProc?.id}
                            requiredAgentId="5"
                            hasExistingResults={
                              !isError && isExplicitlyCompleted
                            }
                            onStatusChange={(status) => {
                              setLocalStatuses((prev) => ({
                                ...prev,
                                [b.id]: status,
                              }));
                            }}
                            className="w-full"
                          />
                        )}
                        <div className="flex gap-2 w-full">
                          {isEditing && (
                            <Button
                              variant="outline"
                              size="icon"
                              className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                              onClick={() => handleDelete(b.id, b.numero)}
                              title="Eliminar boletín"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          <Link
                            href={`/boletines/${b.slug}`}
                            className="flex-1 w-full"
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full justify-between group"
                            >
                              Ver Detalle
                              <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="grid gap-4">
              {bulletins?.docs.map((b) => (
                <Link
                  key={b.id}
                  href={`/boletines/${b.slug}`}
                  className="block p-4 border hover:bg-muted/50 transition-all bg-card rounded-lg shadow-sm hover:shadow-md"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">
                        Boletín Oficial Nº {b.numero}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Publicado el {formatDate(b.fecha_publicacion)}
                      </p>
                    </div>
                    <span className="text-xs font-bold font-mono bg-black text-white px-2 py-1 uppercase border border-black">
                      {b.año_edicion}
                    </span>
                  </div>
                  <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
                    <span>{b.cantidad_paginas} páginas</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4">
            <p className="text-xs font-bold uppercase tracking-normal text-muted-foreground">
              Mostrando {bulletins?.docs.length} de {bulletins?.totalDocs}{" "}
              boletines (duplicados fusionados automáticamente)
            </p>
            <div className="flex gap-2">
              <button
                disabled={!bulletins?.hasPrevPage}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 border rounded-md disabled:opacity-50 hover:bg-muted transition-colors shadow-sm bg-background"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center px-4 text-sm font-medium">
                Página {bulletins?.page} de {bulletins?.totalPages}
              </div>
              <button
                disabled={!bulletins?.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 border rounded-md disabled:opacity-50 hover:bg-muted transition-colors shadow-sm bg-background"
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

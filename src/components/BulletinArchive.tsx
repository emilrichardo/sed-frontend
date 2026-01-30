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
} from "@/lib/api";
import Link from "next/link";
import {
  Search,
  LayoutGrid,
  List as ListIcon,
  ChevronLeft,
  ChevronRight,
  Upload,
  Play,
  Check,
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

interface BulletinArchiveProps {
  filters?: Record<string, unknown>;
}

export default function BulletinArchive({ filters }: BulletinArchiveProps) {
  const [bulletins, setBulletins] = useState<PayloadResponse<Boletin> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "list">("table");
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
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

  useEffect(() => {
    async function loadBulletins() {
      setLoading(true);
      try {
        const data = await getBulletins({
          page,
          limit: 50,
          where: {
            ...filters,
            ...(searchQuery ? { numero: searchQuery } : {}),
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
  }, [page, filters, searchQuery]);

  // Select all by default when bulletins load
  useEffect(() => {
    if (bulletins?.docs) {
      setSelectedIds(new Set(bulletins.docs.map((b) => b.id)));
    }
  }, [bulletins?.docs]);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">
          Archivo de Boletines
        </h1>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por número..."
              className="w-full pl-9 pr-4 py-2 border-2 border-black bg-background text-sm focus:outline-none focus:ring-0 font-mono"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/admin/subir-boletin"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground border-2 border-primary hover:bg-black hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-[1px] font-bold text-sm uppercase tracking-wide"
            >
              <Upload className="w-4 h-4" />
              Cargar Boletín
            </Link>
            <div className="flex border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 ${
                  viewMode === "table"
                    ? "bg-accent text-accent-foreground"
                    : "bg-background"
                }`}
                title="Vista Tabla"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 ${
                  viewMode === "list"
                    ? "bg-accent text-accent-foreground"
                    : "bg-background"
                }`}
                title="Vista Lista"
              >
                <ListIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="bg-muted/30 p-4 flex items-center justify-between border-2 border-black">
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
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {viewMode === "table" ? (
            <div className="border-2 border-black overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <table className="w-full text-sm text-left">
                <thead className="bg-white text-black font-bold uppercase tracking-wide border-b-2 border-black text-xs">
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
                    {isEditing && <th className="px-4 py-3">Procesamiento</th>}
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {bulletins?.docs.map((b) => {
                    // Normalize processing association which can be an array
                    const procs = Array.isArray(b.procesamiento_asociado)
                      ? b.procesamiento_asociado
                      : b.procesamiento_asociado
                        ? [b.procesamiento_asociado]
                        : [];

                    // Filter and find the most relevant processing (e.g. valid object)
                    const validProcs = procs.filter(
                      (p) => typeof p !== "string",
                    ) as Procesamiento[];

                    // Sort by createdAt descending to get true latest
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

                    return (
                      <tr
                        key={b.id}
                        className={cn(
                          "hover:bg-muted/30 transition-colors",
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
                        {isEditing && (
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-2 relative">
                              <div className="flex flex-wrap gap-1 mb-1">
                                {(() => {
                                  const agentsMap = new Map<string, string>();
                                  validProcs.forEach((p) => {
                                    if (
                                      p.agente &&
                                      typeof p.agente === "object" &&
                                      "id" in p.agente
                                    ) {
                                      agentsMap.set(
                                        String(p.agente.id),
                                        p.agente.name,
                                      );
                                    }
                                  });

                                  return Array.from(agentsMap.entries()).map(
                                    ([id, name]) => (
                                      <span
                                        key={id}
                                        className="inline-flex items-center px-2 py-0.5 text-xs font-bold bg-secondary text-secondary-foreground border-2 border-black uppercase tracking-tighter"
                                      >
                                        {name}
                                      </span>
                                    ),
                                  );
                                })()}
                              </div>

                              <ProcessingButton
                                relationTo="boletines"
                                relatedId={b.id}
                                existingProcessingId={latestProc?.id}
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
                          <Link
                            href={`/boletines/${b.slug}`}
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
              {bulletins?.docs.map((b) => (
                <Link
                  key={b.id}
                  href={`/boletines/${b.slug}`}
                  className="block p-4 border-2 border-black hover:bg-muted transition-all bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-none"
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
                    <span className="text-xs font-bold font-mono bg-black text-white px-2 py-1 uppercase border-2 border-black">
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
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Mostrando {bulletins?.docs.length} de {bulletins?.totalDocs}{" "}
              boletines (duplicados fusionados automáticamente)
            </p>
            <div className="flex gap-2">
              <button
                disabled={!bulletins?.hasPrevPage}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 border-2 border-black disabled:opacity-50 hover:bg-black hover:text-white transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none bg-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center px-4 text-sm font-medium">
                Página {bulletins?.page} de {bulletins?.totalPages}
              </div>
              <button
                disabled={!bulletins?.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 border-2 border-black disabled:opacity-50 hover:bg-black hover:text-white transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none bg-white"
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

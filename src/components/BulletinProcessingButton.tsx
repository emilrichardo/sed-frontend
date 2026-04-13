"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import {
  createProcesamiento,
  getProcesamiento,
  updateProcesamiento,
  getActosAdministrativos,
  getAgents,
  Procesamiento,
  Agent,
  Boletin,
} from "@/lib/api";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Play,
  ChevronDown,
  X,
  FileText,
  ListChecks,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BulletinProcessingButtonProps {
  bulletin: Boletin;
  existingProcessingId?: string | number | null;
  /** Agent ID required for boletin processing (will pre-filter the list) */
  requiredBoletinAgentId?: string | number;
  onComplete?: (result: unknown) => void;
  onStatusChange?: (status: string) => void;
  className?: string;
}

type ProcessingStatus =
  | "idle"
  | "creating"
  | "queued"
  | "processing"
  | "completed"
  | "error"
  | "cancelled";

interface ProgressItem {
  id: string;
  filename: string;
  totalPages: number;
  processedPages: number;
  status: string;
  startTime: string;
}

export function BulletinProcessingButton({
  bulletin,
  existingProcessingId,
  requiredBoletinAgentId,
  onComplete,
  onStatusChange,
  className,
}: BulletinProcessingButtonProps) {
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [procId, setProcId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [progressInfo, setProgressInfo] = useState<ProgressItem[] | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Popover & agent state
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [selectedBoletinAgentId, setSelectedBoletinAgentId] = useState("");
  const [selectedActosAgentId, setSelectedActosAgentId] = useState("");

  // Actos processing option
  const [processActos, setProcessActos] = useState(false);
  const [actosStatus, setActosStatus] = useState<
    "idle" | "creating" | "done" | "error"
  >("idle");
  const [actosCount, setActosCount] = useState<number | null>(null);

  const bulletinId = bulletin.id;
  const hasExistingResults =
    bulletin.status_procesamiento === "basic" ||
    bulletin.status_procesamiento === "ai_enhanced";

  // --- Fetch agents on popover open ---
  const fetchAgents = useCallback(async () => {
    if (allAgents.length > 0) return;
    setAgentsLoading(true);
    try {
      const agentList = await getAgents();
      setAllAgents(agentList);

      // Boletin agents: filter by requiredBoletinAgentId if set
      const boletinAgents = requiredBoletinAgentId
        ? agentList.filter(
            (a) => String(a.id) === String(requiredBoletinAgentId),
          )
        : agentList;
      setAgents(boletinAgents);

      if (boletinAgents.length > 0) {
        setSelectedBoletinAgentId(boletinAgents[0].id);
      }
      if (agentList.length > 0) {
        setSelectedActosAgentId(agentList[0].id);
      }
    } catch (err) {
      console.error("Error fetching agents:", err);
    } finally {
      setAgentsLoading(false);
    }
  }, [allAgents.length, requiredBoletinAgentId]);

  // --- Fetch actos count for the bulletin ---
  const fetchActosCount = useCallback(async () => {
    if (actosCount !== null) return;
    try {
      const res = await getActosAdministrativos({
        limit: 1,
        where: { boletin: bulletinId },
        showDrafts: true,
        depth: 0,
      });
      setActosCount(res.totalDocs ?? 0);
    } catch {
      setActosCount(bulletin.cant_actos ?? null);
    }
  }, [actosCount, bulletinId, bulletin.cant_actos]);

  useEffect(() => {
    if (popoverOpen) {
      fetchAgents();
      fetchActosCount();
    }
  }, [popoverOpen, fetchAgents, fetchActosCount]);

  // --- Restore existing processing status on mount ---
  useEffect(() => {
    const fetchExistingStatus = async () => {
      if (existingProcessingId) {
        try {
          const proc = await getProcesamiento(String(existingProcessingId));
          setProcId(proc.id);
          if (proc.status === "completado") {
            setStatus("completed");
            onStatusChange?.("completado");
            if (onComplete && proc.resultado) onComplete(proc.resultado);
          } else if (proc.status === "error") {
            setStatus("error");
            onStatusChange?.("error");
          } else if (proc.status === "cancelado") {
            setStatus("cancelled");
            onStatusChange?.("cancelado");
          } else if (proc.status === "procesando") {
            setStatus("processing");
            onStatusChange?.("procesando");
            if (proc.info_progreso) {
              const info =
                typeof proc.info_progreso === "string"
                  ? JSON.parse(proc.info_progreso)
                  : proc.info_progreso;
              if (Array.isArray(info)) setProgressInfo(info);
              else if (info) setProgressInfo([info]);
            }
          } else if (proc.status === "en_cola") {
            setStatus("queued");
            onStatusChange?.("en_cola");
          }
        } catch {
          setStatus(hasExistingResults ? "completed" : "idle");
          onStatusChange?.(hasExistingResults ? "completado" : "sin_procesar");
        }
      } else if (hasExistingResults) {
        setStatus("completed");
        onStatusChange?.("completado");
      } else {
        onStatusChange?.("sin_procesar");
      }
      setIsInitialized(true);
    };
    fetchExistingStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingProcessingId, hasExistingResults]);

  // --- Polling ---
  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    if (pollTimerRef.current || !procId) return;
    pollTimerRef.current = setInterval(async () => {
      try {
        const proc = await getProcesamiento(procId);
        if (proc.status === "cancelado") {
          setStatus("cancelled");
          onStatusChange?.("cancelado");
          stopPolling();
        } else if (proc.status === "completado") {
          setStatus("completed");
          onStatusChange?.("completado");
          if (onComplete && proc.resultado) onComplete(proc.resultado);
          stopPolling();
        } else if (proc.status === "error") {
          setStatus("error");
          onStatusChange?.("error");
          setErrorMessage("Error en el procesamiento");
          stopPolling();
        } else {
          if (proc.status === "procesando") {
            setStatus("processing");
            onStatusChange?.("procesando");
            if (proc.info_progreso) {
              const info =
                typeof proc.info_progreso === "string"
                  ? JSON.parse(proc.info_progreso)
                  : proc.info_progreso;
              if (Array.isArray(info)) setProgressInfo(info);
              else if (info) setProgressInfo([info]);
            }
          }
          if (proc.status === "en_cola") {
            setStatus("queued");
            onStatusChange?.("en_cola");
            setProgressInfo(null);
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000);
  }, [procId, onComplete, onStatusChange, stopPolling]);

  useEffect(() => {
    if (status === "queued" || status === "processing") startPolling();
    else stopPolling();
    return () => stopPolling();
  }, [status, startPolling, stopPolling]);

  // --- Start processing ---
  const handleStart = async () => {
    setPopoverOpen(false);
    setStatus("creating");
    onStatusChange?.("procesando");
    setErrorMessage(null);
    setActosStatus("idle");

    const hasBoletinAgent = agents.length > 0 && !!selectedBoletinAgentId;

    const boletinAgentId = selectedBoletinAgentId
      ? /^\d+$/.test(selectedBoletinAgentId)
        ? parseInt(selectedBoletinAgentId, 10)
        : selectedBoletinAgentId
      : undefined;

    const numericBulletinId =
      typeof bulletinId === "string" && /^\d+$/.test(bulletinId)
        ? parseInt(bulletinId, 10)
        : bulletinId;

    try {
      // 1. Create boletin procesamiento (only if a boletin agent is available)
      if (hasBoletinAgent) {
        const boletinPayload: Partial<Procesamiento> = {
          nombre: `Procesamiento boletín Nº ${bulletin.numero}`,
          status: "en_cola",
          ...(boletinAgentId ? { agente: boletinAgentId } : {}),
          documento_relacionado: {
            relationTo: "boletines",
            value: numericBulletinId,
          },
        };

        const { doc } = await createProcesamiento(boletinPayload);
        setProcId(doc.id);
        setStatus("queued");
        onStatusChange?.("en_cola");
      }

      // 2. Optionally process actos
      if (processActos && selectedActosAgentId) {
        setActosStatus("creating");
        const actosAgentId = /^\d+$/.test(selectedActosAgentId)
          ? parseInt(selectedActosAgentId, 10)
          : selectedActosAgentId;

        try {
          const actosRes = await getActosAdministrativos({
            limit: 500,
            where: { boletin: bulletinId },
            showDrafts: true,
            depth: 0,
          });

          const actos = actosRes.docs || [];
          await Promise.all(
            actos.map((acto) => {
              const actoId =
                typeof acto.id === "string" && /^\d+$/.test(acto.id)
                  ? parseInt(acto.id, 10)
                  : acto.id;
              return createProcesamiento({
                nombre: `Procesamiento acto ${acto.identificador_de_acto || actoId}`,
                status: "en_cola",
                agente: actosAgentId,
                documento_relacionado: {
                  relationTo: "actos-administrativos",
                  value: actoId,
                },
              });
            }),
          );

          setActosStatus("done");
        } catch (err) {
          console.error("Error creating actos processings:", err);
          setActosStatus("error");
        }
      }

      // If no boletin processing was created (actos-only mode), return to idle
      if (!hasBoletinAgent) {
        setStatus("idle");
        onStatusChange?.("sin_procesar");
      }
    } catch (err) {
      console.error("Failed to create processing:", err);
      setStatus("error");
      onStatusChange?.("error");
      setErrorMessage("No se pudo iniciar el procesamiento.");
    }
  };

  const handleCancel = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!procId) return;
    try {
      await updateProcesamiento(procId, { status: "cancelado" });
      setStatus("cancelled");
      setErrorMessage("Procesamiento cancelado");
      onStatusChange?.("cancelado");
      stopPolling();
    } catch (err) {
      console.error("Error cancelling:", err);
    }
  };

  // --- Render button content ---
  const renderButtonContent = () => {
    switch (status) {
      case "idle":
        return (
          <>
            <Play className="mr-2 h-4 w-4" />
            Procesar con IA
            <ChevronDown className="ml-2 h-4 w-4" />
          </>
        );
      case "creating":
        return (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Iniciando...
          </>
        );
      case "queued":
        return (
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-yellow-500" />
              En cola...
            </div>
            <div
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCancel(e);
              }}
              className="p-0.5 hover:bg-destructive hover:text-destructive-foreground text-muted-foreground transition-colors z-50 cursor-pointer pointer-events-auto rounded-sm"
              title="Cancelar"
            >
              <X className="h-4 w-4" />
            </div>
          </div>
        );
      case "processing": {
        const first = progressInfo?.[0] ?? null;
        const pct =
          first && first.totalPages > 0
            ? Math.round((first.processedPages / first.totalPages) * 100)
            : 0;
        return (
          <div className="flex flex-col items-center w-full min-w-[120px]">
            <div className="flex items-center gap-2 mb-1">
              <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
              <span className="text-[10px] font-bold uppercase">
                {first
                  ? `Procesando ${first.processedPages}/${first.totalPages}`
                  : "Procesando..."}
              </span>
              <div
                role="button"
                onClick={handleCancel}
                className="p-0.5 hover:bg-destructive hover:text-destructive-foreground text-muted-foreground transition-colors z-50 cursor-pointer pointer-events-auto rounded-sm"
                title="Cancelar"
              >
                <X className="h-3 w-3" />
              </div>
            </div>
            <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-500 ease-out rounded-full"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      }
      case "completed":
        return (
          <>
            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
            Reprocesar
            <ChevronDown className="ml-2 h-4 w-4" />
          </>
        );
      case "error":
        return (
          <>
            <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
            Reintentar
            <ChevronDown className="ml-2 h-4 w-4" />
          </>
        );
      case "cancelled":
        return (
          <>
            <X className="mr-2 h-4 w-4 text-orange-500" />
            Cancelado
            <ChevronDown className="ml-2 h-4 w-4" />
          </>
        );
    }
  };

  const getVariant = () => {
    if (status === "error") return "destructive" as const;
    if (status === "cancelled") return "secondary" as const;
    if (status === "completed") return "outline" as const;
    return "default" as const;
  };

  const canOpenPopover =
    status === "idle" ||
    status === "error" ||
    status === "completed" ||
    status === "cancelled";

  if (!isInitialized) {
    return (
      <Button variant="outline" disabled className={cn("w-full md:w-auto", className)}>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Cargando...
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Popover
        open={popoverOpen}
        onOpenChange={(open) => setPopoverOpen(open)}
      >
        <PopoverTrigger asChild>
          <Button
            variant={getVariant()}
            disabled={!canOpenPopover}
            className={cn("w-full md:w-auto transition-all", className)}
          >
            {renderButtonContent()}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-88" align="end">
          <div className="space-y-5">
            {/* === Boletin section === */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Procesar boletín
              </div>
              <p className="text-xs text-muted-foreground">
                Extrae el contenido del PDF del boletín Nº {bulletin.numero}.
              </p>
              {agentsLoading ? (
                <div className="flex items-center justify-center py-3">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : agents.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2 text-center">
                  No hay agentes disponibles.
                </p>
              ) : (
                <Select
                  value={selectedBoletinAgentId}
                  onValueChange={setSelectedBoletinAgentId}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Seleccionar agente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((a) => (
                      <SelectItem key={a.id} value={a.id} className="text-xs">
                        {a.name}
                        {a.modelSettings?.modelName && (
                          <span className="text-muted-foreground ml-1">
                            ({a.modelSettings.modelName})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="border-t" />

            {/* === Actos section === */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="process-actos"
                  checked={processActos}
                  onCheckedChange={(v) => setProcessActos(Boolean(v))}
                />
                <label
                  htmlFor="process-actos"
                  className="flex items-center gap-1.5 text-sm font-medium cursor-pointer"
                >
                  <ListChecks className="h-4 w-4 text-muted-foreground" />
                  Procesar actos administrativos
                  {actosCount !== null && (
                    <span className="text-xs text-muted-foreground font-normal">
                      ({actosCount})
                    </span>
                  )}
                </label>
              </div>

              {processActos && (
                <div className="pl-6 space-y-1.5">
                  <p className="text-xs text-muted-foreground">
                    Se creará un procesamiento para cada acto del boletín.
                  </p>
                  {agentsLoading ? (
                    <div className="flex items-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <Select
                      value={selectedActosAgentId}
                      onValueChange={setSelectedActosAgentId}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Agente para actos..." />
                      </SelectTrigger>
                      <SelectContent>
                        {allAgents.map((a) => (
                          <SelectItem
                            key={a.id}
                            value={a.id}
                            className="text-xs"
                          >
                            {a.name}
                            {a.modelSettings?.modelName && (
                              <span className="text-muted-foreground ml-1">
                                ({a.modelSettings.modelName})
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}
            </div>

            {/* === Actions === */}
            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPopoverOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleStart}
                disabled={
                  // Need at least boletin agent OR actos selected with agent
                  (!selectedBoletinAgentId && agents.length > 0) ||
                  (agents.length === 0 && (!processActos || !selectedActosAgentId)) ||
                  (processActos && !selectedActosAgentId)
                }
              >
                <Play className="mr-2 h-4 w-4" />
                Iniciar
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Status messages */}
      {errorMessage && (
        <span className="text-xs text-red-500">{errorMessage}</span>
      )}
      {actosStatus === "done" && (
        <span className="text-xs text-green-600">
          Procesamientos de actos creados
        </span>
      )}
      {actosStatus === "error" && (
        <span className="text-xs text-red-500">
          Error al crear procesamientos de actos
        </span>
      )}
    </div>
  );
}

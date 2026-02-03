"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "./ui/button";
import {
  createProcesamiento,
  getProcesamiento,
  updateProcesamiento,
  getAgents,
  Procesamiento,
  Agent,
} from "@/lib/api";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Play,
  ChevronDown,
  X,
} from "lucide-react";
// ... (rest of imports)

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

interface ProcessingButtonProps {
  relationTo: "boletines" | "noticias" | "actos-administrativos" | null;
  relatedId: string | number | null;
  existingProcessingId?: string | number | null;
  onComplete?: (result: unknown) => void;
  onStatusChange?: (status: string) => void;
  className?: string;
  pollingInterval?: number;
  requiredAgentId?: string | number;
  hasExistingResults?: boolean;
}

interface ProgressItem {
  id: string;
  filename: string;
  totalPages: number;
  processedPages: number;
  status: string;
  startTime: string;
}

export function ProcessingButton({
  relationTo,
  relatedId,
  existingProcessingId,
  onComplete,
  onStatusChange,
  className,
  pollingInterval = 2000,
  requiredAgentId,
  hasExistingResults = false,
}: ProcessingButtonProps) {
  const [status, setStatus] = useState<
    | "idle"
    | "creating"
    | "queued"
    | "processing"
    | "completed"
    | "error"
    | "cancelled"
  >("idle");
  const [procId, setProcId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [progressInfo, setProgressInfo] = useState<ProgressItem[] | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Agent selection state
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Fetch agents when popover opens
  const fetchAgents = useCallback(async () => {
    if (agents.length > 0) return; // Already loaded
    setAgentsLoading(true);
    try {
      let agentList = await getAgents();

      if (requiredAgentId) {
        agentList = agentList.filter(
          (a) => String(a.id) === String(requiredAgentId),
        );
      }

      setAgents(agentList);
      if (agentList.length > 0) {
        setSelectedAgentId(agentList[0].id);
      }
    } catch (err) {
      console.error("Error fetching agents:", err);
    } finally {
      setAgentsLoading(false);
    }
  }, [agents.length, requiredAgentId]);

  // On mount, check if there's an existing processing and fetch its status
  useEffect(() => {
    const fetchExistingStatus = async () => {
      if (existingProcessingId) {
        try {
          const proc = await getProcesamiento(String(existingProcessingId));
          setProcId(proc.id);
          if (proc.status === "completado") {
            setStatus("completed");
            onStatusChange?.("completado");
            if (onComplete && proc.resultado) {
              onComplete(proc.resultado);
            }
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
              let info = proc.info_progreso;
              if (typeof info === "string") {
                try {
                  info = JSON.parse(info);
                } catch {
                  // ignore error on initial load
                }
              }
              if (Array.isArray(info)) {
                setProgressInfo(info);
              } else if (info && typeof info === "object") {
                setProgressInfo([info as ProgressItem]);
              }
            }
          } else if (proc.status === "en_cola") {
            setStatus("queued");
            onStatusChange?.("en_cola");
          }
        } catch (err) {
          console.log("No existing processing found or error fetching:", err);
          if (hasExistingResults) {
            setStatus("completed");
            onStatusChange?.("completado");
          } else {
            setStatus("idle");
            onStatusChange?.("sin_procesar");
          }
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

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    if (pollTimerRef.current) return;
    if (!procId) return;

    pollTimerRef.current = setInterval(async () => {
      try {
        const proc = await getProcesamiento(procId);

        // Check cancellation
        if (proc.status === "cancelado") {
          setStatus("cancelled");
          onStatusChange?.("cancelado");
          stopPolling();
          return;
        }

        if (proc.status === "completado") {
          setStatus("completed");
          onStatusChange?.("completado");
          if (onComplete && proc.resultado) {
            onComplete(proc.resultado);
          }
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
              let info = proc.info_progreso;
              if (typeof info === "string") {
                try {
                  info = JSON.parse(info);
                } catch (e) {
                  console.error("Failed to parse progress info:", e);
                  info = null;
                }
              }
              if (Array.isArray(info)) {
                setProgressInfo(info);
              } else if (info && typeof info === "object") {
                setProgressInfo([info as ProgressItem]);
              }
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
    }, pollingInterval);
  }, [procId, onComplete, onStatusChange, pollingInterval, stopPolling]);

  useEffect(() => {
    if (status === "queued" || status === "processing") {
      startPolling();
    } else {
      stopPolling();
    }
    return () => stopPolling();
  }, [status, startPolling, stopPolling]);

  const handleStart = async () => {
    setPopoverOpen(false);
    setStatus("creating");
    onStatusChange?.("procesando");
    setErrorMessage(null);

    const rawId = relatedId;
    let finalId: string | number | null = rawId;

    if (typeof rawId === "string" && /^\d+$/.test(rawId)) {
      finalId = parseInt(rawId, 10);
    }

    let finalAgentId: string | number | undefined = selectedAgentId;
    if (selectedAgentId && /^\d+$/.test(selectedAgentId)) {
      finalAgentId = parseInt(selectedAgentId, 10);
    }

    console.log("ProcessingButton: Starting...", {
      relationTo,
      finalId,
      finalAgentId,
    });

    try {
      if (!relationTo || !finalId) throw new Error("Missing relation info");

      const payload: Partial<Procesamiento> = {
        nombre: `Procesamiento ${relationTo} ${String(finalId).substring(0, 8)}`,
        status: "en_cola",
        ...(finalAgentId ? { agente: finalAgentId } : {}),
        documento_relacionado: {
          relationTo: relationTo,
          value: finalId,
        },
      };

      const { doc } = await createProcesamiento(payload);
      setProcId(doc.id);
      setStatus("queued");
      onStatusChange?.("en_cola");
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
      console.error("Error clicking cancel:", err);
    }
  };

  // ...

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
              En Cola...
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
      case "processing":
        const firstProgress =
          progressInfo && progressInfo.length > 0 ? progressInfo[0] : null;
        const percentage =
          firstProgress && firstProgress.totalPages > 0
            ? Math.round(
                (firstProgress.processedPages / firstProgress.totalPages) * 100,
              )
            : 0;

        return (
          <div className="flex flex-col items-center w-full min-w-[120px]">
            <div className="flex items-center gap-2 mb-1">
              <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
              <span className="text-[10px] font-bold uppercase">
                {firstProgress
                  ? `Procesando ${firstProgress.processedPages}/${firstProgress.totalPages}`
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
            <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden relative">
              <div
                className="bg-primary h-full transition-all duration-500 ease-out rounded-full"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
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
    if (status === "error") return "destructive";
    if (status === "cancelled") return "secondary"; // Or destructive/outline
    if (status === "completed") return "outline";
    return "default";
  };

  const canOpenPopover =
    status === "idle" ||
    status === "error" ||
    status === "completed" ||
    status === "cancelled";

  if (!isInitialized) {
    return (
      <div className="flex flex-col items-start gap-2">
        <Button
          variant="outline"
          disabled
          className={cn("w-full md:w-auto", className)}
        >
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Cargando...
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Popover
        open={popoverOpen}
        onOpenChange={(open) => {
          setPopoverOpen(open);
          if (open) fetchAgents();
        }}
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
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Seleccionar Agente</h4>
              <p className="text-xs text-muted-foreground">
                Elige el agente de IA que procesará este documento.
              </p>
            </div>

            {agentsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : agents.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center">
                No hay agentes disponibles.
                <br />
                <span className="text-xs">
                  Crea uno desde el panel de administración.
                </span>
              </div>
            ) : (
              <Select
                value={selectedAgentId}
                onValueChange={setSelectedAgentId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar agente..." />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                      {agent.modelSettings?.modelName && (
                        <span className="text-muted-foreground ml-1">
                          ({agent.modelSettings.modelName})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="flex justify-end gap-2">
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
                disabled={!selectedAgentId || agents.length === 0}
              >
                <Play className="mr-2 h-4 w-4" />
                Iniciar
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {errorMessage && (
        <span className="text-xs text-red-500">{errorMessage}</span>
      )}
    </div>
  );
}

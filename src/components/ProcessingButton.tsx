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
}: ProcessingButtonProps) {
  const [status, setStatus] = useState<
    "idle" | "creating" | "queued" | "processing" | "completed" | "error"
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
              }
            }
          } else if (proc.status === "en_cola") {
            setStatus("queued");
            onStatusChange?.("en_cola");
          }
        } catch (err) {
          console.log("No existing processing found or error fetching:", err);
          setStatus("idle");
          onStatusChange?.("sin_procesar");
        }
      } else {
        onStatusChange?.("sin_procesar");
      }
      setIsInitialized(true);
    };
    fetchExistingStatus();
  }, [existingProcessingId]);

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
        if (proc.status === "procesando") {
          // console.log("Processing update debug:", proc.id, proc.status, proc.info_progreso);
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
                console.log("Setting progress info:", info);
                setProgressInfo(info);
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

      console.log("Sending payload:", JSON.stringify(payload));

      const { doc } = await createProcesamiento(payload);
      console.log("Processing created:", doc);
      setProcId(doc.id);
      setStatus("queued");
      onStatusChange?.("en_cola");
    } catch (err) {
      console.error("Failed to create processing:", err);
      setStatus("error");
      onStatusChange?.("error");
      setErrorMessage(
        "No se pudo iniciar el procesamiento. Revise la consola.",
      );
    }
  };

  const handleCancel = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!procId) return;

    try {
      await updateProcesamiento(procId, { status: "cancelado" });
      setStatus("error");
      setErrorMessage("Procesamiento cancelado por el usuario");
      onStatusChange?.("cancelado");
      stopPolling();
    } catch (err) {
      console.error("Error clicking cancel:", err);
    }
  };

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
              onClick={handleCancel}
              className="p-0.5 rounded-full hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors z-50 cursor-pointer pointer-events-auto"
              title="Cancelar"
            >
              <X className="h-4 w-4" />
            </div>
          </div>
        );
      case "processing":
        return (
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-blue-500" />
              Procesando...
            </div>
            <div
              role="button"
              onClick={handleCancel}
              className="p-0.5 rounded-full hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors z-50 cursor-pointer pointer-events-auto"
              title="Cancelar"
            >
              <X className="h-4 w-4" />
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
    }
  };

  const getVariant = () => {
    if (status === "error") return "destructive";
    if (status === "completed") return "outline";
    return "default";
  };

  const canOpenPopover =
    status === "idle" || status === "error" || status === "completed";

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
      {status === "processing" && progressInfo && progressInfo.length > 0 && (
        <div className="w-full min-w-[160px] space-y-1 animate-in fade-in slide-in-from-top-1 duration-300 relative z-10 pt-1">
          {progressInfo.map((info, idx) => {
            const percentage =
              info.totalPages > 0
                ? Math.round((info.processedPages / info.totalPages) * 100)
                : 0;
            return (
              <div
                key={info.id || idx}
                className="space-y-1 bg-background/50 backdrop-blur-sm p-1 rounded-md border border-border/50 shadow-sm"
              >
                <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                  <span>
                    Páginas: {info.processedPages} / {info.totalPages}
                  </span>
                  <span>{percentage}%</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

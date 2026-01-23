"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "./ui/button";
import {
  createProcesamiento,
  getProcesamiento,
  Procesamiento,
} from "@/lib/api";
import { Loader2, CheckCircle, AlertCircle, Play } from "lucide-react";
import { cn } from "@/lib/utils"; // Assuming utils exists for cn, typical in shadcn

interface ProcessingButtonProps {
  relationTo: "boletines" | "noticias" | null;
  relatedId: string | number | null;
  initialStatus?:
    | "unprocessed"
    | "queued"
    | "processing"
    | "completed"
    | "error"
    | "ai_enhanced"
    | "basic";
  onComplete?: (result: any) => void;
  className?: string;
  pollingInterval?: number;
}

export function ProcessingButton({
  relationTo,
  relatedId,
  initialStatus,
  onComplete,
  className,
  pollingInterval = 2000,
}: ProcessingButtonProps) {
  const [status, setStatus] = useState<
    "idle" | "creating" | "queued" | "processing" | "completed" | "error"
  >(initialStatus === "ai_enhanced" ? "completed" : "idle");
  const [procId, setProcId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // We remove the useEffect that was syncing initialStatus for simplicity and to avoid the lint error.
  // Ideally, if initialStatus changes later, we might want to sync, but for this use case, initialization is enough.

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    if (pollTimerRef.current) return; // Already polling
    if (!procId) return; // Need an ID to poll

    pollTimerRef.current = setInterval(async () => {
      try {
        const proc = await getProcesamiento(procId);
        console.log("Polling processing:", proc);

        if (proc.estado === "completed") {
          setStatus("completed");
          if (onComplete && proc.resultado) {
            onComplete(proc.resultado);
          }
        } else if (proc.estado === "error") {
          setStatus("error");
          setErrorMessage("Error en el procesamiento");
        } else {
          // Update status if changed (e.g. queued -> processing)
          setStatus(proc.estado);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, pollingInterval);
  }, [procId, onComplete, pollingInterval]);

  useEffect(() => {
    if (status === "queued" || status === "processing") {
      startPolling();
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [status, startPolling, stopPolling]);

  const handleStart = async () => {
    setStatus("creating");
    setErrorMessage(null);

    // Sanitize ID: standard Payload IDs are usually numeric for SQL, but string for Mono.
    // If it looks like a number, send as number.
    const rawId = relatedId;

    // Send ID as string to avoid potential backend casting issues or mismatched expectations.
    // If the backend expects a number, Payload/Postgres should handle the string '123' -> 123 cast generally better
    // than if strict typing assumes one or the other.
    const finalId = String(rawId);

    console.log("ProcessingButton: Starting...", {
      relationTo,
      relatedId: rawId,
      finalId,
      type: typeof finalId,
    });

    try {
      // 1. Create Processing
      const payload: Partial<Procesamiento> = {
        nombre: `Procesamiento ${relationTo} ${finalId.substring(0, 8)}`,
        estado: "queued",
      };

      console.log("Sending payload:", JSON.stringify(payload));

      const { doc } = await createProcesamiento(payload);
      console.log("Processing created:", doc);
      setProcId(doc.id);
      setStatus("queued"); // This triggers polling
    } catch (err) {
      console.error("Failed to create processing:", err);
      setStatus("error");
      setErrorMessage(
        "No se pudo iniciar el procesamiento. Revise la consola.",
      );
    }
  };

  const renderContent = () => {
    switch (status) {
      case "idle":
        return (
          <>
            <Play className="mr-2 h-4 w-4" />
            Procesar con IA
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
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-yellow-500" />
            En Cola...
          </>
        );
      case "processing":
        return (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-blue-500" />
            Procesando...
          </>
        );
      case "completed":
        return (
          <>
            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
            Completado
          </>
        );
      case "error":
        return (
          <>
            <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
            Error
          </>
        );
    }
  };

  // Determine variant based on status for visual feedback
  const getVariant = () => {
    if (status === "error") return "destructive";
    if (status === "completed") return "outline"; // or secondary
    return "default";
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        variant={getVariant()}
        onClick={handleStart}
        disabled={
          status !== "idle" && status !== "error" && status !== "completed"
        } // Allow retry on error/completed?
        className={cn("w-full md:w-auto transition-all", className)}
      >
        {renderContent()}
      </Button>
      {errorMessage && (
        <span className="text-xs text-red-500">{errorMessage}</span>
      )}
    </div>
  );
}

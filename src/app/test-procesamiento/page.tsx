"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getBulletins, Boletin, Procesamiento } from "@/lib/api";
import { ProcessingButton } from "@/components/ProcessingButton";
import { Loader2 } from "lucide-react";

// Helper to get processing ID from populated or plain value
const getProcessingId = (
  procesamiento: Procesamiento | string | number | null | undefined,
): string | number | null => {
  if (!procesamiento) return null;
  if (typeof procesamiento === "object" && procesamiento.id)
    return procesamiento.id;
  return procesamiento as string | number;
};

// Map backend status to display label
const statusLabels: Record<string, { label: string; color: string }> = {
  sin_procesar: { label: "Sin procesar", color: "text-gray-500" },
  en_cola: { label: "En cola", color: "text-yellow-500" },
  procesando: { label: "Procesando...", color: "text-blue-500" },
  completado: { label: "Completado", color: "text-green-600" },
  error: { label: "Error", color: "text-red-500" },
};

export default function TestProcesamientoPage() {
  const [boletines, setBoletines] = useState<Boletin[]>([]);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<Record<string, unknown>>({});
  const [processingStatuses, setProcessingStatuses] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const bltRes = await getBulletins({ limit: 5 });
        setBoletines(bltRes.docs);
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleStatusChange = useCallback(
    (boletinId: string, status: string) => {
      setProcessingStatuses((prev) => ({ ...prev, [boletinId]: status }));
    },
    [],
  );

  const handleComplete = useCallback((boletinId: string, result: unknown) => {
    setResults((prev) => ({ ...prev, [boletinId]: result }));
    setProcessingStatuses((prev) => ({ ...prev, [boletinId]: "completado" }));
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="space-y-2 border-b pb-4">
          <h1 className="text-3xl font-bold tracking-tight">
            Test de Procesamiento de IA
          </h1>
          <p className="text-muted-foreground text-lg">
            Prueba de flujo completo con relación a documento y agente. Haz clic
            en el botón para seleccionar un agente e iniciar el procesamiento.
          </p>
        </header>

        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6">
            {boletines.map((b) => {
              const existingProcId = getProcessingId(
                (
                  b as {
                    procesamiento_asociado?: Procesamiento | string | number;
                  }
                ).procesamiento_asociado,
              );
              const currentStatus =
                processingStatuses[String(b.id)] || "sin_procesar";
              const statusInfo =
                statusLabels[currentStatus] || statusLabels.sin_procesar;

              return (
                <div
                  key={b.id}
                  className="flex flex-col md:flex-row gap-6 p-6 border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow items-start"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider">
                        Boletín
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        ID: {b.id}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold">
                      Boletín #{b.numero} -{" "}
                      {new Date(b.fecha_publicacion).toLocaleDateString()}
                    </h3>
                    <div className="space-y-1">
                      <p className="text-sm text-foreground/80">
                        Estado del Procesamiento:{" "}
                        <span className={`font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </p>
                    </div>

                    {results[String(b.id)] !== undefined && (
                      <div className="mt-4 pt-4 border-t max-w-[400px]">
                        <p className="text-xs font-semibold mb-2 text-green-600">
                          Resultado del Procesamiento Reciente:
                        </p>
                        <div className="bg-muted/50 p-3 rounded-md overflow-x-auto max-h-60 text-xs font-mono border">
                          <pre>
                            {JSON.stringify(results[String(b.id)], null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="w-full md:w-auto flex flex-col items-end gap-2 min-w-[200px]">
                    <ProcessingButton
                      relationTo="boletines"
                      relatedId={b.id}
                      existingProcessingId={existingProcId}
                      onStatusChange={(status) =>
                        handleStatusChange(b.id, status)
                      }
                      onComplete={(res) => handleComplete(b.id, res)}
                      className="w-full"
                    />
                    <p className="text-[10px] text-muted-foreground text-center w-full">
                      El proceso puede tardar ~10-15s
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

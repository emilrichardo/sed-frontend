"use client";

import React, { useState, useEffect } from "react";
import { getBulletins, Boletin } from "@/lib/api";
import { ProcessingButton } from "@/components/ProcessingButton";
import { Loader2 } from "lucide-react";

export default function TestProcesamientoPage() {
  const [boletines, setBoletines] = useState<Boletin[]>([]);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<Record<string, any>>({});

  useEffect(() => {
    getBulletins({ limit: 5 })
      .then((res) => {
        setBoletines(res.docs);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading bulletins:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="space-y-2 border-b pb-4">
          <h1 className="text-3xl font-bold tracking-tight">
            Test de Procesamiento de IA
          </h1>
          <p className="text-muted-foreground text-lg">
            Prueba de flujo completo: Crear Procesamiento -&gt; En Cola -&gt;
            Procesando -&gt; Completado.
          </p>
        </header>

        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6">
            {boletines.map((b) => (
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
                      Estado Actual (BD):{" "}
                      <span
                        className={`font-medium ${b.status_procesamiento === "ai_enhanced" ? "text-green-600" : "text-yellow-600"}`}
                      >
                        {b.status_procesamiento || "unprocessed"}
                      </span>
                    </p>
                  </div>

                  {results[b.id] && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs font-semibold mb-2 text-green-600">
                        Resultado del Procesamiento Reciente:
                      </p>
                      <div className="bg-muted/50 p-3 rounded-md overflow-x-auto max-h-60 text-xs font-mono border">
                        <pre>{JSON.stringify(results[b.id], null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </div>

                <div className="w-full md:w-auto flex flex-col items-end gap-2 min-w-[200px]">
                  <ProcessingButton
                    relationTo={null}
                    relatedId={null}
                    initialStatus={b.status_procesamiento || undefined}
                    onComplete={(res) =>
                      setResults((prev) => ({ ...prev, [b.id]: res }))
                    }
                    className="w-full"
                  />
                  <p className="text-[10px] text-muted-foreground text-center w-full">
                    El proceso puede tardar ~10-15s
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

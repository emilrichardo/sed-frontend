"use client";

import { useState, useEffect } from "react";
import { Agent, Boletin, getBulletins } from "@/lib/api";
import {
  Bot,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  Play,
  AlertCircle,
} from "lucide-react";
import clsx from "clsx";

interface BulletinProcessorProps {
  selectedAgent: Agent;
}

export default function BulletinProcessor({
  selectedAgent,
}: BulletinProcessorProps) {
  const [bulletins, setBulletins] = useState<Boletin[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchBulletins = async () => {
    setLoading(true);
    try {
      const res = await getBulletins({ limit: 50, sort: "-fecha_publicacion" });
      setBulletins(res.docs);
    } catch (error) {
      console.error("Failed to fetch bulletins", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBulletins();
  }, []);

  const handleProcess = async (bulletin: Boletin) => {
    setProcessingId(bulletin.id);

    try {
      const res = await fetch("/api/agent-process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          bulletinId: bulletin.id,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to process bulletin");
      }

      const data = await res.json();
      console.log("Processing complete:", data);

      setBulletins((prev) =>
        prev.map((b) =>
          b.id === bulletin.id
            ? { ...b, status_procesamiento: "ai_enhanced" }
            : b,
        ),
      );
    } catch (error) {
      console.error("Error processing bulletin:", error);
      alert("Error al procesar el boletín via Agente. Revisa la consola.");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
          <Bot className="w-6 h-6 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest">
          Sincronizando archivos...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50/50">
              <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">
                Documento
              </th>
              <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">
                Publicación
              </th>
              <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">
                Estado
              </th>
              <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] text-right">
                Análisis
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {bulletins.map((bulletin) => (
              <tr
                key={bulletin.id}
                className="group hover:bg-neutral-50/50 transition-all duration-300"
              >
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-neutral-100 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:border-indigo-100 transition-all">
                      <FileText className="w-6 h-6 text-neutral-400 group-hover:text-indigo-500 transition-colors" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-neutral-900 group-hover:text-indigo-600 transition-colors">
                        Boletín Oficial {bulletin.numero}
                      </div>
                      <div className="text-[10px] font-mono text-neutral-400 mt-0.5">
                        REF: {bulletin.id.substring(0, 8)}...
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-neutral-600">
                      {new Date(bulletin.fecha_publicacion).toLocaleDateString(
                        "es-AR",
                        { day: "numeric", month: "long", year: "numeric" },
                      )}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mt-0.5">
                      Edición {bulletin.año_edicion}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <StatusBadge status={bulletin.status_procesamiento} />
                </td>
                <td className="px-8 py-6 text-right">
                  {bulletin.status_procesamiento === "ai_enhanced" ? (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-green-50 text-green-700 border border-green-100">
                      <CheckCircle className="w-4 h-4" />
                      Completado
                    </div>
                  ) : (
                    <button
                      onClick={() => handleProcess(bulletin)}
                      disabled={processingId !== null}
                      className={clsx(
                        "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95",
                        processingId === bulletin.id
                          ? "bg-indigo-50 text-indigo-600 border border-indigo-100 cursor-wait"
                          : processingId !== null
                            ? "bg-neutral-50 text-neutral-300 border border-neutral-100 cursor-not-allowed"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200",
                      )}
                    >
                      {processingId === bulletin.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Analizando...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-current" />
                          Procesar
                        </>
                      )}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {bulletins.length === 0 && (
        <div className="p-20 text-center">
          <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4 grayscale opacity-50">
            <AlertCircle className="w-8 h-8 text-neutral-400" />
          </div>
          <h4 className="text-sm font-bold text-neutral-400 uppercase tracking-widest">
            Sin documentos pendientes
          </h4>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Boletin["status_procesamiento"] }) {
  if (status === "ai_enhanced") {
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
        <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
        IA ENHANCED
      </span>
    );
  }
  if (status === "basic") {
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">
        <CheckCircle className="w-3 h-3" />
        BÁSICO
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold bg-neutral-100 text-neutral-400 border border-neutral-200">
      <Clock className="w-3 h-3" />
      SIN PROCESAR
    </span>
  );
}

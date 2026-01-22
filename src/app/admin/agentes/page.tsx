"use client";

import { useState, useEffect } from "react";
import { Agent } from "@/lib/api";
import Link from "next/link";
import { Bot, Loader2, ArrowRight } from "lucide-react";

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("payload-token");
    fetch("/api/agents", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setAgents(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load agents", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50/50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center text-white shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold text-neutral-900 tracking-tight">
              Agentes de IA
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            <span className="ml-3 text-neutral-500 font-medium">
              Cargando agentes...
            </span>
          </div>
        ) : agents.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-neutral-300" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 mb-2">
              No hay agentes configurados
            </h3>
            <p className="text-neutral-500 max-w-md mx-auto">
              No se encontraron agentes activos en el sistema. Configura un
              nuevo agente desde el panel de administración.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-neutral-50 text-neutral-500 font-bold uppercase text-[10px] tracking-wider border-b border-neutral-200">
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Nombre</th>
                    <th className="px-6 py-4">Tipo</th>
                    <th className="px-6 py-4">Modelo</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {agents.map((agent) => (
                    <tr
                      key={agent.id}
                      className="group hover:bg-neutral-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-neutral-400 text-xs">
                        #{agent.id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-neutral-900">
                          {agent.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                            ${
                              agent.type === "extraction"
                                ? "bg-purple-50 text-purple-700 border-purple-100"
                                : "bg-blue-50 text-blue-700 border-blue-100"
                            }`}
                        >
                          {agent.type === "extraction"
                            ? "Extracción"
                            : "Aprendizaje"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-neutral-600 font-mono text-xs">
                        {agent.modelSettings?.modelName || "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border
                            ${
                              agent.status === "active"
                                ? "bg-green-50 text-green-700 border-green-100"
                                : "bg-neutral-100 text-neutral-500 border-neutral-200"
                            }`}
                        >
                          {agent.status === "active" ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                              ACTIVO
                            </>
                          ) : (
                            "INACTIVO"
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/agentes/${agent.id}`}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-neutral-600 hover:text-indigo-600 hover:bg-indigo-50 border border-neutral-200 hover:border-indigo-100 transition-all"
                        >
                          Ver Detalles
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

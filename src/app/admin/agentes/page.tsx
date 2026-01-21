"use client";

import { useState, useEffect } from "react";
import { Agent, Boletin, getAgents, getBulletins } from "@/lib/api";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  FileText,
  Loader2,
  Play,
  CheckCircle,
  Clock,
  RefreshCw,
  Database,
  Search,
} from "lucide-react";

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [documents, setDocuments] = useState<any[]>([]); // Generic documents
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // 1. Fetch Agents on Mount
  useEffect(() => {
    async function loadAgents() {
      setLoadingAgents(true);
      try {
        const agentsData = await getAgents();
        setAgents(agentsData);
        if (agentsData.length > 0) {
          setSelectedAgentId(agentsData[0].id);
        }
      } catch (error) {
        console.error("Failed to load agents:", error);
      } finally {
        setLoadingAgents(false);
      }
    }
    loadAgents();
  }, []);

  // 2. Fetch Documents when Agent Changes
  useEffect(() => {
    if (!selectedAgentId) return;

    const agent = agents.find((a) => a.id === selectedAgentId);
    if (!agent) return;

    async function loadDocuments() {
      setLoadingDocs(true);
      setDocuments([]); // Clear previous
      try {
        if (agent?.sourceCollection === "boletines") {
          const res = await getBulletins({
            limit: 20,
            sort: "-fecha_publicacion",
          });
          setDocuments(res.docs);
        } else {
          // Placeholder for other collections if implemented
          console.warn(
            `Collection ${agent?.sourceCollection} not implemented yet.`,
          );
          setDocuments([]);
        }
      } catch (error) {
        console.error("Failed to fetch documents", error);
      } finally {
        setLoadingDocs(false);
      }
    }

    loadDocuments();
  }, [selectedAgentId, agents]);

  const handleProcess = async (docId: string) => {
    if (!selectedAgentId) return;
    setProcessingId(docId);
    try {
      const res = await fetch("/api/agent-process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: selectedAgentId, bulletinId: docId }),
      });
      if (!res.ok) throw new Error("Failed");

      // Optimistic update
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === docId ? { ...d, status_procesamiento: "ai_enhanced" } : d,
        ),
      );
    } catch (error) {
      console.error(error);
      alert("Error al procesar el documento.");
    } finally {
      setProcessingId(null);
    }
  };

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  if (loadingAgents) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            Agentes de IA
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Gestión y orquestación de agentes inteligentes
          </p>
        </div>
        <Link
          href="/boletines"
          className="flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Link>
      </div>

      {/* Agent Selector */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 mb-8 shadow-sm">
        <label className="flex items-center gap-2 text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4">
          <Bot className="w-4 h-4" />
          Agente Activo
        </label>

        {agents.length === 0 ? (
          <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-lg text-center">
            <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Bot className="w-6 h-6 text-neutral-400" />
            </div>
            <p className="font-medium text-neutral-900">
              No se encontraron agentes
            </p>
            <p className="text-sm text-neutral-500 mb-4">
              Debes crear un agente para comenzar.
            </p>
            <a
              href="http://localhost:3000/admin/collections/agents"
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-all"
            >
              Ir a Payload Admin
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgentId(agent.id)}
                  className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-200 ${
                    selectedAgentId === agent.id
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200"
                      : "bg-white border-neutral-200 text-neutral-600 hover:border-indigo-300 hover:shadow-sm"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${agent.status === "active" ? "bg-green-400" : "bg-neutral-300"}`}
                  />
                  <span className="font-medium text-sm">{agent.name}</span>
                </button>
              ))}
            </div>

            {selectedAgent && (
              <div className="flex items-center gap-6 pt-4 border-t border-neutral-100">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-neutral-400">Fuente:</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-700 font-medium capitalize">
                    <Database className="w-3.5 h-3.5" />
                    {selectedAgent.sourceCollection}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-neutral-400">Modelo:</span>
                  <code className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-mono text-xs font-bold border border-indigo-100">
                    {selectedAgent.modelSettings?.modelName || "llama3"}
                  </code>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Documents Table */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm min-h-[300px]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-neutral-900 text-sm uppercase tracking-wide">
              Archivos Pendientes ({selectedAgent?.sourceCollection || "..."})
            </h2>
            {loadingDocs && (
              <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
            )}
          </div>
          <button
            onClick={() => {
              // Trigger re-fetch logic
              const current = selectedAgentId;
              setSelectedAgentId("");
              setTimeout(() => setSelectedAgentId(current), 10);
            }}
            className="p-2 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-white hover:shadow-sm transition-all"
            title="Recargar datos"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {documents.length === 0 && !loadingDocs ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-neutral-300" />
            </div>
            <p className="text-neutral-500 font-medium">
              No hay archivos para procesar en esta colección.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white text-neutral-400 text-[10px] font-bold uppercase tracking-wider border-b border-neutral-100">
                <tr>
                  <th className="px-6 py-4 text-left">Documento</th>
                  <th className="px-6 py-4 text-left">Referencia</th>
                  <th className="px-6 py-4 text-left">Estado</th>
                  <th className="px-6 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {documents.map((doc) => (
                  <tr
                    key={doc.id}
                    className="group hover:bg-neutral-50/80 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-neutral-900">
                            {selectedAgent?.sourceCollection === "boletines"
                              ? `Boletín Oficial ${doc.numero}`
                              : `Documento ${doc.id.substring(0, 8)}`}
                          </div>
                          <div className="text-xs text-neutral-400 font-mono mt-0.5">
                            ID: {doc.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-neutral-600">
                      {selectedAgent?.sourceCollection === "boletines" ? (
                        <span className="flex flex-col">
                          <span>
                            {new Date(doc.fecha_publicacion).toLocaleDateString(
                              "es-AR",
                            )}
                          </span>
                          <span className="text-xs text-neutral-400">
                            Edición {doc.año_edicion}
                          </span>
                        </span>
                      ) : (
                        <span className="text-neutral-400 italic">--</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {doc.status_procesamiento === "ai_enhanced" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100">
                          <CheckCircle className="w-3.5 h-3.5" /> IA ENHANCED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-neutral-100 text-neutral-500 border border-neutral-200">
                          <Clock className="w-3.5 h-3.5" /> PENDIENTE
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {doc.status_procesamiento === "ai_enhanced" ? (
                        <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
                          Completado
                        </span>
                      ) : (
                        <button
                          onClick={() => handleProcess(doc.id)}
                          disabled={processingId === doc.id || !selectedAgentId}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all active:scale-95"
                        >
                          {processingId === doc.id ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />{" "}
                              Procesando...
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 fill-current" /> Procesar
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
        )}
      </div>
    </div>
  );
}

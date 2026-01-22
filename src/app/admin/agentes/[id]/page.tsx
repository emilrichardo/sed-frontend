"use client";

import { useState, useEffect } from "react";
import { Agent } from "@/lib/api";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  Eye,
  EyeOff,
  Loader2,
  Play,
  Save,
  Trash2,
  Calendar,
  FileText,
} from "lucide-react";
import { useParams } from "next/navigation";
import { EntriesTable } from "@/components/ui/EntriesTable";

export default function AgentDetailsPage() {
  const { id } = useParams();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  // Placeholder Data for EntriesTable
  const placeholderData = [
    {
      id: "101",
      title: "Boletín Oficial #3452",
      date: "2024-05-20",
      status: "Pendiente",
      size: "2.4 MB",
    },
    {
      id: "102",
      title: "Decreto Municipal #09/24",
      date: "2024-05-18",
      status: "Procesado",
      size: "1.1 MB",
    },
    {
      id: "103",
      title: "Resolución Ministerial #441",
      date: "2024-05-15",
      status: "Procesado",
      size: "850 KB",
    },
    {
      id: "104",
      title: "Anexo Estadístico Q1",
      date: "2024-05-12",
      status: "Error",
      size: "4.7 MB",
    },
    {
      id: "105",
      title: "Boletín Oficial #3451",
      date: "2024-05-10",
      status: "Pendiente",
      size: "2.3 MB",
    },
    {
      id: "106",
      title: "Circular Administrativa #02",
      date: "2024-05-08",
      status: "Procesado",
      size: "120 KB",
    },
    {
      id: "107",
      title: "Informe Técnico #88",
      date: "2024-05-07",
      status: "Procesado",
      size: "1.5 MB",
    },
    {
      id: "108",
      title: "Acta de Directorio #12",
      date: "2024-05-06",
      status: "Pendiente",
      size: "3.2 MB",
    },
  ];

  const columns = [
    {
      header: "Documento",
      key: "title",
      render: (item: Record<string, any>) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-neutral-400" />
          <span className="font-bold">{item.title}</span>
        </div>
      ),
    },
    {
      header: "Fecha",
      key: "date",
      render: (item: Record<string, any>) => (
        <div className="flex items-center gap-1.5 text-neutral-500">
          <Calendar className="w-3.5 h-3.5" />
          {item.date}
        </div>
      ),
    },
    {
      header: "Estado",
      key: "status",
      render: (item: Record<string, any>) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
            item.status === "Procesado"
              ? "bg-green-50 text-green-700 border-green-100"
              : item.status === "Pendiente"
                ? "bg-amber-50 text-amber-700 border-amber-100"
                : "bg-red-50 text-red-700 border-red-100"
          }`}
        >
          {item.status.toUpperCase()}
        </span>
      ),
    },
    { header: "Tamaño", key: "size" },
  ];

  const actions = [
    {
      label: "Procesar",
      icon: Play,
      onClick: (item: Record<string, any>) => alert(`Procesando ${item.title}`),
      variant: "primary" as const,
    },
    {
      label: "Guardar",
      icon: Save,
      onClick: (item: Record<string, any>) => alert(`Guardado ${item.title}`),
    },
    {
      label: "Eliminar",
      icon: Trash2,
      onClick: (item: Record<string, any>) => alert(`Eliminado ${item.title}`),
      variant: "danger" as const,
    },
  ];

  useEffect(() => {
    if (!id) return;

    const token = localStorage.getItem("payload-token");
    fetch(`/api/agents/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data) => {
        setAgent(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50/50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-neutral-50/50 p-8 flex flex-col items-center justify-center">
        <h1 className="text-xl font-bold text-neutral-900 mb-4">
          Agente no encontrado
        </h1>
        <Link
          href="/admin/agentes"
          className="text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Volver a la lista
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50/50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center gap-4">
          <Link
            href="/admin/agentes"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 text-neutral-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm
                ${agent.type === "extraction" ? "bg-purple-600" : "bg-blue-600"}`}
            >
              <Bot className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold text-neutral-900 tracking-tight">
              {agent.name}
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Main Content Area */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-neutral-500 mb-1">
                  Estado
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border
                            ${
                              agent.status === "active"
                                ? "bg-green-50 text-green-700 border-green-100"
                                : "bg-neutral-100 text-neutral-500 border-neutral-200"
                            }`}
                >
                  {agent.status === "active" ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      ACTIVO
                    </>
                  ) : (
                    "INACTIVO"
                  )}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-neutral-500 mb-1">
                  Modelo
                </div>
                <div className="font-mono text-sm bg-neutral-100 px-2 py-1 rounded text-neutral-700">
                  {agent.modelSettings?.modelName || "N/A"}
                </div>
              </div>
            </div>
          </div>

          {/* Entries Table Section */}
          <div className="mt-8">
            <EntriesTable
              title="Entradas de Documentos"
              data={placeholderData}
              columns={columns}
              actions={actions}
              onProcessAll={() =>
                alert("Procesando todos los documentos en cola...")
              }
              maxHeight="400px"
            />
          </div>

          {/* Toggle Details Section */}
          <div className="mt-8">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              {showDetails ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              {showDetails
                ? "Ocultar detalles técnicos"
                : "Ver detalles técnicos completos"}
            </button>

            {showDetails && (
              <div className="mt-4 bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="border-b border-neutral-100 bg-neutral-50/50 px-6 py-3">
                  <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                    JSON de Configuración
                  </h3>
                </div>
                <div className="p-0 overflow-x-auto">
                  <pre className="p-6 text-xs font-mono text-neutral-700 bg-white">
                    {JSON.stringify(agent, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

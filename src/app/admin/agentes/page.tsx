"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  Bot,
  Database,
  Search,
  RefreshCw,
  X,
  Settings,
  Brain,
  ChevronRight,
  Play,
  Pause,
} from "lucide-react";
import { getAgents, Agent } from "@/lib/api";


// ── Agent card component ────────────────────────────────────────────────────

function AgentCard({ agent }: { agent: Agent }) {
  const isActive = agent.status === "active";
  const agentType = agent.type || "extraction";
  const modelName = agent.modelSettings?.modelName || "No especificado";
  const sources = agent.sources || (agent.sourceCollection ? [agent.sourceCollection] : []);

  return (
    <div className="flex flex-col rounded-xl border border-border overflow-hidden h-full bg-background hover:border-primary/50 transition-colors">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2 rounded-lg ${isActive ? "bg-emerald-50 dark:bg-emerald-950" : "bg-muted"}`}>
              <Bot className={`h-5 w-5 ${isActive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold leading-tight truncate">{agent.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                  isActive 
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" 
                    : "bg-muted text-muted-foreground"
                }`}>
                  {isActive ? "Activo" : "Inactivo"}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  ID: {agent.id}
                </span>
              </div>
            </div>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
            agentType === "learning" 
              ? "bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-950 dark:text-violet-400 dark:border-violet-800" 
              : "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800"
          }`}>
            {agentType === "learning" ? "Aprendizaje" : "Extracción"}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-4 space-y-3">
        {/* Model */}
        <div className="flex items-center gap-2 text-sm">
          <Brain className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">Modelo:</span>
          <span className="font-medium truncate">{modelName}</span>
        </div>

        {/* Sources */}
        {sources.length > 0 && (
          <div className="flex items-start gap-2 text-sm">
            <Database className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <span className="text-muted-foreground">Fuentes:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {sources.map((source) => (
                  <span 
                    key={source}
                    className="text-[10px] px-1.5 py-0.5 bg-muted rounded border border-border"
                  >
                    {source}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* System Prompt Preview */}
        {agent.systemPrompt && (
          <div className="text-sm">
            <span className="text-muted-foreground">Prompt:</span>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-3 bg-muted/50 p-2 rounded">
              {agent.systemPrompt}
            </p>
          </div>
        )}

        {/* Output Config */}
        {agent.outputConfig?.destinationCollection && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Settings className="h-3.5 w-3.5 shrink-0" />
            <span>Destino: {agent.outputConfig.destinationCollection}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border bg-muted/20">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            Actualizado: {" "}
            {new Date(agent.updatedAt).toLocaleDateString("es-AR", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
          <Link
            href={`/admin/agentes/editar?id=${agent.id}`}
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Editar
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function AdminAgentesPage() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [filterType, setFilterType] = useState<"all" | "learning" | "extraction">("all");

  const fetchAgents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAgents();
      setAgents(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchAgents();
  }, [user]);

  // Filtered agents
  const filteredAgents = useMemo(() => {
    let result = agents;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.systemPrompt && a.systemPrompt.toLowerCase().includes(q)) ||
          (a.modelSettings?.modelName && a.modelSettings.modelName.toLowerCase().includes(q))
      );
    }

    if (filterStatus !== "all") {
      result = result.filter((a) => a.status === filterStatus);
    }

    if (filterType !== "all") {
      result = result.filter((a) => (a.type || "extraction") === filterType);
    }

    return result;
  }, [agents, search, filterStatus, filterType]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: agents.length,
      active: agents.filter((a) => a.status === "active").length,
      inactive: agents.filter((a) => a.status === "inactive").length,
      learning: agents.filter((a) => a.type === "learning").length,
      extraction: agents.filter((a) => !a.type || a.type === "extraction").length,
    };
  }, [agents]);

  // Not authenticated
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <h2 className="text-2xl font-bold">Acceso Denegado</h2>
        <p className="text-muted-foreground">
          Debes iniciar sesión para ver esta página.
        </p>
        <Link href="/" className="text-primary hover:underline">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 font-sans">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <Bot className="h-8 w-8 text-primary" />
            Agentes
          </h1>
          <p className="text-muted-foreground">
            Gestiona los agentes de IA para procesamiento y aprendizaje.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAgents}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg font-medium hover:bg-accent transition-colors text-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Recargar
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg font-medium hover:bg-accent transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Inicio
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="p-3 rounded-lg border border-border bg-muted/20">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </div>
        <div className="p-3 rounded-lg border border-border bg-emerald-50/50 dark:bg-emerald-950/20">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.active}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Play className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            Activos
          </div>
        </div>
        <div className="p-3 rounded-lg border border-border bg-muted/20">
          <div className="text-2xl font-bold">{stats.inactive}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Pause className="h-3 w-3" />
            Inactivos
          </div>
        </div>
        <div className="p-3 rounded-lg border border-border bg-violet-50/50 dark:bg-violet-950/20">
          <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">{stats.learning}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Brain className="h-3 w-3 text-violet-600 dark:text-violet-400" />
            Aprendizaje
          </div>
        </div>
        <div className="p-3 rounded-lg border border-border bg-blue-50/50 dark:bg-blue-950/20">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.extraction}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Settings className="h-3 w-3 text-blue-600 dark:text-blue-400" />
            Extracción
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex flex-col lg:flex-row items-start lg:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full lg:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar agentes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground mr-1">Estado:</span>
          {(["all", "active", "inactive"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                filterStatus === status
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {status === "all" ? "Todos" : status === "active" ? "Activos" : "Inactivos"}
            </button>
          ))}
        </div>

        {/* Type filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground mr-1">Tipo:</span>
          {(["all", "learning", "extraction"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                filterType === type
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {type === "all" ? "Todos" : type === "learning" ? "Aprendizaje" : "Extracción"}
            </button>
          ))}
        </div>
      </div>

      {/* Results bar */}
      <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground border-b border-border pb-3">
        <span>
          <span className="font-medium text-foreground">
            {filteredAgents.length}
          </span>{" "}
          agente{filteredAgents.length !== 1 ? "s" : ""}
          {(search || filterStatus !== "all" || filterType !== "all") && " encontrados"}
        </span>
        {(search || filterStatus !== "all" || filterType !== "all") && (
          <button
            onClick={() => {
              setSearch("");
              setFilterStatus("all");
              setFilterType("all");
            }}
            className="flex items-center gap-1 text-primary hover:underline"
          >
            <X className="h-3 w-3" />
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Cargando agentes...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <div>
            <h3 className="text-lg font-bold mb-1">Error al cargar</h3>
            <p className="text-muted-foreground text-sm">{error}</p>
          </div>
          <button
            onClick={fetchAgents}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-all"
          >
            Reintentar
          </button>
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-xl">
          <Bot className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">
            {search || filterStatus !== "all" || filterType !== "all"
              ? "No hay agentes que coincidan con los filtros."
              : "No hay agentes registrados."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}

    </div>
  );
}

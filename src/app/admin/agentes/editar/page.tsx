"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  Bot,
  Save,
  CheckCircle,
  Plus,
  X,
  Trash2,
} from "lucide-react";
import { getAgent, updateAgent, Agent } from "@/lib/api";

// ── Form state ────────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  status: "active" | "inactive";
  type: "learning" | "extraction";
  systemPrompt: string;
  sources: string[];
  destinationCollection: string;
  statusField: string;
  modelName: string;
  temperature: string;
  apiKey: string;
}

function agentToForm(agent: Agent): FormState {
  return {
    name: agent.name ?? "",
    status: agent.status ?? "inactive",
    type: agent.type ?? "extraction",
    systemPrompt: agent.systemPrompt ?? "",
    sources: agent.sources ?? [],
    destinationCollection: agent.outputConfig?.destinationCollection ?? "",
    statusField: agent.outputConfig?.statusField ?? "",
    modelName: agent.modelSettings?.modelName ?? "",
    temperature: agent.modelSettings?.temperature?.toString() ?? "0.7",
    apiKey: agent.modelSettings?.apiKey ?? "",
  };
}

function formToPayload(
  form: FormState,
): Partial<Omit<Agent, "id" | "createdAt" | "updatedAt">> {
  return {
    name: form.name,
    status: form.status,
    type: form.type,
    systemPrompt: form.systemPrompt || undefined,
    sources: form.sources.filter(Boolean),
    outputConfig: {
      destinationCollection: form.destinationCollection || undefined,
      statusField: form.statusField || undefined,
    },
    modelSettings: {
      modelName: form.modelName,
      temperature: parseFloat(form.temperature) || 0.7,
      apiKey: form.apiKey || undefined,
    },
  };
}

// ── UI helpers ────────────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1.5">{label}</label>
      {hint && <p className="text-xs text-muted-foreground mb-2">{hint}</p>}
      {children}
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all";

function SourcesEditor({
  sources,
  onChange,
}: {
  sources: string[];
  onChange: (s: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const val = draft.trim();
    if (val && !sources.includes(val)) onChange([...sources, val]);
    setDraft("");
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {sources.map((s) => (
          <span
            key={s}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted border border-border text-xs font-medium"
          >
            {s}
            <button
              type="button"
              onClick={() => onChange(sources.filter((x) => x !== s))}
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {sources.length === 0 && (
          <span className="text-xs text-muted-foreground italic">
            Sin fuentes configuradas
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="ej. boletines, publicaciones…"
          className={inputCls}
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim()}
          className="flex items-center gap-1 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
          Agregar
        </button>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-3 border-b border-border bg-muted/30">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          {title}
        </h2>
      </div>
      <div className="p-5 space-y-5">{children}</div>
    </div>
  );
}

// ── Inner component (needs useSearchParams inside Suspense) ───────────────────

function AgentEditForm() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const { user } = useAuth();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setError("ID de agente no especificado.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const data = await getAgent(id);
    if (!data) {
      setError("No se encontró el agente.");
    } else {
      setAgent(data);
      setForm(agentToForm(data));
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const set =
    (field: keyof FormState) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setForm((prev) => prev && { ...prev, [field]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !id) return;
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const updated = await updateAgent(id, formToPayload(form));
      setAgent(updated);
      setForm(agentToForm(updated));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Cargando agente…</p>
      </div>
    );
  }

  if (error || !agent || !form) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <AlertCircle className="w-10 h-10 text-destructive" />
        <p className="text-muted-foreground">{error ?? "Error desconocido"}</p>
        <Link href="/admin/agentes" className="text-primary hover:underline text-sm">
          Volver a Agentes
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 font-sans">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4 pb-6 border-b border-border">
        <Link
          href="/admin/agentes"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Agentes
        </Link>
        <span className="text-muted-foreground">/</span>
        <div className="flex items-center gap-2 min-w-0">
          <Bot className="h-5 w-5 text-primary shrink-0" />
          <h1 className="text-xl font-bold truncate">{agent.name}</h1>
        </div>
        <span className="ml-auto text-[10px] font-mono text-muted-foreground shrink-0">
          #{agent.id}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Section title="General">
          <Field label="Nombre">
            <input
              value={form.name}
              onChange={set("name")}
              required
              className={inputCls}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Estado">
              <select value={form.status} onChange={set("status")} className={inputCls}>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </Field>
            <Field label="Tipo">
              <select value={form.type} onChange={set("type")} className={inputCls}>
                <option value="extraction">Extracción</option>
                <option value="learning">Aprendizaje</option>
              </select>
            </Field>
          </div>
        </Section>

        <Section title="System Prompt">
          <Field
            label="Prompt del sistema"
            hint="Instrucciones que definen el comportamiento del agente."
          >
            <textarea
              value={form.systemPrompt}
              onChange={set("systemPrompt")}
              rows={10}
              className={`${inputCls} resize-y font-mono text-xs leading-relaxed`}
            />
          </Field>
        </Section>

        <Section title="Fuentes y Salida">
          <Field
            label="Fuentes (colecciones)"
            hint="Slugs de colecciones de Payload de las que el agente consume datos."
          >
            <SourcesEditor
              sources={form.sources}
              onChange={(s) => setForm((prev) => prev && { ...prev, sources: s })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Colección de destino" hint="Colección donde el agente escribe resultados.">
              <input
                value={form.destinationCollection}
                onChange={set("destinationCollection")}
                placeholder="ej. publicaciones"
                className={inputCls}
              />
            </Field>
            <Field label="Campo de estado" hint="Campo que el agente actualiza para marcar el estado.">
              <input
                value={form.statusField}
                onChange={set("statusField")}
                placeholder="ej. status"
                className={inputCls}
              />
            </Field>
          </div>
        </Section>

        <Section title="Configuración del modelo">
          <Field label="Nombre del modelo">
            <input
              value={form.modelName}
              onChange={set("modelName")}
              placeholder="ej. gemini-2.0-flash"
              className={inputCls}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Temperatura" hint="Valor entre 0 (determinista) y 2 (creativo).">
              <input
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={form.temperature}
                onChange={set("temperature")}
                className={inputCls}
              />
            </Field>
            <Field label="API Key" hint="Dejar vacío para usar la clave global.">
              <input
                type="password"
                value={form.apiKey}
                onChange={set("apiKey")}
                placeholder="sk-…"
                className={inputCls}
              />
            </Field>
          </div>
        </Section>

        <div className="flex items-center justify-between pt-2">
          <Link
            href="/admin/agentes"
            className="flex items-center gap-1.5 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Cancelar
          </Link>
          <div className="flex items-center gap-3">
            {saveError && <p className="text-sm text-destructive">{saveError}</p>}
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="h-4 w-4" />
                Guardado
              </span>
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ── Page export ───────────────────────────────────────────────────────────────
// useSearchParams requires Suspense in static export mode.

export default function AgentEditPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <AgentEditForm />
    </Suspense>
  );
}

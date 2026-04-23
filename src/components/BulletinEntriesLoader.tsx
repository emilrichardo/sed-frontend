"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  getActosAdministrativos,
  ActoAdministrativo,
  updateBoletin,
  Boletin,
} from "@/lib/api";
import { Loader2, AlertCircle, Newspaper, Pencil, Check, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const BulletinPdfPreview = dynamic(() => import("./BulletinPdfPreview"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center rounded-lg border bg-muted/10 h-[75vh] text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin mr-2" />
      <span className="text-sm">Cargando PDF...</span>
    </div>
  ),
});

interface BulletinEntriesLoaderProps {
  bulletin: Boletin;
  /** Pre-resolved PDF URL from the server component (hostname rewritten if PDF_HOST_OVERRIDE is set) */
  resolvedPdfUrl?: string | null;
}

function getPdfUrl(bulletin: Boletin): string | null {
  if (!bulletin.archivo_binario) return null;
  if (typeof bulletin.archivo_binario === "string") return null;
  const media = bulletin.archivo_binario as { url?: string; filename?: string };
  return media.url ?? null;
}

export default function BulletinEntriesLoader({
  bulletin,
  resolvedPdfUrl,
}: BulletinEntriesLoaderProps) {
  const [entries, setEntries] = useState<ActoAdministrativo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<{total: number, publicados: number, borradores: number} | null>(null);
  const { user, isEditing } = useAuth();

  const [isEditingTitulo, setIsEditingTitulo] = useState(false);
  const [tituloValue, setTituloValue] = useState(bulletin.titulo_periodistico || "");
  const [isSavingTitulo, setIsSavingTitulo] = useState(false);

  const [isEditingResumen, setIsEditingResumen] = useState(false);
  const [resumenValue, setResumenValue] = useState(bulletin.resumen || "");
  const [isSavingResumen, setIsSavingResumen] = useState(false);

  const saveTitulo = async () => {
    setIsSavingTitulo(true);
    try {
      await updateBoletin(bulletin.id, { titulo_periodistico: tituloValue.trim() });
      setIsEditingTitulo(false);
    } catch (e) {
      console.error("Failed to update titulo:", e);
    } finally {
      setIsSavingTitulo(false);
    }
  };

  const saveResumen = async () => {
    setIsSavingResumen(true);
    try {
      await updateBoletin(bulletin.id, { resumen: resumenValue.trim() });
      setIsEditingResumen(false);
    } catch (e) {
      console.error("Failed to update resumen:", e);
    } finally {
      setIsSavingResumen(false);
    }
  };
  // Prefer server-resolved URL (has PDF_HOST_OVERRIDE applied); fall back to client-computed
  const pdfUrl = resolvedPdfUrl ?? getPdfUrl(bulletin);

  useEffect(() => {
    async function loadEntries() {
      setLoading(true);
      setError(null);
      try {
        const data = await getActosAdministrativos({
          where: { boletin: bulletin.id },
          limit: 100,
          sort: "-createdAt",
          showDrafts: !!user,
        });

        const sortedDocs = data.docs.sort((a, b) => {
          if (a.destacado === b.destacado) return 0;
          return a.destacado ? -1 : 1;
        });

        setEntries(sortedDocs);

        if (
          user &&
          sortedDocs.length > 0 &&
          (bulletin.cant_actos === 0 ||
            bulletin.cant_actos !== sortedDocs.length)
        ) {
          // Use updateBoletin (BFF /api/cms route) instead of updateBulletin (apiFetch)
          // to avoid cross-origin auth issues that would dispatch auth:unauthorized
          updateBoletin(String(bulletin.id), {
            cant_actos: sortedDocs.length,
          }).catch(() => {});
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Error al cargar los actos administrativos";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    if (bulletin.id) {
      loadEntries();
    }
  }, [bulletin, user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-2" />
        <span>Cargando actos administrativos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 border rounded-lg border-destructive/50 bg-destructive/10 text-destructive">
        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
        <p className="font-bold tracking-tight">Error al cargar actos</p>
        <p className="text-sm opacity-80 font-mono">{error}</p>
      </div>
    );
  }

  if (entries.length === 0 && !pdfUrl) {
    return (
      <div className="text-center py-12 border border-dashed rounded-lg bg-muted/30">
        <p className="text-muted-foreground font-medium uppercase text-sm">
          No hay actos registrados para este boletín.
        </p>
        {debugInfo && debugInfo.borradores > 0 && !user && (
          <p className="text-amber-600 text-sm mt-2">
            ⚠️ Hay {debugInfo.borradores} acto(s) en borrador. 
            <a href="/login" className="underline">Iniciá sesión</a> para verlos.
          </p>
        )}
      </div>
    );
  }

  // Priority score for sorting
  const priority = (act: ActoAdministrativo) => {
    if (act.destacado) return 4;
    if (act.opacidad_categoria === "alta") return 3;
    if (act.es_relevante) return 2;
    if (act.titulo_periodistico || act.resumen) return 1;
    return 0;
  };

  const sorted = [...entries].sort((a, b) => priority(b) - priority(a));
  const featured = sorted.filter((a) => priority(a) >= 2); // destacado + alta + relevante
  const notable = user ? sorted.filter((a) => priority(a) === 1) : []; // título/resumen: solo con login
  const minor = user ? sorted.filter((a) => priority(a) === 0) : [];   // sin contenido: solo con login

  const hasJournalistContent =
    featured.length > 0 ||
    notable.length > 0 ||
    !!bulletin.titulo_periodistico ||
    !!bulletin.resumen;

  // When no journalistic content but there is a PDF: show PDF centered full-width
  if (!hasJournalistContent && pdfUrl) {
    return <BulletinPdfPreview pdfUrl={pdfUrl} heightVh={85} />;
  }

  const opacidadBadge = (act: ActoAdministrativo) => {
    if (act.opacidad_categoria === "alta")
      return <span className="bg-red-900/60 text-red-300 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">Opacidad Alta</span>;
    if (act.opacidad_categoria === "media")
      return <span className="bg-yellow-900/60 text-yellow-300 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">Opacidad Media</span>;
    return null;
  };

  const ActCard = ({ act, prominent }: { act: ActoAdministrativo; prominent: boolean }) => {
    let slug = "";
    if (typeof act.boletin === "string") slug = act.boletin;
    else if (act.boletin && typeof act.boletin === "object") slug = act.boletin.slug || String(act.boletin.id);

    if (!prominent) {
      // Compact card for minor acts
      return (
        <Link
          href={`/boletines/${slug}/${encodeURIComponent(act.identificador_de_acto)}`}
          className="group flex items-start gap-3 py-3 border-b border-border/50 last:border-0 hover:bg-muted/20 px-2 rounded transition-colors"
        >
          <span className="text-[10px] font-mono text-muted-foreground/50 bg-muted/30 px-1.5 py-0.5 rounded mt-0.5 shrink-0">
            {act.seccion?.replace(/([A-Z])/g, " $1").trim().slice(0, 18)}
          </span>
          <span className="text-sm text-muted-foreground/70 group-hover:text-muted-foreground line-clamp-1 transition-colors">
            {act.titulo_periodistico || act.titulo || act.identificador_de_acto}
          </span>
        </Link>
      );
    }

    return (
      <Link href={`/boletines/${slug}/${encodeURIComponent(act.identificador_de_acto)}`} className="group block">
        <article
          className={cn(
            "p-6 md:p-8 border rounded-lg bg-card shadow-sm transition-all hover:shadow-md",
            act.destacado && "ring-1 ring-primary/30 bg-primary/5",
            act.opacidad_categoria === "alta" && "ring-1 ring-red-800/40 bg-red-950/10",
          )}
        >
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {act.destacado && (
                <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">Destacado</span>
              )}
              {opacidadBadge(act)}
              {act.es_relevante && !act.destacado && (
                <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-[10px] uppercase">Relevante</span>
              )}
              <span className="text-muted-foreground/50 text-[10px] uppercase tracking-wide">
                {act.seccion?.replace(/([A-Z])/g, " $1").trim()}
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-heading font-bold leading-tight group-hover:text-primary transition-colors">
              {act.titulo_periodistico || act.identificador_de_acto}
            </h2>

            {act.resumen && (
              <p className="text-base text-muted-foreground line-clamp-3 leading-relaxed">
                {act.resumen}
              </p>
            )}

            {(act.organismo || act.monto) && (
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground/70 pt-1">
                {act.organismo && <span>📌 {act.organismo}</span>}
                {act.monto && (
                  <span className="font-mono font-bold text-foreground/80">
                    $ {act.monto.toLocaleString("es-AR")}
                  </span>
                )}
              </div>
            )}

            <div className="text-sm font-medium text-primary flex items-center gap-1 pt-1">
              Leer análisis completo
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>
        </article>
      </Link>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* Left: Journalistic acts */}
      <div className="w-full lg:flex-1 space-y-6">
        {/* Aviso procesamiento IA */}
        <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 rounded-lg px-4 py-3.5">
          <span className="shrink-0 text-xl mt-0.5">🤖</span>
          <div>
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-0.5">Procesado con inteligencia artificial</p>
            <p className="text-sm text-blue-700/80 dark:text-blue-200/70 leading-relaxed">
              Las versiones periodísticas de los actos administrativos son generadas de manera automática con IA. El contenido puede contener errores o inexactitudes.
            </p>
          </div>
        </div>

        {/* Título del boletín */}
        {(tituloValue || isEditing) && (
          isEditing && isEditingTitulo ? (
            <div className="flex flex-col gap-2">
              <textarea
                className="w-full text-3xl font-heading font-bold bg-muted border rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary leading-tight"
                rows={2}
                value={tituloValue}
                onChange={(e) => setTituloValue(e.target.value)}
                placeholder="Título periodístico del boletín..."
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={saveTitulo} disabled={isSavingTitulo} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded hover:opacity-90 disabled:opacity-50">
                  <Check className="h-3 w-3" />{isSavingTitulo ? "Guardando..." : "Guardar"}
                </button>
                <button onClick={() => { setTituloValue(bulletin.titulo_periodistico || ""); setIsEditingTitulo(false); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-muted text-foreground text-xs font-bold rounded hover:bg-muted/80">
                  <X className="h-3 w-3" />Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              {tituloValue ? (
                <h1 className="text-3xl md:text-4xl font-heading font-bold leading-tight flex-1">{tituloValue}</h1>
              ) : (
                <p className="text-base text-muted-foreground/50 italic flex-1">Sin título — clic en el lápiz para agregar</p>
              )}
              {isEditing && (
                <button onClick={() => setIsEditingTitulo(true)} className="mt-1 p-1.5 rounded hover:bg-muted border border-dashed border-muted-foreground/40 shrink-0" title="Editar título">
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
          )
        )}

        {/* Resumen del boletín */}
        {(resumenValue || isEditing) && (
          isEditing && isEditingResumen ? (
            <div className="flex flex-col gap-2">
              <textarea
                className="w-full text-base bg-muted border rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed"
                rows={4}
                value={resumenValue}
                onChange={(e) => setResumenValue(e.target.value)}
                placeholder="Resumen del boletín..."
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={saveResumen} disabled={isSavingResumen} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded hover:opacity-90 disabled:opacity-50">
                  <Check className="h-3 w-3" />{isSavingResumen ? "Guardando..." : "Guardar"}
                </button>
                <button onClick={() => { setResumenValue(bulletin.resumen || ""); setIsEditingResumen(false); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-muted text-foreground text-xs font-bold rounded hover:bg-muted/80">
                  <X className="h-3 w-3" />Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              {resumenValue ? (
                <p className="text-base text-muted-foreground leading-relaxed flex-1">{resumenValue}</p>
              ) : (
                <p className="text-base text-muted-foreground/50 italic flex-1">Sin resumen — clic en el lápiz para agregar</p>
              )}
              {isEditing && (
                <button onClick={() => setIsEditingResumen(true)} className="mt-1 p-1.5 rounded hover:bg-muted border border-dashed border-muted-foreground/40 shrink-0" title="Editar resumen">
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
          )
        )}

        <div className="flex items-center gap-2 pt-2">
          <Newspaper className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-2xl font-heading font-bold tracking-tight">
            Versión Periodística
          </h2>
        </div>

        {/* Banner informativo si hay actos en borrador */}
        {debugInfo && debugInfo.borradores > 0 && !user && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            <span className="font-medium">⚠️ Hay {debugInfo.borradores} acto(s) en borrador.</span>{" "}
            <a href="/login" className="underline font-medium">Iniciá sesión</a> para verlos y publicarlos.
          </div>
        )}

        {/* Featured / Relevant acts — full cards */}
        {featured.length > 0 && (
          <div className="grid grid-cols-1 gap-5">
            {featured.map((act) => <ActCard key={act.id} act={act} prominent />)}
          </div>
        )}

        {/* Notable acts — full cards but smaller visual weight */}
        {notable.length > 0 && (
          <div className="grid grid-cols-1 gap-4">
            {notable.map((act) => <ActCard key={act.id} act={act} prominent />)}
          </div>
        )}

        {/* Minor acts — compact list */}
        {minor.length > 0 && (
          <div className="mt-6">
            <p className="text-xs text-muted-foreground/50 uppercase tracking-widest font-semibold mb-2 px-2">
              Otros actos ({minor.length})
            </p>
            <div className="border rounded-lg divide-y divide-border/30 bg-muted/5">
              {minor.map((act) => <ActCard key={act.id} act={act} prominent={false} />)}
            </div>
          </div>
        )}
      </div>

      {/* Right: PDF preview (react-pdf — works on mobile) */}
      {pdfUrl && (
        <aside className="w-full lg:w-[42%] lg:sticky lg:top-4">
          <BulletinPdfPreview pdfUrl={pdfUrl} heightVh={75} />
        </aside>
      )}
    </div>
  );
}

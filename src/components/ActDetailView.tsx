"use client";

import Link from "next/link";
import {
  ChevronLeft,
  Building2,
  Star,
  PenTool,
  Info,
  Eye,
  EyeOff,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { ActoAdministrativo, updateActoAdministrativo } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ProcessingButton } from "@/components/ProcessingButton";

interface ActDetailViewProps {
  entry: ActoAdministrativo;
  backLink: string;
}

export function ActDetailView({ entry, backLink }: ActDetailViewProps) {
  const { isEditing } = useAuth();
  const [isDestacado, setIsDestacado] = useState(entry.destacado || false);
  const [status, setStatus] = useState<"publicado" | "borrador">(
    entry.status === "publicado" ? "publicado" : "borrador",
  );
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(
    entry.titulo_periodistico || entry.titulo || "",
  );
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [isEditingResumen, setIsEditingResumen] = useState(false);
  const [resumenValue, setResumenValue] = useState(entry.resumen || "");
  const [isSavingResumen, setIsSavingResumen] = useState(false);
  const [isEditingNota, setIsEditingNota] = useState(false);
  const [notaValue, setNotaValue] = useState(entry.nota_periodistica || "");
  const [isSavingNota, setIsSavingNota] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSavingStatus, setIsSavingStatus] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const toggleDestacado = async () => {
    const newState = !isDestacado;
    setIsDestacado(newState); // Optimistic
    try {
      await updateActoAdministrativo(entry.id, { destacado: newState });
    } catch (error) {
      console.error("Failed to update destacado:", error);
      setIsDestacado(!newState); // Revert
    }
  };

  const toggleStatus = async () => {
    if (!entry.id) {
      setSaveError("Error: ID del acto no encontrado");
      return;
    }
    
    const newStatus = status === "publicado" ? "borrador" : "publicado";
    setSaveError(null);
    setIsSavingStatus(true);
    setStatus(newStatus); // Optimistic
    
    try {
      console.log(`[toggleStatus] Actualizando acto ${entry.id} a estado: ${newStatus}`);
      const result = await updateActoAdministrativo(entry.id, { status: newStatus });
      console.log("[toggleStatus] Actualización exitosa:", result);
    } catch (error) {
      console.error("[toggleStatus] Error al actualizar:", error);
      setSaveError(error instanceof Error ? error.message : "Error al guardar el estado");
      setStatus(status); // Revert
    } finally {
      setIsSavingStatus(false);
    }
  };

  const saveTitle = async () => {
    if (!titleValue.trim()) return;
    setIsSavingTitle(true);
    try {
      await updateActoAdministrativo(entry.id, {
        titulo_periodistico: titleValue.trim(),
      });
      setIsEditingTitle(false);
    } catch (error) {
      console.error("Failed to update title:", error);
    } finally {
      setIsSavingTitle(false);
    }
  };

  const cancelEditTitle = () => {
    setTitleValue(entry.titulo_periodistico || entry.titulo || "");
    setIsEditingTitle(false);
  };

  const saveResumen = async () => {
    setIsSavingResumen(true);
    try {
      await updateActoAdministrativo(entry.id, { resumen: resumenValue.trim() });
      setIsEditingResumen(false);
    } catch (error) {
      console.error("Failed to update resumen:", error);
    } finally {
      setIsSavingResumen(false);
    }
  };

  const cancelEditResumen = () => {
    setResumenValue(entry.resumen || "");
    setIsEditingResumen(false);
  };

  const saveNota = async () => {
    setIsSavingNota(true);
    try {
      await updateActoAdministrativo(entry.id, { nota_periodistica: notaValue.trim() });
      setIsEditingNota(false);
    } catch (error) {
      console.error("Failed to update nota_periodistica:", error);
    } finally {
      setIsSavingNota(false);
    }
  };

  const cancelEditNota = () => {
    setNotaValue(entry.nota_periodistica || "");
    setIsEditingNota(false);
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in duration-500">
      <div className="mb-6">
        <Link
          href={backLink}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver al Boletín
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Main Content Column */}
        <div className="lg:col-span-8 space-y-10">
          {/* Header Section */}
          <section className="space-y-6">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-4 w-full">
                {/* Journalistic Title or Fallback */}
                {isEditing && isEditingTitle ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      className="w-full text-2xl font-extrabold tracking-tight bg-muted border rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                      rows={3}
                      value={titleValue}
                      onChange={(e) => setTitleValue(e.target.value)}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={saveTitle}
                        disabled={isSavingTitle}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded hover:opacity-90 disabled:opacity-50"
                      >
                        <Check className="h-3 w-3" />
                        {isSavingTitle ? "Guardando..." : "Guardar"}
                      </button>
                      <button
                        onClick={cancelEditTitle}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-muted text-foreground text-xs font-bold rounded hover:bg-muted/80"
                      >
                        <X className="h-3 w-3" />
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
                      {titleValue || "Acto Administrativo"}
                    </h1>
                    {isEditing && (
                      <button
                        onClick={() => setIsEditingTitle(true)}
                        className="mt-2 p-1.5 rounded hover:bg-muted border border-dashed border-muted-foreground/40"
                        title="Editar título"
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                )}

                {/* Tags row */}
                <div className="flex flex-wrap gap-2">
                  <span className="px-2.5 py-0.5 bg-primary text-primary-foreground text-xs font-bold border border-primary uppercase tracking-normal">
                    {entry.seccion}
                  </span>
                  {entry.tipo_de_acto && (
                    <span className="px-2.5 py-0.5 bg-muted text-muted-foreground text-xs font-bold border border-transparent uppercase tracking-normal">
                      {typeof entry.tipo_de_acto === "object"
                        ? entry.tipo_de_acto.nombre
                        : "Acto"}
                    </span>
                  )}
                  {isEditing && (
                    <button
                      onClick={toggleDestacado}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-0.5 border text-xs font-bold transition-all hover:bg-muted hover:text-foreground uppercase tracking-normal rounded-full",
                        isDestacado
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground",
                      )}
                    >
                      <Star
                        className={cn("h-3 w-3", isDestacado && "fill-current")}
                      />
                      {isDestacado ? "Destacado" : "Destacar"}
                    </button>
                  )}
                  {isEditing ? (
                    <button
                      onClick={toggleStatus}
                      disabled={isSavingStatus}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-0.5 border text-xs font-bold transition-all uppercase tracking-normal rounded-full disabled:opacity-50",
                        status === "publicado"
                          ? "bg-green-600 text-white border-green-600 hover:bg-green-700"
                          : "bg-yellow-500 text-white border-yellow-500 hover:bg-yellow-600",
                      )}
                      title={
                        status === "publicado"
                          ? "Clic para despublicar"
                          : "Clic para publicar"
                      }
                    >
                      {isSavingStatus ? (
                        <>
                          <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                          Guardando...
                        </>
                      ) : status === "publicado" ? (
                        <Eye className="h-3 w-3" />
                      ) : (
                        <EyeOff className="h-3 w-3" />
                      )}
                      {!isSavingStatus && (status === "publicado" ? "Publicado" : "Borrador")}
                    </button>
                  ) : (
                    status !== "publicado" && (
                      <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-yellow-100 text-yellow-800 border border-yellow-300 text-xs font-bold uppercase tracking-normal rounded-full">
                        <EyeOff className="h-3 w-3" />
                        Borrador
                      </span>
                    )
                  )}
                  {isEditing && (
                    <div className="ml-2">
                      <ProcessingButton
                        relationTo="actos-administrativos"
                        relatedId={entry.id}
                        existingProcessingId={
                          entry.procesamiento_asociado &&
                          entry.procesamiento_asociado.length > 0
                            ? typeof entry.procesamiento_asociado[0] ===
                              "string"
                              ? entry.procesamiento_asociado[0]
                              : entry.procesamiento_asociado[0].id
                            : undefined
                        }
                        hasExistingResults={
                          !!entry.cuerpo ||
                          entry.status_procesamiento === "completado"
                        }
                        className="h-7 text-xs px-3"
                      />
                    </div>
                  )}
                </div>
                {saveError && (
                  <div className="text-red-500 text-xs mt-2 bg-red-50 px-3 py-2 rounded border border-red-200">
                    ⚠️ {saveError}
                  </div>
                )}
              </div>
            </div>

            {/* Resume / Summary */}
            {isEditing ? (
              isEditingResumen ? (
                <div className="flex flex-col gap-2 border-l-4 border-primary/20 pl-4">
                  <textarea
                    className="w-full text-base bg-muted border rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed"
                    rows={4}
                    value={resumenValue}
                    onChange={(e) => setResumenValue(e.target.value)}
                    placeholder="Ingresá el resumen del acto..."
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={saveResumen}
                      disabled={isSavingResumen}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded hover:opacity-90 disabled:opacity-50"
                    >
                      <Check className="h-3 w-3" />
                      {isSavingResumen ? "Guardando..." : "Guardar"}
                    </button>
                    <button
                      onClick={cancelEditResumen}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-muted text-foreground text-xs font-bold rounded hover:bg-muted/80"
                    >
                      <X className="h-3 w-3" />
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 border-l-4 border-primary/20 pl-4 py-1">
                  {resumenValue ? (
                    <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed font-sans flex-1">
                      {resumenValue}
                    </p>
                  ) : (
                    <p className="text-base text-muted-foreground/50 italic flex-1">
                      Sin resumen — clic para agregar
                    </p>
                  )}
                  <button
                    onClick={() => setIsEditingResumen(true)}
                    className="mt-1 p-1.5 rounded hover:bg-muted border border-dashed border-muted-foreground/40 shrink-0"
                    title="Editar resumen"
                  >
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              )
            ) : (
              entry.resumen && (
                <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed font-sans border-l-4 border-primary/20 pl-4 py-1">
                  {entry.resumen}
                </p>
              )
            )}
          </section>

          {/* Journalistic Note */}
          {(entry.nota_periodistica || isEditing) && (
            <section className="bg-muted p-6">
              <h3 className="text-lg font-bold flex items-center gap-2 text-foreground mb-4 uppercase tracking-tight border-b pb-2">
                <PenTool className="h-5 w-5" />
                Análisis Periodístico
                {isEditing && !isEditingNota && (
                  <button
                    onClick={() => setIsEditingNota(true)}
                    className="ml-auto p-1.5 rounded hover:bg-muted border border-dashed border-muted-foreground/40"
                    title="Editar análisis periodístico"
                  >
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </h3>
              {isEditing && isEditingNota ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    className="w-full text-sm bg-background border rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed font-sans"
                    rows={8}
                    value={notaValue}
                    onChange={(e) => setNotaValue(e.target.value)}
                    placeholder="Ingresá el análisis periodístico..."
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={saveNota}
                      disabled={isSavingNota}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded hover:opacity-90 disabled:opacity-50"
                    >
                      <Check className="h-3 w-3" />
                      {isSavingNota ? "Guardando..." : "Guardar"}
                    </button>
                    <button
                      onClick={cancelEditNota}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-muted text-foreground text-xs font-bold rounded hover:bg-muted/80"
                    >
                      <X className="h-3 w-3" />
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : notaValue ? (
                <div className="prose prose-neutral dark:prose-invert max-w-none font-sans leading-relaxed text-sm">
                  <div className="whitespace-pre-wrap">{notaValue}</div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground/50 italic">Sin análisis — clic en el lápiz para agregar</p>
              )}
            </section>
          )}

        </div>

        {/* Sidebar Column */}
        <aside className="lg:col-span-4 space-y-8">
          {/* Metadata Card */}
          <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
            <div className="bg-muted/30 px-4 py-3 border-b flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm uppercase tracking-normal">
                Información del Acto
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-normal text-muted-foreground font-bold block mb-1">
                  Identificador
                </label>
                <code className="text-xs bg-muted px-2 py-1 block w-full break-all font-mono border rounded-md">
                  {entry.identificador_de_acto}
                </code>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-normal text-muted-foreground font-bold block mb-1">
                    Fecha
                  </label>
                  <span className="text-sm font-medium block">
                    {typeof entry.boletin === "object"
                      ? formatDate(entry.boletin.fecha_publicacion)
                      : "N/A"}
                  </span>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-normal text-muted-foreground font-bold block mb-1">
                    Páginas
                  </label>
                  <span className="text-sm font-medium block">
                    {entry.paginas || "-"}
                  </span>
                </div>
              </div>

              {entry.jurisdiccion && (
                <div>
                  <label className="text-[10px] uppercase tracking-normal text-muted-foreground font-bold block mb-1">
                    Jurisdicción
                  </label>
                  <span className="text-sm font-medium block">
                    {typeof entry.jurisdiccion === "object"
                      ? entry.jurisdiccion.nombre
                      : entry.jurisdiccion}
                  </span>
                </div>
              )}

              {isEditing && (
                <div>
                  <label className="text-[10px] uppercase tracking-normal text-muted-foreground font-bold block mb-1">
                    Estado
                  </label>
                  <button
                    onClick={toggleStatus}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 border text-xs font-bold transition-all uppercase tracking-normal rounded",
                      status === "publicado"
                        ? "bg-green-600 text-white border-green-600 hover:bg-green-700"
                        : "bg-yellow-500 text-white border-yellow-500 hover:bg-yellow-600",
                    )}
                  >
                    {status === "publicado" ? (
                      <Eye className="h-3 w-3" />
                    ) : (
                      <EyeOff className="h-3 w-3" />
                    )}
                    {status === "publicado" ? "Publicado" : "Borrador"}
                  </button>
                </div>
              )}

              {entry.nivel_opacidad !== undefined && (
                <div>
                  <label className="text-[10px] uppercase tracking-normal text-muted-foreground font-bold block mb-1">
                    Nivel de Opacidad
                  </label>
                  <span
                    className={`inline-flex items-center px-2 py-1 text-xs font-bold border ${
                      entry.nivel_opacidad === "Transparente"
                        ? "bg-white text-black border-black"
                        : entry.nivel_opacidad === "Parcial"
                          ? "bg-gray-200 text-black border-black"
                          : "bg-black text-white border-black"
                    }`}
                  >
                    {entry.nivel_opacidad}
                  </span>
                </div>
              )}
            </div>
          </div>

        </aside>
      </div>
    </main>
  );
}

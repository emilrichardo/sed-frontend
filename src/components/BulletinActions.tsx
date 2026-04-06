"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Boletin, deleteBulletin, updateBoletin } from "@/lib/api";
import { Trash2, Pencil, Check, X } from "lucide-react";
import { ProcessingButton } from "./ProcessingButton";

export default function BulletinActions({ bulletin }: { bulletin: Boletin }) {
  const { user, isEditing } = useAuth();
  const router = useRouter();

  const [isEditingTitulo, setIsEditingTitulo] = useState(false);
  const [tituloValue, setTituloValue] = useState(bulletin.titulo_periodistico || "");
  const [isSavingTitulo, setIsSavingTitulo] = useState(false);

  const [isEditingResumen, setIsEditingResumen] = useState(false);
  const [resumenValue, setResumenValue] = useState(bulletin.resumen || "");
  const [isSavingResumen, setIsSavingResumen] = useState(false);

  // Refetch authenticated (includes drafts) when user is logged in
  useEffect(() => {
    if (!user) return;
    fetch(`/api/cms?path=/boletines/${bulletin.id}&qs=draft=true&depth=0`)
      .then((r) => r.json())
      .then((data) => {
        if (data.titulo_periodistico !== undefined) setTituloValue(data.titulo_periodistico || "");
        if (data.resumen !== undefined) setResumenValue(data.resumen || "");
      })
      .catch(() => {});
  }, [user, bulletin.id]);

  const saveTitulo = async () => {
    setIsSavingTitulo(true);
    try {
      await updateBoletin(bulletin.id, { titulo_periodistico: tituloValue.trim() });
      setIsEditingTitulo(false);
    } catch (error) {
      console.error("Failed to update titulo:", error);
    } finally {
      setIsSavingTitulo(false);
    }
  };

  const saveResumen = async () => {
    setIsSavingResumen(true);
    try {
      await updateBoletin(bulletin.id, { resumen: resumenValue.trim() });
      setIsEditingResumen(false);
    } catch (error) {
      console.error("Failed to update resumen:", error);
    } finally {
      setIsSavingResumen(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `¿Estás seguro de que deseas eliminar el boletín Nº ${bulletin.numero}? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }
    try {
      await deleteBulletin(bulletin.id);
      router.push("/boletines");
    } catch {
      alert("Error eliminando el boletín.");
    }
  };

  const getExistingProcessingId = () => {
    if (
      !bulletin.procesamiento_asociado ||
      !Array.isArray(bulletin.procesamiento_asociado)
    )
      return null;
    const reversed = [...bulletin.procesamiento_asociado].reverse();
    for (const p of reversed) {
      if (typeof p === "object" && p !== null && "agente" in p) {
        const agentId = typeof p.agente === "object" ? p.agente?.id : p.agente;
        if (String(agentId) === "5") return p.id;
      }
    }
    return null;
  };

  const hasTitulo = tituloValue.trim().length > 0;
  const hasResumen = resumenValue.trim().length > 0;

  return (
    <div className="space-y-3">
      {/* Titulo periodístico del boletín */}
      {(hasTitulo || user) && (
        <div>
          {isEditing && isEditingTitulo ? (
            <div className="flex flex-col gap-2">
              <textarea
                className="w-full text-2xl font-extrabold tracking-tight bg-muted border rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                rows={2}
                value={tituloValue}
                onChange={(e) => setTituloValue(e.target.value)}
                placeholder="Título periodístico del boletín..."
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={saveTitulo}
                  disabled={isSavingTitulo}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded hover:opacity-90 disabled:opacity-50"
                >
                  <Check className="h-3 w-3" />
                  {isSavingTitulo ? "Guardando..." : "Guardar"}
                </button>
                <button
                  onClick={() => { setTituloValue(bulletin.titulo_periodistico || ""); setIsEditingTitulo(false); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-muted text-foreground text-xs font-bold rounded hover:bg-muted/80"
                >
                  <X className="h-3 w-3" />
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              {hasTitulo ? (
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15] flex-1">
                  {tituloValue}
                </h1>
              ) : (
                <p className="text-base text-muted-foreground/50 italic flex-1">Sin título — clic en el lápiz para agregar</p>
              )}
              {isEditing && (
                <button
                  onClick={() => setIsEditingTitulo(true)}
                  className="mt-1 p-1.5 rounded hover:bg-muted border border-dashed border-muted-foreground/40 shrink-0"
                  title="Editar título del boletín"
                >
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Resumen del boletín */}
      {(hasResumen || user) && (
        <div>
          {isEditing && isEditingResumen ? (
            <div className="flex flex-col gap-2 border-l-4 border-primary/20 pl-4">
              <textarea
                className="w-full text-base bg-muted border rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed"
                rows={4}
                value={resumenValue}
                onChange={(e) => setResumenValue(e.target.value)}
                placeholder="Resumen del boletín..."
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
                  onClick={() => { setResumenValue(bulletin.resumen || ""); setIsEditingResumen(false); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-muted text-foreground text-xs font-bold rounded hover:bg-muted/80"
                >
                  <X className="h-3 w-3" />
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 border-l-4 border-primary/20 pl-4 py-1">
              {hasResumen ? (
                <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed font-sans flex-1">
                  {resumenValue}
                </p>
              ) : (
                <p className="text-base text-muted-foreground/50 italic flex-1">Sin resumen — clic en el lápiz para agregar</p>
              )}
              {isEditing && (
                <button
                  onClick={() => setIsEditingResumen(true)}
                  className="mt-1 p-1.5 rounded hover:bg-muted border border-dashed border-muted-foreground/40 shrink-0"
                  title="Editar resumen del boletín"
                >
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Admin actions (only for authenticated users) */}
      {user && (
        <div className="flex flex-wrap gap-2 pt-2">
          <ProcessingButton
            relationTo="boletines"
            relatedId={bulletin.id}
            existingProcessingId={getExistingProcessingId()}
            requiredAgentId="5"
            hasExistingResults={
              bulletin.status_procesamiento === "basic" ||
              bulletin.status_procesamiento === "ai_enhanced"
            }
            className="bg-zinc-800 text-white hover:bg-zinc-700"
          />
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 border border-destructive/50 text-destructive bg-background hover:bg-destructive/10 rounded-md text-sm font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}

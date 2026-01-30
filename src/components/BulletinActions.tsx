"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Boletin } from "@/lib/api";
import BulletinFlipbook from "./BulletinFlipbook";
import { Eye, BookOpen } from "lucide-react";
import { ProcessingButton } from "./ProcessingButton";

export default function BulletinActions({ bulletin }: { bulletin: Boletin }) {
  const { user } = useAuth();
  const [showFlipbook, setShowFlipbook] = React.useState(false);

  if (!user || !bulletin.archivo_binario) return null;

  const getPdfUrl = () => {
    let url = "";
    if (typeof bulletin.archivo_binario === "string") {
      return "";
    } else if (
      typeof bulletin.archivo_binario === "object" &&
      bulletin.archivo_binario !== null
    ) {
      const media = bulletin.archivo_binario;
      if (media.filename) {
        const supabaseUrl =
          process.env.NEXT_PUBLIC_SUPABASE_URL ||
          process.env.NEXT_PUBLIC_SUPABASE_UR ||
          "";
        if (supabaseUrl) {
          url = `${supabaseUrl}/storage/v1/object/public/boletines-pdf/${media.filename}`;
        } else if (media.url) {
          url = media.url;
        }
      } else if (media.url) {
        url = media.url;
      }
    }
    return url;
  };

  const pdfUrl = getPdfUrl();

  const handleOpenOriginal = () => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank");
    } else {
      alert("No se pudo obtener la URL del archivo.");
    }
  };

  // Find existing processing for Agent 5 (Boletín Extractor)
  const getExistingProcessingId = () => {
    if (
      !bulletin.procesamiento_asociado ||
      !Array.isArray(bulletin.procesamiento_asociado)
    )
      return null;

    // Look for the most recent processing by Agent 5
    const reversed = [...bulletin.procesamiento_asociado].reverse();
    for (const p of reversed) {
      if (typeof p === "object" && p !== null && "agente" in p) {
        const agentId = typeof p.agente === "object" ? p.agente?.id : p.agente;
        if (String(agentId) === "5") {
          return p.id;
        }
      }
    }
    return null;
  };

  return (
    <>
      <div className="flex flex-wrap gap-2 mt-4">
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
          onClick={handleOpenOriginal}
          className="flex items-center gap-2 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium transition-colors"
        >
          <Eye className="w-4 h-4" />
          Ver PDF Original
        </button>
        <button
          onClick={() => setShowFlipbook(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          Modo Lectura
        </button>
      </div>

      <BulletinFlipbook
        isOpen={showFlipbook}
        onClose={() => setShowFlipbook(false)}
        pdfUrl={pdfUrl}
      />
    </>
  );
}

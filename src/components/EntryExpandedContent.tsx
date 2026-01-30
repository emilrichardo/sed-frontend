"use client";

import { ActoAdministrativo } from "@/lib/api";
import { FileText, Info, Share2, ExternalLink } from "lucide-react";
import Link from "next/link";

import { ProcessingButton } from "./ProcessingButton";

interface EntryExpandedContentProps {
  entry: ActoAdministrativo;
}

export default function EntryExpandedContent({
  entry,
}: EntryExpandedContentProps) {
  // Build correct URL: /boletines/[boletinSlug]/[identificador_de_acto]
  const getBoletinSlug = () => {
    if (typeof entry.boletin === "object" && entry.boletin) {
      return entry.boletin.slug || entry.boletin.id;
    }
    return entry.boletin || "";
  };
  const shareUrl = `${window.location.origin}/boletines/${getBoletinSlug()}/${entry.identificador_de_acto}`;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: entry.identificador_de_acto,
        text: entry.titulo,
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert("Enlace copiado al portapapeles");
    }
  };

  const getExistingProcessingId = () => {
    if (
      !entry.procesamiento_asociado ||
      !Array.isArray(entry.procesamiento_asociado)
    )
      return null;

    const reversed = [...entry.procesamiento_asociado].reverse();
    for (const p of reversed) {
      if (typeof p === "object" && p !== null && "agente" in p) {
        const agentId = typeof p.agente === "object" ? p.agente?.id : p.agente;
        if (String(agentId) === "6") {
          return p.id;
        }
      }
    }
    return null;
  };

  return (
    <div className="mt-4 pt-4 border-t space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Metadata Grid - More subtle, no boxes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-1">
          <span className="text-[10px] uppercase tracking-normal text-muted-foreground font-bold block">
            Identificador
          </span>
          <span className="text-sm font-mono font-bold text-wrap break-all">
            {entry.identificador_de_acto}
          </span>
        </div>
        {entry.lugar_fecha && (
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-normal text-muted-foreground font-bold block">
              Lugar y Fecha
            </span>
            <span className="text-sm font-medium italic">
              {entry.lugar_fecha}
            </span>
          </div>
        )}
        {entry.resolucion && (
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-normal text-muted-foreground font-bold block">
              Resolución
            </span>
            <span className="text-sm font-medium">{entry.resolucion}</span>
          </div>
        )}
        {entry.paginas && (
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-normal text-muted-foreground font-bold block">
              Páginas
            </span>
            <span className="text-sm font-medium">{entry.paginas}</span>
          </div>
        )}
        {entry.es_homologacion && (
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-normal text-green-700 font-bold block">
              Estado
            </span>
            <span className="text-sm font-bold text-green-800 flex items-center gap-1">
              <Info className="h-3 w-3" /> Homologación
            </span>
          </div>
        )}
        {entry.id_acto_referenciado && (
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-normal text-muted-foreground font-bold block">
              Acto Referenciado
            </span>
            <span className="text-sm font-mono">
              {entry.id_acto_referenciado}
            </span>
          </div>
        )}
        {entry.nivel_opacidad !== undefined && (
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-normal text-muted-foreground font-bold block">
              Opacidad
            </span>
            <span
              className={`text-sm font-bold ${
                entry.nivel_opacidad === "Transparente"
                  ? "text-green-600"
                  : entry.nivel_opacidad === "Parcial"
                    ? "text-yellow-600"
                    : typeof entry.nivel_opacidad === "number" &&
                        entry.nivel_opacidad < 5
                      ? "text-green-600"
                      : "text-red-600"
              }`}
            >
              {typeof entry.nivel_opacidad === "number"
                ? `Nivel ${entry.nivel_opacidad}`
                : entry.nivel_opacidad}
            </span>
          </div>
        )}
      </div>

      {/* Full Text / Cuerpo - Subtle */}
      <div className="space-y-4 pt-4 border-t border-dashed">
        <h4 className="text-xs font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-normal">
          <FileText className="h-3 w-3" />
          Cuerpo / Texto Completo
        </h4>
        <div className="font-serif text-sm leading-relaxed p-0">
          {entry.cuerpo ? (
            <div className="whitespace-pre-line text-foreground/90">
              {(() => {
                const text = entry.cuerpo;
                return text.replace(/(?<!\n)\n(?!\n)/g, " ");
              })()}
            </div>
          ) : (
            <span className="text-muted-foreground italic">
              Sin contenido de texto completo.
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t">
        <div className="flex items-center gap-2">
          <ProcessingButton
            relationTo="actos-administrativos"
            relatedId={entry.id}
            existingProcessingId={getExistingProcessingId()}
            requiredAgentId="6"
            className="h-9 px-3 text-xs"
          />
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <Share2 className="h-4 w-4" />
            Compartir
          </button>
          <Link
            href={`/boletines/${getBoletinSlug()}/${entry.identificador_de_acto}`}
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Ver página dedicada
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

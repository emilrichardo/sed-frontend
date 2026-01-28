"use client";

import { ActoAdministrativo } from "@/lib/api";
import { FileText, Info, Share2, ExternalLink } from "lucide-react";
import Link from "next/link";

interface EntryExpandedContentProps {
  entry: ActoAdministrativo;
}

export default function EntryExpandedContent({
  entry,
}: EntryExpandedContentProps) {
  const shareUrl = `${window.location.origin}/boletines/entrada/${entry.id}`;

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

  return (
    <div className="mt-4 pt-4 border-t space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-3 bg-muted/20 rounded-lg border border-border/50">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">
            Identificador
          </span>
          <span className="text-sm font-mono font-bold text-wrap break-all">
            {entry.identificador_de_acto}
          </span>
        </div>
        {entry.lugar_fecha && (
          <div className="p-3 bg-muted/20 rounded-lg border border-border/50">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">
              Lugar y Fecha
            </span>
            <span className="text-sm font-medium italic">
              {entry.lugar_fecha}
            </span>
          </div>
        )}
        {entry.resolucion && (
          <div className="p-3 bg-muted/20 rounded-lg border border-border/50">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">
              Resolución
            </span>
            <span className="text-sm font-medium">{entry.resolucion}</span>
          </div>
        )}
        {entry.paginas && (
          <div className="p-3 bg-muted/20 rounded-lg border border-border/50">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">
              Páginas
            </span>
            <span className="text-sm font-medium">{entry.paginas}</span>
          </div>
        )}
        {entry.es_homologacion && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-100">
            <span className="text-[10px] uppercase tracking-wider text-green-700 font-bold block mb-1">
              Estado
            </span>
            <span className="text-sm font-bold text-green-800 flex items-center gap-1">
              <Info className="h-3 w-3" /> Homologación
            </span>
          </div>
        )}
        {entry.id_acto_referenciado && (
          <div className="p-3 bg-muted/20 rounded-lg border border-border/50">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">
              Acto Referenciado
            </span>
            <span className="text-sm font-mono">
              {entry.id_acto_referenciado}
            </span>
          </div>
        )}
        {entry.nivel_opacidad && (
          <div className="p-3 bg-muted/20 rounded-lg border border-border/50">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">
              Opacidad
            </span>
            <span
              className={`text-sm font-bold ${
                entry.nivel_opacidad === "Transparente"
                  ? "text-green-600"
                  : entry.nivel_opacidad === "Parcial"
                    ? "text-yellow-600"
                    : "text-red-600"
              }`}
            >
              {entry.nivel_opacidad}
            </span>
          </div>
        )}
      </div>

      {/* Full Text / Cuerpo */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-widest">
          <FileText className="h-3 w-3" />
          Cuerpo / Texto Completo
        </h4>
        <div className="bg-card p-6 border rounded-lg font-serif text-sm leading-relaxed whitespace-pre-wrap shadow-inner">
          {entry.cuerpo ? (
            entry.cuerpo
          ) : (
            <span className="text-muted-foreground italic">
              Sin contenido de texto completo.
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <button
          onClick={handleShare}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          <Share2 className="h-4 w-4" />
          Compartir esta entrada
        </button>
        <Link
          href={`/boletines/entrada/${entry.id}`}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Ver página dedicada
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

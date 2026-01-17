"use client";

import React, { useState, useEffect } from "react";
import { EntradaInterna, DetalleEspecifico, getEntryDetails } from "@/lib/api";
import { FileText, Info, Share2, ExternalLink } from "lucide-react";
import Link from "next/link";

interface EntryExpandedContentProps {
  entry: EntradaInterna;
}

export default function EntryExpandedContent({
  entry,
}: EntryExpandedContentProps) {
  const [details, setDetails] = useState<DetalleEspecifico[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDetails() {
      try {
        const data = await getEntryDetails(entry.id);
        setDetails(data);
      } catch (error) {
        console.error("Error loading entry details:", error);
      } finally {
        setLoading(false);
      }
    }
    loadDetails();
  }, [entry.id]);

  const shareUrl = `${window.location.origin}/boletines/entrada/${entry.id}`;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: entry.identificador_acto,
        text: entry.referencia,
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert("Enlace copiado al portapapeles");
    }
  };

  return (
    <div className="mt-4 pt-4 border-t space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-muted/20 rounded-lg border border-border/50">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">
                Identificador
              </span>
              <span className="text-sm font-mono font-bold">
                {entry.identificador_acto}
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
            {entry.paginas && entry.paginas.length > 0 && (
              <div className="p-3 bg-muted/20 rounded-lg border border-border/50">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">
                  Páginas
                </span>
                <span className="text-sm font-medium">
                  {entry.paginas
                    .map((p: any) => (typeof p === "object" ? p.numero : p))
                    .join(", ")}
                </span>
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

          {/* Structured Details */}
          {details.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-widest">
                <Info className="h-3 w-3" />
                Información Estructurada (IA)
              </h4>
              <div className="grid gap-3">
                {details.map((detail) => (
                  <div key={detail.id} className="grid gap-2">
                    {detail.detalles.map((block: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-4 bg-card rounded-lg border shadow-sm text-sm"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
                          {Object.entries(block).map(([key, value]) => {
                            if (["blockType", "id", "blockName"].includes(key))
                              return null;
                            if (!value) return null;
                            return (
                              <div key={key} className="space-y-0.5">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter block">
                                  {key.replace(/_/g, " ")}
                                </span>
                                <span className="font-medium">
                                  {typeof value === "object"
                                    ? JSON.stringify(value)
                                    : String(value)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full Text */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-widest">
              <FileText className="h-3 w-3" />
              Texto Completo
            </h4>
            <div className="bg-card p-6 border rounded-lg font-serif text-sm leading-relaxed whitespace-pre-wrap shadow-inner">
              {typeof entry.texto_completo === "string" ? (
                entry.texto_completo
              ) : entry.texto_completo?.root?.children ? (
                <div className="prose prose-neutral max-w-none">
                  {entry.texto_completo.root.children.map(
                    (node: any, i: number) => {
                      if (node.type === "paragraph") {
                        return (
                          <p key={i} className="mb-4 last:mb-0">
                            {node.children?.map((child: any, j: number) => (
                              <span key={j}>{child.text}</span>
                            ))}
                          </p>
                        );
                      }
                      return null;
                    }
                  )}
                </div>
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
        </>
      )}
    </div>
  );
}

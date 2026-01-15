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
          {/* Structured Details */}
          {details.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold flex items-center gap-2 text-muted-foreground">
                <Info className="h-4 w-4" />
                INFORMACIÓN ESTRUCTURADA
              </h4>
              <div className="grid gap-3">
                {details.map((detail) => (
                  <div key={detail.id} className="grid gap-2">
                    {detail.detalles.map((block: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 bg-muted/30 rounded border text-sm"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                          {Object.entries(block).map(([key, value]) => {
                            if (["blockType", "id", "blockName"].includes(key))
                              return null;
                            return (
                              <div
                                key={key}
                                className="flex justify-between border-b border-muted/50 py-1"
                              >
                                <span className="font-medium text-muted-foreground capitalize">
                                  {key.replace(/_/g, " ")}:
                                </span>
                                <span>
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
            <h4 className="text-sm font-bold flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              TEXTO COMPLETO
            </h4>
            <div className="bg-card p-4 border rounded font-serif text-sm leading-relaxed whitespace-pre-wrap">
              {typeof entry.texto_completo === "string"
                ? entry.texto_completo
                : "Contenido en formato enriquecido (Lexical)."}
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

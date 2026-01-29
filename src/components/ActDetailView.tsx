"use client";

import Link from "next/link";
import {
  ChevronLeft,
  Calendar,
  Building2,
  FileTextIcon,
  Star,
  PenTool,
} from "lucide-react";
import { ActoAdministrativo, updateActoAdministrativo } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ActDetailViewProps {
  entry: ActoAdministrativo;
  backLink: string;
}

export function ActDetailView({ entry, backLink }: ActDetailViewProps) {
  const { isEditing } = useAuth();
  const [isDestacado, setIsDestacado] = useState(entry.destacado || false);

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

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
      <Link
        href={backLink}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver al Boletín
      </Link>

      <article className="space-y-12">
        {/* Helper Header for Editors */}
        {isEditing && (
          <div className="flex justify-end">
            <button
              onClick={toggleDestacado}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full border transition-all shadow-sm",
                isDestacado
                  ? "bg-yellow-50 border-yellow-200 text-yellow-700"
                  : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50",
              )}
            >
              <Star className={cn("h-4 w-4", isDestacado && "fill-current")} />
              <span className="text-sm font-medium">
                {isDestacado ? "Destacado" : "Marcar como Destacado"}
              </span>
            </button>
          </div>
        )}

        {/* Journalistic Header (if available) */}
        {(entry.titulo_periodistico || entry.resumen) && (
          <section className="space-y-6 border-b pb-8">
            {entry.titulo_periodistico && (
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground leading-[1.1]">
                {entry.titulo_periodistico}
              </h1>
            )}

            {entry.resumen && (
              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed font-serif">
                {entry.resumen}
              </p>
            )}
          </section>
        )}

        <header className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded uppercase">
              {entry.seccion}
            </span>
            <span className="px-2 py-1 bg-muted text-muted-foreground text-xs font-bold rounded uppercase">
              {entry.tipo_de_acto && typeof entry.tipo_de_acto === "object"
                ? entry.tipo_de_acto.nombre
                : "Acto"}
            </span>
            {entry.nivel_opacidad && (
              <span
                className={`px-2 py-1 text-xs font-bold rounded uppercase ${
                  entry.nivel_opacidad === "Transparente"
                    ? "bg-green-100 text-green-700"
                    : entry.nivel_opacidad === "Parcial"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                }`}
              >
                {entry.nivel_opacidad}
              </span>
            )}
          </div>

          <h2 className="text-2xl font-bold leading-tight break-words text-foreground/80">
            {entry.identificador_de_acto}
          </h2>

          <p className="text-lg text-muted-foreground italic">
            &quot;{entry.titulo}&quot;
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-b py-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Fecha de Publicación:</span>
              <span>
                {typeof entry.boletin === "object"
                  ? formatDate(entry.boletin.fecha_publicacion)
                  : "N/A"}
              </span>
            </div>
            {entry.jurisdiccion && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Jurisdicción:</span>
                <span>
                  {typeof entry.jurisdiccion === "object"
                    ? entry.jurisdiccion.nombre
                    : entry.jurisdiccion}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Journalistic Note (if available) */}
        {entry.nota_periodistica && (
          <section className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2 text-foreground/90">
              <PenTool className="h-5 w-5" />
              Análisis Periodístico
            </h3>
            <div className="prose prose-lg max-w-none text-foreground leading-relaxed font-serif">
              <div className="whitespace-pre-wrap">
                {entry.nota_periodistica}
              </div>
            </div>
            <hr className="my-8" />
          </section>
        )}

        {/* Full Text / Cuerpo */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2 text-muted-foreground">
            <FileTextIcon className="h-5 w-5" />
            Texto Oficial Completo
          </h3>
          <div className="prose prose-sm md:prose-base max-w-none bg-muted/30 p-6 md:p-8 border rounded-lg shadow-sm">
            <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground/80">
              {entry.cuerpo || (
                <span className="text-muted-foreground italic font-sans">
                  Sin contenido de texto completo.
                </span>
              )}
            </div>
          </div>
        </section>
      </article>
    </main>
  );
}

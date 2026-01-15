import React from "react";
import {
  getEntry,
  getEntryDetails,
  EntradaInterna,
  DetalleEspecifico,
} from "@/lib/api";
import Link from "next/link";
import { ChevronLeft, Calendar, Building2, Info } from "lucide-react";

export default async function EntryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: entryId } = await params;

  let entry: EntradaInterna;
  let details: DetalleEspecifico[] = [];

  try {
    entry = await getEntry(entryId);
    details = await getEntryDetails(entryId);
  } catch (err) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold">Error al cargar el acto</h1>
        <p className="text-muted-foreground mt-2">
          No se pudo encontrar el acto administrativo solicitado.
        </p>
        <Link
          href="/boletin"
          className="text-primary hover:underline mt-4 inline-block"
        >
          Volver al archivo
        </Link>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
      <Link
        href={
          typeof entry.id_boletin === "object"
            ? `/boletines/${entry.id_boletin.id}`
            : "/boletines"
        }
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver al Boletín
      </Link>

      <article className="space-y-8">
        <header className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded uppercase">
              {entry.seccion && typeof entry.seccion === "object"
                ? entry.seccion.nombre
                : "Sección"}
            </span>
            <span className="px-2 py-1 bg-muted text-muted-foreground text-xs font-bold rounded uppercase">
              {entry.tipo_acto && typeof entry.tipo_acto === "object"
                ? entry.tipo_acto.nombre
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

          <h1 className="text-3xl md:text-4xl font-bold leading-tight">
            {entry.identificador_acto}
          </h1>

          <p className="text-xl text-muted-foreground italic">
            &quot;{entry.referencia}&quot;
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-b py-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Fecha de Publicación:</span>
              <span>
                {typeof entry.id_boletin === "object"
                  ? formatDate(entry.id_boletin.fecha_publicacion)
                  : "N/A"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Jurisdicción:</span>
              <span>
                {entry.jurisdiccion && typeof entry.jurisdiccion === "object"
                  ? entry.jurisdiccion.nombre
                  : "N/A"}
              </span>
            </div>
          </div>
        </header>

        {/* Structured Details */}
        {details.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Info className="h-5 w-5" />
              Información Estructurada
            </h2>
            <div className="grid gap-4">
              {details.map((detail) => (
                <div key={detail.id} className="space-y-4">
                  {detail.detalles.map((block: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 border rounded-lg bg-muted/30"
                    >
                      <h3 className="text-sm font-bold uppercase tracking-wider mb-3 text-muted-foreground">
                        Detalle:{" "}
                        {block.blockType
                          .replace("detalle_", "")
                          .replace("_", " ")}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                        {Object.entries(block).map(([key, value]) => {
                          if (
                            key === "blockType" ||
                            key === "id" ||
                            key === "blockName"
                          )
                            return null;
                          return (
                            <div
                              key={key}
                              className="flex justify-between border-b border-muted py-1"
                            >
                              <span className="font-medium capitalize">
                                {key.replace(/_/g, " ")}:
                              </span>
                              <span className="text-right">
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
          </section>
        )}

        {/* Full Text */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Texto Completo
          </h2>
          <div className="prose prose-sm md:prose-base max-w-none bg-card p-6 md:p-8 border rounded-lg shadow-sm">
            {/* Lexical content would be rendered here using a proper renderer */}
            <div className="whitespace-pre-wrap font-serif leading-relaxed">
              {typeof entry.texto_completo === "string"
                ? entry.texto_completo
                : "Contenido en formato enriquecido (Lexical). Se requiere renderizador específico."}
            </div>
          </div>
        </section>
      </article>
    </main>
  );
}

function FileText(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}

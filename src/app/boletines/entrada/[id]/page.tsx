import { getActoAdministrativo, ActoAdministrativo } from "@/lib/api";
import { getAllActoIds } from "@/lib/static-params";

export async function generateStaticParams() {
  const ids = await getAllActoIds();
  return ids.map((id) => ({ id }));
}
import Link from "next/link";
import { ChevronLeft, Calendar, Building2, FileTextIcon } from "lucide-react";
import { MarkdownContent } from "@/components/MarkdownContent";

export default async function EntryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: entryId } = await params;

  let entry: ActoAdministrativo;

  try {
    entry = await getActoAdministrativo(entryId);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold">Error al cargar el acto</h1>
        <p className="text-muted-foreground mt-2">
          {message || "No se pudo encontrar el acto administrativo solicitado."}{" "}
          ({entryId})
        </p>
        <Link
          href="/boletines"
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
          typeof entry.boletin === "object"
            ? `/boletines/${entry.boletin.id}`
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

          <h1 className="text-3xl md:text-4xl font-bold leading-tight break-words">
            {entry.identificador_de_acto}
          </h1>

          <p className="text-xl text-muted-foreground italic">
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

        {/* Full Text / Cuerpo */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileTextIcon className="h-5 w-5" />
            Cuerpo / Texto Completo
          </h2>
          <div className="prose prose-sm md:prose-base max-w-none bg-card p-6 md:p-8 border rounded-lg shadow-sm">
            {entry.cuerpo ? (
              <MarkdownContent
                content={entry.cuerpo}
                className="font-serif [&_p:first-child]:mt-0"
              />
            ) : (
              <span className="text-muted-foreground italic font-sans">
                Sin contenido de texto completo.
              </span>
            )}
          </div>
        </section>
      </article>
    </main>
  );
}

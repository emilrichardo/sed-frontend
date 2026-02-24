import { getReports } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/PageHeader";
import Link from "next/link";
import { ChevronLeft, ChevronRight, BarChart } from "lucide-react";

export const revalidate = 60;

interface PageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function PublicationsArchivePage({
  searchParams,
}: PageProps) {
  const { page: pageParam } = await searchParams;
  const page = parseInt(pageParam || "1", 10);
  const limit = 10;

  const reports = await getReports({
    page,
    limit,
    sort: "-createdAt",
    // where: {
    //   parent: { exists: false },
    // },
  });

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 space-y-8">
      <PageHeader
        title="Publicaciones"
        description="Publicaciones técnicas y análisis detallados de Santiago en Datos."
        icon={BarChart}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.docs.map((item) => {
          const contenido = item.contenido as any;

          let description = "Sin descripción";
          if (contenido?.root?.children) {
            const firstTextNode = contenido.root.children.find(
              (child: any) =>
                child.children &&
                child.children.length > 0 &&
                child.children[0].text,
            );
            if (firstTextNode) {
              description = firstTextNode.children[0].text;
            }
          }

          return (
            <Card
              key={item.id}
              title={item.titulo}
              description={description}
              date={item.createdAt}
              href={`/publicaciones/${item.slug}`}
              imageUrl={item.imagen_destacada?.url}
              imageAlt={item.imagen_destacada?.alt}
            />
          );
        })}
      </div>

      {reports.docs.length === 0 && (
        <div className="text-center py-20 border rounded-xl border-dashed">
          <p className="text-muted-foreground italic">
            No hay publicaciones disponibles.
          </p>
        </div>
      )}

      {/* Pagination */}
      {reports.totalPages > 1 && (
        <div className="flex items-center justify-between pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            Mostrando {reports.docs.length} de {reports.totalDocs} publicaciones
          </p>
          <div className="flex gap-2">
            <Link
              href={`/publicaciones?page=${reports.prevPage}`}
              className={`p-2 border rounded-md transition-colors ${
                !reports.hasPrevPage
                  ? "opacity-50 pointer-events-none"
                  : "hover:bg-muted"
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center px-4 text-sm font-medium">
              Página {reports.page} de {reports.totalPages}
            </div>
            <Link
              href={`/publicaciones?page=${reports.nextPage}`}
              className={`p-2 border rounded-md transition-colors ${
                !reports.hasNextPage
                  ? "opacity-50 pointer-events-none"
                  : "hover:bg-muted"
              }`}
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

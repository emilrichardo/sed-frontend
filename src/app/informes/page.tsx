import { getReports } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";

export const revalidate = 60;

interface PageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function ReportsArchivePage({ searchParams }: PageProps) {
  const { page: pageParam } = await searchParams;
  const page = parseInt(pageParam || "1", 10);
  const limit = 10;

  const reports = await getReports({
    page,
    limit,
    sort: "-createdAt",
    where: {
      parent: { exists: false },
    },
  });

  return (
    <div className="container mx-auto px-4 space-y-8">
      <header className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            Informes
          </h1>
        </div>
        <p className="text-muted-foreground">
          Informes técnicos y análisis detallados de Santiago en Datos.
        </p>
      </header>

      <div className="space-y-6">
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
              href={`/informes/${item.slug}`}
              imageUrl={item.imagen_destacada?.url}
              imageAlt={item.imagen_destacada?.alt}
              layout="horizontal"
            />
          );
        })}
      </div>

      {reports.docs.length === 0 && (
        <div className="text-center py-20 border rounded-xl border-dashed">
          <p className="text-muted-foreground italic">
            No hay informes disponibles.
          </p>
        </div>
      )}

      {/* Pagination */}
      {reports.totalPages > 1 && (
        <div className="flex items-center justify-between pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            Mostrando {reports.docs.length} de {reports.totalDocs} informes
          </p>
          <div className="flex gap-2">
            <Link
              href={`/informes?page=${reports.prevPage}`}
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
              href={`/informes?page=${reports.nextPage}`}
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

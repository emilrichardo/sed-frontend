import { getNews } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { CreateNewsButton } from "@/components/CreateNewsButton";
import { PageHeader } from "@/components/PageHeader";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Newspaper } from "lucide-react";

export const revalidate = 60;

interface PageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function NewsArchivePage({ searchParams }: PageProps) {
  const { page: pageParam } = await searchParams;
  const page = parseInt(pageParam || "1", 10);
  const limit = 10;

  const news = await getNews({
    page,
    limit,
    sort: "-createdAt",
  });

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 space-y-8">
      <PageHeader
        title="Noticias"
        description="Explora las últimas novedades y artículos de Santiago en Datos."
        icon={Newspaper}
        actions={<CreateNewsButton />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {news.docs.map((item) => {
          const contenido = item.contenido as
            | {
                root?: {
                  children?: Array<{
                    type?: string;
                    children?: Array<{ text?: string }>;
                  }>;
                };
              }
            | undefined;
          const description =
            contenido?.root?.children?.find(
              (child) => child.type === "paragraph" || child.type === "heading",
            )?.children?.[0]?.text || "Sin descripción";

          return (
            <Card
              key={item.id}
              title={item.titulo}
              description={description}
              date={item.createdAt}
              href={`/noticias/${item.slug}`}
              imageUrl={item.imagen_destacada?.url}
              imageAlt={item.imagen_destacada?.alt}
            />
          );
        })}
      </div>

      {news.docs.length === 0 && (
        <div className="text-center py-20 border rounded-xl border-dashed">
          <p className="text-muted-foreground italic">
            No hay noticias disponibles.
          </p>
        </div>
      )}

      {/* Pagination */}
      {news.totalPages > 1 && (
        <div className="flex items-center justify-between pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            Mostrando {news.docs.length} de {news.totalDocs} noticias
          </p>
          <div className="flex gap-2">
            <Link
              href={`/noticias?page=${news.prevPage}`}
              className={`p-2 border rounded-md transition-colors ${
                !news.hasPrevPage
                  ? "opacity-50 pointer-events-none"
                  : "hover:bg-muted"
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center px-4 text-sm font-medium">
              Página {news.page} de {news.totalPages}
            </div>
            <Link
              href={`/noticias?page=${news.nextPage}`}
              className={`p-2 border rounded-md transition-colors ${
                !news.hasNextPage
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

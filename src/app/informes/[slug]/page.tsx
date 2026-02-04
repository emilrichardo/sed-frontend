import { getReportItem, getReports, ReportItem } from "@/lib/api";
import { NewsDetail } from "@/components/NewsDetail";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import { SourcesSection } from "@/components/SourcesSection";

export const revalidate = 0;

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const reportItem = await getReportItem(slug);

  if (!reportItem) {
    return {
      title: "Informe no encontrado",
    };
  }

  return {
    title: `${reportItem.titulo} | Santiago en Datos`,
  };
}

export default async function ReportPage({ params }: PageProps) {
  const { slug } = await params;
  const reportItem = await getReportItem(slug);

  if (!reportItem) {
    notFound();
  }

  const parent =
    typeof reportItem.parent === "object" ? reportItem.parent : null;
  const parentId =
    parent?.id ||
    (typeof reportItem.parent === "number" ? reportItem.parent : null);

  // 1. Fetch Children (Sub-reports)
  const childrenData = await getReports({
    where: { parent: { equals: reportItem.id } },
    sort: "createdAt", // or bespoke sort order if available
    limit: 100,
  });
  const children = childrenData.docs;

  // 2. Fetch Siblings (if has parent)
  let nextSibling: ReportItem | null = null;
  let prevSibling: ReportItem | null = null; // lint fix: kept but unused, or removing? Keep to avoid major shuffle
  // Actually I can just remove prevSibling if it's unused and causing warnings
  let siblings: ReportItem[] = [];

  if (parentId) {
    const siblingsData = await getReports({
      where: { parent: { equals: parentId } },
      sort: "createdAt",
      limit: 100,
    });
    siblings = siblingsData.docs;
    const currentIndex = siblings.findIndex((s) => s.id === reportItem.id);
    if (currentIndex !== -1) {
      if (currentIndex < siblings.length - 1) {
        nextSibling = siblings[currentIndex + 1];
      }
    }
  }

  return (
    <article className="max-w-4xl mx-auto pb-12">
      {/* Navigation Header */}
      <div className="mb-8 flex items-center justify-between">
        {parent ? (
          <Link
            href={`/informes/${parent.slug}`}
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
          >
            <div className="p-1 rounded-full border bg-background group-hover:border-primary/50 transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </div>
            <span className="hidden sm:inline">Volver a {parent.titulo}</span>
            <span className="sm:hidden">Volver</span>
          </Link>
        ) : (
          <Link
            href="/informes"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
          >
            <div className="p-1 rounded-full border bg-background group-hover:border-primary/50 transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </div>
            <span className="hidden sm:inline">Volver a Informes</span>
            <span className="sm:hidden">Volver</span>
          </Link>
        )}

        {/* Sibling Navigation - Only showing Next as requested ("paginador siguiente hermano") */}
        {nextSibling && (
          <Link
            href={`/informes/${nextSibling.slug}`}
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-2 group text-right"
          >
            <div className="flex flex-col items-end">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Siguiente
              </span>
              <span className="max-w-[150px] truncate">
                {nextSibling.titulo}
              </span>
            </div>
            <div className="p-1 rounded-full border bg-background group-hover:border-primary/50 transition-colors">
              <ChevronRight className="h-4 w-4" />
            </div>
          </Link>
        )}
      </div>

      <NewsDetail initialData={reportItem} hideSources={true} />

      {/* Children List / Menu */}
      {children.length > 0 && (
        <div className="mt-16 pt-8 border-t">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-muted-foreground" />
            Contenido de este informe
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {children.map((child) => {
              // Isolate description extraction
              const contenido = child.contenido as any;
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
                  key={child.id}
                  title={child.titulo}
                  description={description}
                  date={child.createdAt}
                  href={`/informes/${child.slug}`}
                  imageUrl={child.imagen_destacada?.url}
                  imageAlt={child.imagen_destacada?.alt}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Sources Section Rendering at the bottom */}
      <SourcesSection content={reportItem.fuentes} />
    </article>
  );
}

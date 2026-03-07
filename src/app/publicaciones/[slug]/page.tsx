import { getReportItem, getReports, resolveLexicalWidgets } from "@/lib/api";
import { NewsDetail } from "@/components/NewsDetail";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { LayoutGrid } from "lucide-react";
import { SourcesSection } from "@/components/SourcesSection";
import { PublicationLayoutWrapper } from "@/components/PublicationLayoutWrapper";
import { RelatedPublications } from "@/components/RelatedPublications";
import { getTextFromNodes } from "@/components/RichTextParser";
import slugify from "slugify";
import { PublicationTableCard } from "@/components/PublicationTableCard";
import {
  extractAllTablaBlocks,
  shouldShowChart,
  getDescription,
  isEstadistica,
  hasRealContent,
} from "@/utils/publicacion";

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
      title: "Publicación no encontrada",
    };
  }

  return {
    title: `${reportItem.titulo} | Santiago en Datos`,
  };
}

function extractHeadings(
  node?: any,
): { id: string; text: string; level: number }[] {
  let headings: { id: string; text: string; level: number }[] = [];
  if (!node) return headings;

  // Check if current node is a heading
  if (node.type === "heading" && (node.tag === "h1" || node.tag === "h2")) {
    const text = getTextFromNodes(node.children);
    const id = slugify(text, { lower: true, strict: true });
    // Determine level
    const level = node.tag === "h1" ? 1 : 2;
    headings.push({ id, text, level });
  }

  // Recursively check children
  if (node.children && Array.isArray(node.children)) {
    node.children.forEach((child: any) => {
      headings = headings.concat(extractHeadings(child));
    });
  }

  return headings;
}

export default async function PublicationPage({ params }: PageProps) {
  const { slug } = await params;
  const reportItem = await getReportItem(slug);

  if (!reportItem) {
    notFound();
  }

  // Resolve embedded widgets in rich text content
  if (reportItem.contenido?.root?.children) {
    reportItem.contenido.root.children = await resolveLexicalWidgets(
      reportItem.contenido.root.children,
    );
  }

  const parent =
    typeof reportItem.parent === "object" ? reportItem.parent : null;

  // 1. Fetch Children (Sub-reports)
  const childrenData = await getReports({
    where: { parent: { equals: reportItem.id } },
    sort: "createdAt", // or bespoke sort order if available
    limit: 100,
  });
  const children = childrenData.docs;

  // 3. Extract Headings for TOC
  const headings = extractHeadings(reportItem.contenido?.root);

  // Determine Back Link
  const backLink = parent
    ? {
        href: `/publicaciones/${parent.slug}`,
        label: `Volver a ${parent.titulo}`,
      }
    : { href: "/publicaciones", label: "Volver a Publicaciones" };

  return (
    <>
      <PublicationLayoutWrapper
        headings={headings}
        childrenReports={children}
        parentReport={parent}
        currentSlug={slug}
        backLink={backLink}
        title={reportItem.titulo}
        publicationId={reportItem.id}
      >
        {/* Main Content */}
        <NewsDetail
          initialData={reportItem}
          hideSources={true}
          childrenItems={children.map((c) => ({
            titulo: c.titulo,
            contenido: c.contenido,
          }))}
        />

        {(() => {
          const hasParentContent = hasRealContent(
            reportItem.contenido,
            reportItem.layout,
          );

          return (
            <>
              {/* Children List Grid */}
              {children.length > 0 && (
                <div
                  className={
                    hasParentContent
                      ? "mt-16 pt-8 border-t border-border"
                      : "mt-8"
                  }
                >
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <LayoutGrid className="h-5 w-5 text-muted-foreground" />
                    Secciones
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {children.map((child) => {
                      if (isEstadistica(child)) {
                        return (
                          <div
                            key={child.id}
                            id={child.slug}
                            className="col-span-1 md:col-span-2 mt-8 mb-4 bg-background rounded-xl p-0"
                          >
                            <NewsDetail
                              initialData={child}
                              hideSources={true}
                              isEmbedded={true}
                            />
                          </div>
                        );
                      }

                      const description = getDescription(child);
                      const showChart = shouldShowChart(child);
                      const tablaBlocks = showChart
                        ? extractAllTablaBlocks(child.contenido)
                        : [];

                      return (
                        <div
                          key={child.id}
                          id={child.slug}
                          className="flex flex-col"
                        >
                          {showChart && tablaBlocks.length > 0 ? (
                            <PublicationTableCard
                              titulo={child.titulo}
                              slug={child.slug}
                              description={description}
                              date={child.createdAt}
                              tablas={tablaBlocks}
                            />
                          ) : (
                            <Card
                              title={child.titulo}
                              description={description}
                              date={child.createdAt}
                              href={`/publicaciones/${child.slug}`}
                              imageUrl={child.imagen_destacada?.url}
                              imageAlt={child.imagen_destacada?.alt}
                              tipoPublicacion={child.tipo_publicacion}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          );
        })()}

        {/* Sources Section */}
        <div className="mt-12">
          <SourcesSection content={reportItem.fuentes} />
        </div>

        {/* Related Publications */}
        <RelatedPublications
          currentId={reportItem.id}
          tipoId={
            typeof reportItem.tipo_publicacion === "object"
              ? reportItem.tipo_publicacion?.id
              : reportItem.tipo_publicacion
          }
        />
      </PublicationLayoutWrapper>
    </>
  );
}

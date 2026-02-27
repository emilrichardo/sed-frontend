import {
  getCategoryBySlug,
  getCategories,
  getPublicacionesByCategoria,
} from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { PublicationTableSlider } from "@/components/PublicationTableSlider";
import { extractAllTablaBlocks, shouldShowChart } from "@/utils/publicacion";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, ChevronLeft } from "lucide-react";
import { Metadata } from "next";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Categoría no encontrada" };
  return { title: `${category.nombre} — Santiago en Datos` };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const [children, publicaciones] = await Promise.all([
    getCategories({ padreId: category.id }),
    getPublicacionesByCategoria(category.id),
  ]);

  return (
    <div className="py-8 md:py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Inicio
      </Link>

      <div className="mb-10">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
          Categoría
        </p>
        <h1 className="text-4xl md:text-5xl font-heading font-bold leading-tight">
          {category.nombre}
        </h1>
        {category.descripcion && (
          <p className="mt-4 text-muted-foreground max-w-2xl leading-relaxed">
            {category.descripcion}
          </p>
        )}
      </div>

      {/* Subcategorías */}
      {children.length > 0 && (
        <section className="mb-12">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-5">
            Subcategorías
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {children.map((child) => (
              <Link
                key={child.id}
                href={`/categorias/${child.slug}`}
                className="group flex flex-col border border-border bg-card hover:bg-muted/50 transition-colors rounded-lg p-6 min-h-[180px]"
              >
                <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors mb-4" />
                <span className="text-2xl font-heading font-bold leading-tight group-hover:text-primary transition-colors">
                  {child.nombre}
                </span>
                {child.descripcion && (
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {child.descripcion}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Publicaciones */}
      <section>
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-5">
          Publicaciones
          {publicaciones.totalDocs > 0 && (
            <span className="ml-2 text-foreground">
              {publicaciones.totalDocs}
            </span>
          )}
        </p>

        {publicaciones.docs.length === 0 ? (
          <div className="border border-border rounded-lg p-8 text-center text-muted-foreground">
            <p className="text-sm">No hay publicaciones en esta categoría.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {publicaciones.docs.map((pub) => {
              const contenido = pub.contenido as {
                root?: { children?: Array<{ children?: { text?: string }[] }> };
              };

              let description = "";
              if (contenido?.root?.children) {
                const firstText = contenido.root.children.find(
                  (child: { children?: { text?: string }[] }) =>
                    child.children?.length && child.children[0].text,
                );
                if (firstText) description = firstText.children![0].text!;
              }

              const showChart = shouldShowChart(pub);
              const tablaBlocks = showChart
                ? extractAllTablaBlocks(pub.contenido)
                : [];

              return (
                <Card
                  key={pub.id}
                  title={pub.titulo}
                  description={description}
                  date={pub.createdAt}
                  href={`/publicaciones/${pub.slug}`}
                  imageUrl={
                    tablaBlocks.length > 0
                      ? undefined
                      : pub.imagen_destacada?.url
                  }
                  imageAlt={pub.imagen_destacada?.alt}
                  chartPreview={
                    tablaBlocks.length > 0 ? (
                      <div className="w-full h-full relative">
                        <PublicationTableSlider blocks={tablaBlocks} />
                      </div>
                    ) : undefined
                  }
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

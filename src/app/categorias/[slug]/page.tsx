import { getCategoryBySlug, getCategories, getPublicacionesByCategoria } from "@/lib/api";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, ChevronLeft } from "lucide-react";
import { Metadata } from "next";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
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
            <span className="ml-2 text-foreground">{publicaciones.totalDocs}</span>
          )}
        </p>

        {publicaciones.docs.length === 0 ? (
          <div className="border border-border rounded-lg p-8 text-center text-muted-foreground">
            <p className="text-sm">No hay publicaciones en esta categoría.</p>
          </div>
        ) : (
          <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
            {publicaciones.docs.map((pub) => (
              <Link
                key={pub.id}
                href={`/publicaciones/${pub.slug}`}
                className="group flex items-center justify-between px-6 py-5 bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="min-w-0">
                  <h3 className="text-lg font-heading font-bold leading-snug group-hover:text-primary transition-colors truncate">
                    {pub.titulo}
                  </h3>
                  {pub.createdAt && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(pub.createdAt).toLocaleDateString("es-AR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  )}
                </div>
                <ArrowUpRight className="h-5 w-5 shrink-0 ml-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

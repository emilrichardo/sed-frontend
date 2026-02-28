import {
  getCategoryBySlug,
  getCategories,
  getPublicacionesByCategoria,
} from "@/lib/api";
import { CategoryPublicationsList } from "@/components/CategoryPublicationsList";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { BackButton } from "@/components/BackButton";
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
      <BackButton className="mb-8" />

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
          <nav
            className="-mx-4 md:-mx-8 border-b border-border"
            aria-label="Subcategorías"
          >
            {children.map((child) => (
              <Link
                key={child.id}
                href={`/categorias/${child.slug}`}
                className="flex items-center justify-between w-full px-4 md:px-8 py-5 border-t border-border hover:bg-muted/50 transition-colors group"
              >
                <div>
                  <span className="text-2xl md:text-3xl font-heading font-bold tracking-tight group-hover:text-primary transition-colors">
                    {child.nombre}
                  </span>
                  {child.descripcion && (
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {child.descripcion}
                    </p>
                  )}
                </div>
                <ArrowUpRight className="h-6 w-6 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </nav>
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

        <CategoryPublicationsList publications={publicaciones.docs} />
      </section>
    </div>
  );
}

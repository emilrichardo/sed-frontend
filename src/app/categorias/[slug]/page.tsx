import {
  getCategoryBySlug,
  getCategories,
  getPublicacionesByCategoriaIds,
} from "@/lib/api";
import type { Category } from "@/lib/api";
import { CategoryPublicationsList } from "@/components/CategoryPublicationsList";
import { CategoryPageNav } from "@/components/CategoryPageNav";
import { notFound } from "next/navigation";
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

  const children = await getCategories({ padreId: category.id });

  const parentCategory =
    category.parent && typeof category.parent === "object"
      ? (category.parent as Category)
      : null;

  const backLink = parentCategory
    ? {
        href: `/categorias/${parentCategory.slug}`,
        label: parentCategory.nombre,
      }
    : { href: "/publicaciones", label: "Publicaciones" };

  // Fetch publications for this category and all its subcategories
  const allCategoryIds = [category.id, ...children.map((c) => c.id)];
  const publicaciones = await getPublicacionesByCategoriaIds(allCategoryIds);

  return (
    <>
      <CategoryPageNav
        title={category.nombre}
        backHref={backLink.href}
        backLabel={backLink.label}
      />

      <div className="py-8 md:py-12">
        <div className="mb-10">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
            {parentCategory ? "Subcategoría" : "Categoría"}
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
    </>
  );
}

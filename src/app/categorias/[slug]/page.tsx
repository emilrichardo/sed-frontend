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
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getAllCategorySlugs } from "@/lib/static-params";

const isRootCategory = (children: Category[]) => children.length > 0;

export const revalidate = 300;
export async function generateStaticParams() {
  const slugs = await getAllCategorySlugs();
  return slugs.map((slug) => ({ slug }));
}

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

  // Solo fetch publicaciones en subcategorías (sin hijos)
  const publicaciones =
    !isRootCategory(children)
      ? await getPublicacionesByCategoriaIds([category.id])
      : null;

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

        {/* Subcategorías */}
        {(children.length > 0 || category.slug === "finanzas-provinciales") && (
          <section className="mb-10">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-5">
              Subcategorías
            </p>
            <div className="border-t border-border">
              {category.slug === "finanzas-provinciales" && (
                <>
                  <Link
                    href="/ingresos"
                    className="flex items-center justify-between py-5 border-b border-border hover:bg-muted/50 transition-colors group -mx-4 px-4 md:-mx-8 md:px-8"
                  >
                    <span className="text-xl md:text-2xl font-heading font-bold tracking-tight group-hover:text-primary transition-colors">
                      Ingresos de la Provincia
                    </span>
                    <ArrowUpRight className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                  <Link
                    href="/ahorros"
                    className="flex items-center justify-between py-5 border-b border-border hover:bg-muted/50 transition-colors group -mx-4 px-4 md:-mx-8 md:px-8"
                  >
                    <span className="text-xl md:text-2xl font-heading font-bold tracking-tight group-hover:text-primary transition-colors">
                      Ahorros de la Provincia
                    </span>
                    <ArrowUpRight className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                </>
              )}
              {children
                .filter(
                  (sub) =>
                    sub.slug !== "ingresos-de-la-provincia" &&
                    sub.slug !== "ahorros-de-la-provincia",
                )
                .map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/categorias/${sub.slug}`}
                    className="flex items-center justify-between py-5 border-b border-border hover:bg-muted/50 transition-colors group -mx-4 px-4 md:-mx-8 md:px-8"
                  >
                    <span className="text-xl md:text-2xl font-heading font-bold tracking-tight group-hover:text-primary transition-colors">
                      {sub.nombre}
                    </span>
                    <ArrowUpRight className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                ))}
            </div>
          </section>
        )}

        {/* Publicaciones — solo en subcategorías */}
        {publicaciones && (
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
        )}
      </div>
    </>
  );
}

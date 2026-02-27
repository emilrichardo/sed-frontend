import { getCategoryBySlug, getCategories } from "@/lib/api";
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

  const children = await getCategories({ padreId: category.id });

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

      {children.length === 0 ? (
        <div className="border border-border p-8 text-center text-muted-foreground">
          <p className="text-sm">No hay subcategorías disponibles.</p>
        </div>
      ) : (
        <>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-5">
            Subcategorías
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-border">
            {children.map((child) => (
              <Link
                key={child.id}
                href={`/categorias/${child.slug}`}
                className="group flex flex-col justify-between p-6 bg-background hover:bg-muted transition-colors min-h-[140px]"
              >
                <span className="text-base font-semibold leading-snug group-hover:text-primary transition-colors">
                  {child.nombre}
                </span>
                {child.descripcion && (
                  <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                    {child.descripcion}
                  </p>
                )}
                <div className="flex justify-end mt-4">
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

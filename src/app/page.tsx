import { getBulletins, getReports, getCategories } from "@/lib/api";
import type { Category } from "@/lib/api";
import { HomeHero } from "@/components/HomeHero";
import { HomeCategorySection } from "@/components/HomeCategorySection";
import { StatsCarousel } from "@/components/StatsCarousel";
import { ResponsivePublicationCard } from "@/components/PublicationCard";
import { WeatherWidget } from "@/components/WeatherWidget";
import { DollarWidget } from "@/components/DollarWidget";
import { MobileScrollTransition } from "@/components/MobileScrollTransition";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const revalidate = 60;

export default async function Home() {
  const [bulletins, reports, allCategories] = await Promise.all([
    getBulletins({ limit: 1 }),
    getReports({ limit: 4 }),
    getCategories({ limit: 100 }),
  ]);

  const latestBulletin = bulletins.docs[0];

  // Build category tree for the shared CategoryMenu
  const roots = allCategories.filter((c: Category) => !c.parent);
  const childrenList = allCategories.filter((c: Category) => c.parent);
  const categoryTree = roots.map((root: Category) => ({
    ...root,
    children: childrenList.filter((c: Category) => {
      const pid =
        typeof c.parent === "object" ? (c.parent as Category)?.id : c.parent;
      return String(pid) === String(root.id);
    }),
  }));

  return (
    <div className="w-full">
      {/* ── Hero — compacts vertically on scroll ── */}
      <HomeHero />

      {/* ── Stats ticker ── */}
      <div className="-mx-4 md:-mx-8 border-b border-border">
        <StatsCarousel />
      </div>

      {/* ── Info Widgets: Clima + Dólar ── */}
      <div className="py-2 flex items-center gap-2 flex-wrap">
        <WeatherWidget />
        <DollarWidget />
      </div>

      {/* ── Categories ── */}
      <div className="-mx-4 md:-mx-8 border-b border-border">
        <HomeCategorySection categories={categoryTree} />
      </div>

      {/* ── Informes Recientes ── */}
      {reports.docs.length > 0 && (
        <section className="py-8 md:py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-bold font-heading">
              Informes Recientes
            </h2>
            <Link
              href="/publicaciones"
              className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
            >
              Ver más <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {reports.docs.map((pub) => (
              <ResponsivePublicationCard
                key={pub.id}
                item={pub}
                showParent={true}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Último Boletín ── */}
      <section className="pb-8 md:pb-12">
        {latestBulletin ? (
          <Link
            href={`/boletines/${latestBulletin.slug}`}
            className="block p-5 md:p-6 border bg-card hover:bg-muted/50 transition-all group rounded-lg shadow-sm hover:shadow-md"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg md:text-xl font-bold group-hover:text-primary transition-colors">
                  Boletín Oficial Nº {latestBulletin.numero}
                </h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Publicado el{" "}
                  {new Date(
                    latestBulletin.fecha_publicacion,
                  ).toLocaleDateString("es-AR")}
                </p>
              </div>
              <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold font-mono border border-primary rounded-full shrink-0">
                {latestBulletin.año_edicion}
              </span>
            </div>
            <div className="flex gap-4 text-xs md:text-sm text-muted-foreground">
              <span>{latestBulletin.cantidad_paginas} páginas</span>
            </div>
          </Link>
        ) : (
          <p className="text-muted-foreground italic text-sm">
            No hay boletines disponibles.
          </p>
        )}
      </section>

      {/* ── Mobile scroll transition → Publicaciones ── */}
      <MobileScrollTransition nextPage="/publicaciones" nextLabel="Publicaciones" />
    </div>
  );
}

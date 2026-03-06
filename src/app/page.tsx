import {
  getBulletins,
  getReports,
  getCategories,
  getSiteStatCounts,
} from "@/lib/api";
import type { Category } from "@/lib/api";
import { HomeHero } from "@/components/HomeHero";
import { HomeCategorySection } from "@/components/HomeCategorySection";
import { StatsCarousel } from "@/components/StatsCarousel";
import { PublicationCarousel } from "@/components/PublicationCarousel";
import { WeatherWidget } from "@/components/WeatherWidget";
import { DollarWidget } from "@/components/DollarWidget";
import { HomeWidgetGroup } from "@/components/HomeWidgetGroup";
import { DesktopCategoryBar } from "@/components/DesktopCategoryBar";
import { MobileScrollTransition } from "@/components/MobileScrollTransition";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const revalidate = 60;

export default async function Home() {
  const [bulletins, reports, allCategories, statCounts] = await Promise.all([
    getBulletins({ limit: 1 }),
    getReports({ limit: 12 }),
    getCategories({ limit: 100 }),
    getSiteStatCounts(),
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
      {/* ── Stats ticker ── */}
      <div className="-mx-4 md:-mx-8">
        <StatsCarousel counts={statCounts} />
      </div>
      {/* ── Hero — compacts vertically on scroll ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 -mx-4 md:-mx-8 ">
        <HomeHero className="col-span-2" />
        {/* ── Finanzas Provinciales widgets ── */}
        <div className="col-span-1">
          <HomeWidgetGroup />
        </div>
      </div>

      {/* ── Desktop horizontal category bar ── */}
      <div className="-mx-4 md:-mx-8 border-b border-t border-border mt-4">
        <DesktopCategoryBar categories={categoryTree} />
      </div>

      {/* ── Mobile vertical category list ── */}
      <div className="md:hidden -mx-4">
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
          <PublicationCarousel
            items={reports.docs.filter((pub) => {
              const tp = pub.tipo_publicacion;
              return typeof tp === "object" && tp !== null && "slug" in tp
                ? tp.slug === "informes"
                : String(tp) === "informes";
            })}
          />
        </section>
      )}

      {/* ── Mobile scroll transition → Publicaciones ── */}
      <MobileScrollTransition
        nextPage="/publicaciones"
        nextLabel="Publicaciones"
      />
    </div>
  );
}

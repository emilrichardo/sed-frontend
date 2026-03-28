import { redirect } from "next/navigation";
import {
  getBulletins,
  getReports,
  getCategories,
  getSiteStatCounts,
  sortCategoriesByOrder,
} from "@/lib/api";
import type { Category } from "@/lib/api";
import { HomeHero } from "@/components/HomeHero";
import { HomeCategorySection } from "@/components/HomeCategorySection";
import { StatsCarousel } from "@/components/StatsCarousel";
import { PublicationCarousel } from "@/components/PublicationCarousel";
import { ResponsivePublicationCard } from "@/components/PublicationCard";
import { WeatherWidget } from "@/components/WeatherWidget";
import { DollarWidget } from "@/components/DollarWidget";
import { HomeWidgetGroup } from "@/components/HomeWidgetGroup";
import { DesktopCategoryBar } from "@/components/DesktopCategoryBar";
import { MobileScrollTransition } from "@/components/MobileScrollTransition";
import Link from "next/link";
import { ArrowRight, Newspaper, ArrowUpRight } from "lucide-react";

export const revalidate = 60;

export default async function Home() {
  if (process.env.COMINGSOON === "true") {
    redirect("/proximamente");
  }

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
  const categoryTree = sortCategoriesByOrder(
    roots.map((root: Category) => ({
      ...root,
      children: childrenList.filter((c: Category) => {
        const pid =
          typeof c.parent === "object" ? (c.parent as Category)?.id : c.parent;
        return String(pid) === String(root.id);
      }),
    })),
  );

  return (
    <div className="w-full">
      {/* ── Stats ticker ── */}
      <div className="-mx-4 md:-mx-8">
        <StatsCarousel counts={statCounts} />
      </div>
      {/* ── Hero — compacts vertically on scroll ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3  md:-mx-8 ">
        <HomeHero className="md:col-span-2" />
        {/* ── Finanzas Provinciales widgets ── */}
        <div className="col-span-1">
          <HomeWidgetGroup />
        </div>
      </div>

      {/* ── Desktop horizontal category bar ── */}
      <div className="-mx-4 md:-mx-8. mt-4">
        <DesktopCategoryBar categories={categoryTree} />
      </div>

      {/* ── Mobile vertical category list ── */}
      <div className="md:hidden -mx-4">
        <HomeCategorySection categories={categoryTree} />
      </div>

      {/* ── Informes Recientes ── (mobile only) */}
      {(() => {
        const informes = reports.docs.filter((pub) => {
          const tp = pub.tipo_publicacion;
          return typeof tp === "object" && tp !== null && "slug" in tp
            ? tp.slug === "informes"
            : String(tp) === "informes";
        });
        if (informes.length === 0) return null;
        const [featured, ...rest] = informes;
        return (
          <section className="py-8 md:hidden">
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

            {/* Pinned latest publication */}
            <div className="mb-6">
              <ResponsivePublicationCard item={featured} showParent={false} />
            </div>

            {/* Rest in carousel */}
            {rest.length > 0 && <PublicationCarousel items={rest} />}
          </section>
        );
      })()}

      {/* ── Mobile scroll transition → Publicaciones ── */}
      <MobileScrollTransition
        nextPage="/publicaciones"
        nextLabel="Publicaciones"
      />
    </div>
  );
}

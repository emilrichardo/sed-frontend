import { getReports } from "@/lib/api";
import type { ReportItem } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { BarChart } from "lucide-react";
import { PublicationsList } from "@/components/PublicationsList";
import type { FlatPublication } from "@/components/PublicationsList";
import { FeaturedPublicationsSlider } from "@/components/FeaturedPublicationsSlider";

export const revalidate = 60;

export default async function PublicationsArchivePage() {
  const all = await getReports({ limit: 200, sort: "-createdAt", depth: 2 });
  const items = all.docs;

  // Build id→item lookup for parent resolution
  const parentMap = new Map<number, ReportItem>();
  items.forEach((item) => parentMap.set(item.id, item));

  // Exclude estadísticas publications
  const nonStatItems = items.filter((item) => {
    const tp = item.tipo_publicacion;
    if (!tp || typeof tp !== "object") return true;
    const slug = (tp as { slug?: string }).slug ?? "";
    const nombre = (tp as { nombre?: string }).nombre ?? "";
    return (
      !slug.toLowerCase().includes("estadistica") &&
      !nombre.toLowerCase().includes("estadistica")
    );
  });

  // Flatten all publications with resolved parent info
  const flatItems: FlatPublication[] = nonStatItems.map((item) => {
    const parentVal = item.parent;
    const parentItem =
      parentVal && typeof parentVal === "object"
        ? (parentVal as ReportItem)
        : parentVal
          ? parentMap.get(parentVal as number)
          : undefined;
    const parentId = parentItem?.id as number | undefined;
    return {
      ...item,
      parentTitle: parentItem?.titulo,
      parentSlug: parentItem?.slug,
      parentId,
    };
  });

  // Extract unique categories + tags from all publications
  const catMap = new Map<
    string | number,
    { id: string | number; nombre: string; slug?: string }
  >();
  nonStatItems.forEach((item) => {
    [
      ...(item.categorias || []),
      ...(item.tags || []),
      ...(item.taxonomias || []),
    ].forEach((t) => {
      if (!catMap.has(t.id)) catMap.set(t.id, t);
    });
  });
  const allCategories = Array.from(catMap.values()).sort((a, b) =>
    a.nombre.localeCompare(b.nombre, "es"),
  );

  // Filter featured items (pinned) and resolve their children
  const featuredItems = flatItems
    .filter((item) => item.fijado)
    .slice(0, 5)
    .map((item) => ({
      ...item,
      children: flatItems.filter((i) => i.parentId === item.id),
    }));

  return (
    <div className="w-full max-w-[1440px] mx-auto py-8 md:py-12 space-y-8">
      <PageHeader
        title="Publicaciones"
        description="Publicaciones técnicas y análisis detallados de Santiago en Datos."
        icon={BarChart}
      />

      {featuredItems.length > 0 && (
        <section className="animate-in fade-in slide-in-from-top-4 duration-700">
          <FeaturedPublicationsSlider items={featuredItems} />
        </section>
      )}

      <PublicationsList items={flatItems} allCategories={allCategories} />
    </div>
  );
}

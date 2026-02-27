import { getReports } from "@/lib/api";
import type { ReportItem } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { BarChart } from "lucide-react";
import { PublicationsList } from "@/components/PublicationsList";
import type { FlatPublication } from "@/components/PublicationsList";

export const revalidate = 60;

export default async function PublicationsArchivePage() {
  const all = await getReports({ limit: 200, sort: "-createdAt", depth: 2 });
  const items = all.docs;

  // Build id→item lookup for parent resolution
  const parentMap = new Map<number, ReportItem>();
  items.forEach((item) => parentMap.set(item.id, item));

  // Flatten all publications with resolved parent info
  const flatItems: FlatPublication[] = items.map((item) => {
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
  items.forEach((item) => {
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

  return (
    <div className="w-full mx-auto px-4 py-8 md:py-12 space-y-8">
      <PageHeader
        title="Publicaciones"
        description="Publicaciones técnicas y análisis detallados de Santiago en Datos."
        icon={BarChart}
      />
      <PublicationsList items={flatItems} allCategories={allCategories} />
    </div>
  );
}

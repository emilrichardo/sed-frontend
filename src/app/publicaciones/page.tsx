import { getReports, getCategories } from "@/lib/api";
import type { ReportItem } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { BarChart } from "lucide-react";
import type { FlatPublication } from "@/components/PublicationsList";
import { PublicationsPageContent } from "@/components/PublicationsPageContent";
import { MobileScrollTransition } from "@/components/MobileScrollTransition";

export const revalidate = 60;

export default async function PublicationsArchivePage() {
  const [all, pinned, rootCategories, allCats] = await Promise.all([
    getReports({ pagination: false, limit: 1000, sort: "-createdAt", depth: 2 }),
    getReports({ limit: 5, sort: "-createdAt", depth: 2, where: { fijado: { equals: true } } }),
    getCategories({ sinPadre: true }),
    getCategories({ limit: 500 }),
  ]);
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

  const allCategories = rootCategories
    .map(({ id, nombre, slug }) => ({ id, nombre, slug }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  // Map: subcategoryId → rootCategoryId (for expanding filter matches)
  const catParentMap: Record<string, string> = {};
  allCats.forEach((cat) => {
    if (cat.parent) {
      const parentId =
        typeof cat.parent === "object" ? String(cat.parent.id) : String(cat.parent);
      catParentMap[String(cat.id)] = parentId;
    }
  });

  // Build featured items from dedicated pinned API call
  // This ensures pinned publications are always included regardless of sort/limit on main call
  const featuredItems = pinned.docs.map((item) => {
    const parentVal = item.parent;
    const parentItem =
      parentVal && typeof parentVal === "object"
        ? (parentVal as ReportItem)
        : parentVal
          ? parentMap.get(parentVal as number)
          : undefined;
    return {
      ...item,
      parentTitle: parentItem?.titulo,
      parentSlug: parentItem?.slug,
      parentId: parentItem?.id as number | undefined,
      children: flatItems.filter((i) => i.parentId === item.id),
    };
  });

  return (
    <div className="w-full max-w-[1440px] mx-auto py-8 md:py-12 space-y-8">
      <PageHeader
        title="Publicaciones"
        icon={BarChart}
      />

      <PublicationsPageContent
        featuredItems={featuredItems}
        flatItems={flatItems}
        allCategories={allCategories}
        catParentMap={catParentMap}
      />

      {/* ── Mobile scroll transition → Boletines ── */}
      <MobileScrollTransition nextPage="/boletines" nextLabel="Boletines" />
    </div>
  );
}

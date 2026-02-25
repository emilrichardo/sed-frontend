import { getReports } from "@/lib/api";
import type { ReportItem } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import Link from "next/link";
import { BarChart, ChevronRight } from "lucide-react";

export const revalidate = 60;

interface TreeNode extends ReportItem {
  children: TreeNode[];
}

function buildTree(items: ReportItem[]): TreeNode[] {
  const map = new Map<number, TreeNode>();
  const roots: TreeNode[] = [];

  items.forEach((item) => {
    map.set(item.id, { ...item, children: [] });
  });

  items.forEach((item) => {
    const node = map.get(item.id)!;
    const parentVal = item.parent;
    const parentId =
      parentVal && typeof parentVal === "object" ? parentVal.id : parentVal;
    if (parentId && map.has(parentId as number)) {
      map.get(parentId as number)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function getDescription(item: ReportItem): string {
  const contenido = item.contenido as any;
  if (contenido?.root?.children) {
    const firstText = contenido.root.children.find(
      (child: any) =>
        child.children &&
        child.children.length > 0 &&
        child.children[0].text,
    );
    if (firstText) return firstText.children[0].text;
  }
  return "";
}

function Level3List({ items }: { items: TreeNode[] }) {
  if (!items.length) return null;
  return (
    <ul className="mt-1 ml-4 space-y-1 border-l border-border pl-3">
      {items.map((child) => (
        <li key={child.id}>
          <Link
            href={`/publicaciones/${child.slug}`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <ChevronRight className="h-3 w-3 shrink-0" />
            {child.titulo}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Level2List({ items }: { items: TreeNode[] }) {
  if (!items.length) return null;
  return (
    <ul className="mt-4 space-y-2">
      {items.map((child) => (
        <li key={child.id}>
          <Link
            href={`/publicaciones/${child.slug}`}
            className="text-sm font-medium hover:text-primary transition-colors flex items-start gap-1.5"
          >
            <ChevronRight className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
            {child.titulo}
          </Link>
          <Level3List items={child.children} />
        </li>
      ))}
    </ul>
  );
}

export default async function PublicationsArchivePage() {
  const all = await getReports({ limit: 200, sort: "-createdAt" });
  const roots = buildTree(all.docs);

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 space-y-8">
      <PageHeader
        title="Publicaciones"
        description="Publicaciones técnicas y análisis detallados de Santiago en Datos."
        icon={BarChart}
      />

      {roots.length === 0 && (
        <div className="text-center py-20 border rounded-xl border-dashed">
          <p className="text-muted-foreground italic">
            No hay publicaciones disponibles.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {roots.map((root) => {
          const description = getDescription(root);
          return (
            <div
              key={root.id}
              className="w-full rounded-xl border border-border bg-card p-6"
            >
              <Link
                href={`/publicaciones/${root.slug}`}
                className="text-lg font-semibold hover:text-primary transition-colors leading-tight"
              >
                {root.titulo}
              </Link>
              {description && (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {description}
                </p>
              )}
              <Level2List items={root.children} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

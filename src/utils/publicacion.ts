import type { ReportItem } from "@/lib/api";

export interface TablaBlockData {
  tipo_visualizacion: string;
  data: { columns: Record<string, unknown>[]; rows: Record<string, unknown>[] };
  config_viz?: Record<string, unknown>;
  [key: string]: unknown;
}

type TaxItem = { id: string | number; nombre: string; slug?: string };

export function getDescription(
  item: ReportItem | { contenido?: unknown },
): string {
  const contenido = item.contenido as {
    root?: { children?: Array<{ children?: { text?: string }[] }> };
  };
  if (contenido?.root?.children) {
    const firstText = contenido.root.children.find(
      (child) =>
        child.children && child.children.length > 0 && child.children[0]?.text,
    );
    if (firstText) return firstText.children![0].text!;
  }
  return "Sin descripción";
}

export function getItemTags(item: ReportItem): TaxItem[] {
  return [
    ...(((item.categorias as TaxItem[]) || []) as TaxItem[]),
    ...(((item.tags as TaxItem[]) || []) as TaxItem[]),
    ...(((item.taxonomias as TaxItem[]) || []) as TaxItem[]),
  ];
}

export function getImg(
  item: ReportItem | { imagen_destacada?: unknown },
): { url?: string; alt?: string } | null {
  const img = item.imagen_destacada as
    | { url?: string; alt?: string }
    | undefined;
  return img?.url ? img : null;
}

/** Extracts ALL tabla blocks with data from Lexical content */
export function extractAllTablaBlocks(contenido: unknown): TablaBlockData[] {
  if (!contenido || typeof contenido !== "object" || !("root" in contenido))
    return [];
  const blocks: TablaBlockData[] = [];

  function search(node: unknown) {
    if (!node || typeof node !== "object") return;
    const n = node as Record<string, unknown>;
    if (
      n.type === "block" &&
      (n.fields as Record<string, unknown>)?.blockType === "tabla"
    ) {
      const fields = (n.fields as TablaBlockData) ?? {};
      if (fields.data?.columns?.length && fields.data?.rows?.length) {
        blocks.push(fields);
      }
    }
    if (Array.isArray(n.children)) n.children.forEach(search);
  }

  const rootNode = (contenido as Record<string, unknown>).root;
  search(rootNode);
  return blocks;
}

export function isEstadistica(pub: {
  tipo_publicacion?: { slug?: string } | number | null;
}): boolean {
  return !!(
    pub.tipo_publicacion &&
    typeof pub.tipo_publicacion === "object" &&
    (pub.tipo_publicacion as Record<string, unknown>).slug === "estadistica"
  );
}

/** Whether to show a chart preview instead of (or in absence of) image */
export function shouldShowChart(pub: {
  imagen_destacada?: unknown;
  tipo_publicacion?: { slug?: string } | number | null;
}): boolean {
  const hasImage = !!pub.imagen_destacada;
  const isEstat = isEstadistica(pub);
  return isEstat || !hasImage;
}

/** Same logic as TableBlock.isNumericColumn */
export function isNumericColumn(
  colId: string,
  rows: Record<string, unknown>[],
): boolean {
  const values = rows
    .map((row) =>
      row.cells && Array.isArray(row.cells)
        ? row.cells.find((c: Record<string, unknown>) => c.columnId === colId)
            ?.value
        : row[colId],
    )
    .filter((v) => v !== undefined && v !== null && v !== "");

  if (values.length === 0) return false;

  const numericCount = values.filter((v) => {
    const clean = v
      ?.toString()
      .trim()
      .replace(/[^0-9.,-]/g, "")
      .replace(/\./g, "")
      .replace(",", ".");
    return clean.length > 0 && !isNaN(parseFloat(clean));
  }).length;

  return numericCount >= Math.ceil(values.length * 0.6);
}

/** Robust check to ensure a publication actually has non-empty text or blocks */
export function hasRealContent(
  contenido: unknown,
  layout?: unknown[],
): boolean {
  if (layout && layout.length > 0) return true;
  if (!contenido || typeof contenido !== "object") return false;

  const root = (contenido as Record<string, unknown>).root as Record<
    string,
    unknown
  >;
  if (!root || !Array.isArray(root.children)) return false;

  const children = root.children;
  if (children.length === 0) return false;

  let foundRealContent = false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function checkNode(node: any) {
    if (!node || typeof node !== "object") return;

    if (
      node.type === "block" ||
      node.type === "image" ||
      node.type === "list" ||
      node.type === "quote"
    ) {
      foundRealContent = true;
      return;
    }

    if (
      node.type === "text" &&
      typeof node.text === "string" &&
      node.text.trim().length > 0
    ) {
      foundRealContent = true;
      return;
    }

    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        if (foundRealContent) return;
        checkNode(child);
      }
    }
  }

  for (const child of children) {
    if (foundRealContent) break;
    checkNode(child);
  }

  return foundRealContent;
}

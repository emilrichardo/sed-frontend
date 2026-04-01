/**
 * toMarkdown.ts
 * Converts a Payload CMS publication (Lexical rich text + tables + widgets)
 * to a full Markdown string with YAML frontmatter.
 *
 * Designed for:
 *  - User download (.md file)
 *  - AI model consumption (infographics, analysis, etc.)
 *  - SEO alternate format endpoint
 */

import type { NewsItem } from "./api";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function textFromNodes(nodes: unknown): string {
  if (!nodes) return "";
  if (Array.isArray(nodes)) return nodes.map(textFromNodes).join("");
  const n = nodes as Record<string, unknown>;
  if (typeof n.text === "string") return n.text;
  if (n.children) return textFromNodes(n.children);
  return "";
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function escYaml(s: string): string {
  return s.replace(/"/g, '\\"').replace(/\n/g, " ").trim();
}

// ---------------------------------------------------------------------------
// Table conversion
// ---------------------------------------------------------------------------

interface TableFields {
  data?: { columns?: unknown[]; rows?: unknown[] };
  tipo_visualizacion?: string;
  config_viz?: Record<string, string>;
  configuracion_visualizacion?: Record<string, string>;
  titulo?: string;
  notas?: string;
  fuentes?: string;
}

function tableFieldsToMarkdown(fields: TableFields): string {
  const { data, tipo_visualizacion, config_viz, configuracion_visualizacion, titulo, notas, fuentes } =
    fields;
  if (!data?.columns?.length || !data?.rows?.length) return "";

  const columns = data.columns as { id: string; header?: string; type?: string }[];
  const rows = data.rows as Record<string, unknown>[];
  const cfg = config_viz ?? configuracion_visualizacion ?? {};

  const parts: string[] = [];

  if (titulo) parts.push(`**${titulo}**\n`);

  // ---- Attribute block (blockquote style so it's parseable but non-intrusive) ----
  const attrs: string[] = [];
  attrs.push(`tipo_visualizacion: \`${tipo_visualizacion || "tabla"}\``);
  if (cfg.eje_principal) attrs.push(`eje_principal: ${cfg.eje_principal}`);
  if (cfg.eje_valores) attrs.push(`eje_valores: ${cfg.eje_valores}`);
  if (cfg.eje_secundario) attrs.push(`eje_secundario: ${cfg.eje_secundario}`);
  if (cfg.colores) attrs.push(`colores: ${cfg.colores}`);

  const colMeta = columns
    .map((c) => `${c.header || c.id}${c.type ? ` (${c.type})` : ""}`)
    .join(", ");
  attrs.push(`columnas: ${colMeta}`);
  attrs.push(`filas: ${rows.length}`);

  parts.push(attrs.map((a) => `> ${a}`).join("\n") + "\n");

  if (notas) parts.push(`> **Notas:** ${notas}\n`);
  if (fuentes) parts.push(`> **Fuentes:** ${fuentes}\n`);

  // ---- Markdown table ----
  const headers = columns.map((c) =>
    (c.header || c.id).replace(/\|/g, "\\|").replace(/\n/g, " ")
  );
  parts.push("| " + headers.join(" | ") + " |");
  parts.push("| " + headers.map(() => "---").join(" | ") + " |");

  for (const row of rows) {
    const cells = columns.map((col) => {
      let val: unknown = "";
      // Legacy cells array format
      if (row.cells && Array.isArray(row.cells)) {
        const cell = (row.cells as { columnId: string; value: unknown }[]).find(
          (c) => c.columnId === col.id
        );
        val = cell?.value ?? "";
      } else {
        val = row[col.id] ?? "";
      }
      return String(val ?? "")
        .replace(/\|/g, "\\|")
        .replace(/\n/g, " ")
        .trim();
    });
    parts.push("| " + cells.join(" | ") + " |");
  }

  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// Widget conversion
// ---------------------------------------------------------------------------

function widgetToMarkdown(widget: Record<string, unknown>): string {
  const parts: string[] = [];
  parts.push(`\n---\n`);
  parts.push(`### Widget: ${widget.title || "Sin título"}\n`);
  if (widget.description) parts.push(`${widget.description}\n`);
  if (widget.category) parts.push(`> Categoría: ${widget.category}\n`);

  const tablas = widget.tablas_graficos as Record<string, unknown>[] | undefined;
  if (Array.isArray(tablas)) {
    for (const tg of tablas) {
      // Resolve data source (collection vs manual)
      const sourceData =
        tg.source_type === "collection"
          ? (tg.tabla_relacionada as Record<string, unknown> | undefined)?.data
          : (tg.fields as Record<string, unknown> | undefined)?.data;

      const resolved = (sourceData ?? tg.data) as TableFields["data"];
      if (resolved?.columns?.length && resolved?.rows?.length) {
        const md = tableFieldsToMarkdown({
          data: resolved,
          tipo_visualizacion: tg.tipo_visualizacion as string | undefined,
          configuracion_visualizacion: tg.configuracion_visualizacion as
            | Record<string, string>
            | undefined,
          titulo: tg.titulo as string | undefined,
        });
        if (md) parts.push("\n" + md + "\n");
      }
    }
  }

  parts.push(`\n---\n`);
  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// Lexical node → Markdown (recursive)
// ---------------------------------------------------------------------------

interface NodeCtx {
  listType?: "ul" | "ol";
  depth?: number;
}

function nodeToMd(node: unknown, ctx: NodeCtx = {}): string {
  if (!node) return "";

  if (Array.isArray(node)) {
    return node.map((n) => nodeToMd(n, ctx)).join("");
  }

  const n = node as Record<string, unknown>;

  // ---- Text leaf ----
  if (n.text !== undefined) {
    let t = (n.text as string) || "";
    if (!t) return "";
    // Apply inline formatting (order matters: bold before italic)
    if (n.bold && n.italic) t = `***${t}***`;
    else if (n.bold) t = `**${t}**`;
    else if (n.italic) t = `*${t}*`;
    if (n.code) t = `\`${t}\``;
    if (n.strikethrough) t = `~~${t}~~`;
    return t;
  }

  const childMd = n.children ? nodeToMd(n.children as unknown[], ctx) : "";

  switch (n.type as string) {
    // ---- Headings ----
    case "heading":
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6": {
      const tag = (n.tag as string) || (n.type as string);
      const lvl = Math.min(Math.max(parseInt(tag.replace("h", "")) || 1, 1), 6);
      return `\n${"#".repeat(lvl)} ${childMd.trim()}\n`;
    }

    // ---- Paragraph ----
    case "paragraph": {
      const text = childMd.trim();
      return text ? `\n${text}\n` : "";
    }

    // ---- Lists ----
    case "list": {
      const lt = n.tag === "ol" || n.listType === "number" ? "ol" : "ul";
      const items = (n.children as unknown[] | undefined || [])
        .map((child) => nodeToMd(child, { listType: lt, depth: ctx.depth ?? 0 }))
        .join("");
      return `\n${items}`;
    }

    case "listitem": {
      const depth = ctx.depth ?? 0;
      const indent = "  ".repeat(depth);
      const prefix = ctx.listType === "ol" ? `${(n.value as number) || 1}. ` : "- ";
      // Children may include nested lists
      const inner = (n.children as unknown[] | undefined || [])
        .map((child) => {
          const c = child as Record<string, unknown>;
          if (c.type === "list") {
            return nodeToMd(child, { depth: depth + 1 });
          }
          return nodeToMd(child, ctx);
        })
        .join("");
      return `${indent}${prefix}${inner.trim()}\n`;
    }

    // Legacy list types
    case "ul": {
      const items = (n.children as unknown[] | undefined || [])
        .map((child) => nodeToMd(child, { listType: "ul", depth: ctx.depth ?? 0 }))
        .join("");
      return `\n${items}`;
    }
    case "ol": {
      const items = (n.children as unknown[] | undefined || [])
        .map((child) => nodeToMd(child, { listType: "ol", depth: ctx.depth ?? 0 }))
        .join("");
      return `\n${items}`;
    }
    case "li":
      return `- ${childMd.trim()}\n`;

    // ---- Link ----
    case "link": {
      const url =
        (n.url as string) ||
        ((n.fields as Record<string, unknown>)?.url as string) ||
        "#";
      return `[${childMd}](${url})`;
    }

    // ---- Image / upload ----
    case "upload": {
      const media = n.value as Record<string, unknown> | undefined;
      if (!media?.url) return "";
      const caption =
        (media.caption as string) ||
        ((n.fields as Record<string, unknown>)?.caption as string) ||
        "";
      const alt = (media.alt as string) || caption || "Imagen";
      const lines = [`\n![${alt}](${media.url})`];
      if (caption) lines.push(`*${caption}*`);
      return lines.join("\n") + "\n";
    }

    // ---- Blockquote ----
    case "quote": {
      const qLines = childMd.trim().split("\n").filter(Boolean);
      return `\n${qLines.map((l) => `> ${l}`).join("\n")}\n`;
    }

    // ---- Relationship ----
    case "relationship": {
      const val = n.value as Record<string, unknown> | undefined;
      if (!val || typeof val !== "object") return "";
      const relTitle =
        (val.titulo as string) ||
        (val.identificador_de_acto as string) ||
        "Contenido relacionado";
      let relUrl = "#";
      if (n.relationTo === "boletines") {
        relUrl = `/boletines/${val.slug}`;
      } else if (val.slug) {
        relUrl = `/${n.relationTo}/${val.slug}`;
      }
      return `\n> **Relacionado:** [${relTitle}](${relUrl})\n`;
    }

    // ---- Custom blocks ----
    case "block": {
      const fields = n.fields as Record<string, unknown> | undefined;
      const bt = fields?.blockType as string | undefined;

      if (bt === "tabla" || bt === "table") {
        const md = tableFieldsToMarkdown(fields as TableFields);
        return md ? `\n${md}\n` : "";
      }

      if (bt === "widget_block" && fields?.widget) {
        return widgetToMarkdown(fields.widget as Record<string, unknown>);
      }

      return "";
    }

    // ---- Default: render children if available ----
    default: {
      if (n.children) {
        const text = childMd.trim();
        return text ? `\n${text}\n` : "";
      }
      return "";
    }
  }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export interface PublicationMdOptions {
  /** Include child sections (sub-reports) at end of document */
  includeChildren?: boolean;
  children?: { titulo: string; contenido: unknown; fuentes?: string }[];
}

/**
 * Converts a full publication (with resolved Lexical content) to Markdown.
 * Output includes YAML frontmatter with all metadata.
 */
export function publicationToMarkdown(
  item: NewsItem,
  opts: PublicationMdOptions = {},
): string {
  const lines: string[] = [];

  // ---- YAML frontmatter ----
  lines.push("---");
  lines.push(`titulo: "${escYaml(item.titulo)}"`);
  lines.push(`slug: "${item.slug}"`);

  if (item.createdAt) {
    lines.push(`fecha: "${new Date(item.createdAt).toISOString().split("T")[0]}"`);
  }
  if (item.publishedDate) {
    lines.push(`fecha_publicacion: "${item.publishedDate}"`);
  }

  const tipo =
    typeof item.tipo_publicacion === "object" && item.tipo_publicacion
      ? (item.tipo_publicacion as { nombre?: string }).nombre
      : undefined;
  if (tipo) lines.push(`tipo: "${escYaml(tipo)}"`);

  const autor =
    typeof item.autor === "object" && item.autor
      ? (item.autor as { nombre?: string; apellido?: string; cargo?: string })
      : null;
  if (autor?.nombre || autor?.apellido) {
    const fullName = [autor.nombre, autor.apellido].filter(Boolean).join(" ");
    lines.push(`autor: "${escYaml(fullName)}"`);
    if (autor.cargo) lines.push(`cargo_autor: "${escYaml(autor.cargo)}"`);
  }

  if (item.categorias?.length) {
    const cats = item.categorias.map((c) => `"${escYaml(c.nombre)}"`).join(", ");
    lines.push(`categorias: [${cats}]`);
  }
  if (item.tags?.length) {
    const tagList = item.tags.map((t) => `"${escYaml(t.nombre)}"`).join(", ");
    lines.push(`tags: [${tagList}]`);
  }
  if (item.taxonomias?.length) {
    const taxList = item.taxonomias.map((t) => `"${escYaml(t.nombre)}"`).join(", ");
    lines.push(`taxonomias: [${taxList}]`);
  }

  const img =
    typeof item.imagen_destacada === "object" && item.imagen_destacada
      ? (item.imagen_destacada as { url?: string; alt?: string })
      : null;
  if (img?.url) {
    lines.push(`imagen_destacada: "${img.url}"`);
    if (img.alt) lines.push(`imagen_destacada_alt: "${escYaml(img.alt)}"`);
  }

  lines.push("---");
  lines.push("");

  // ---- Title ----
  lines.push(`# ${item.titulo}`);

  // ---- Main body ----
  const root = (item.contenido as { root?: { children?: unknown[] } } | null | undefined)?.root;
  if (root?.children?.length) {
    const body = nodeToMd(root.children);
    lines.push(body);
  }

  // ---- Sources ----
  if (item.fuentes) {
    const fuentesMd = item.fuentes.includes("<")
      ? stripHtml(item.fuentes)
      : item.fuentes.trim();
    if (fuentesMd) {
      lines.push(`\n## Fuentes\n\n${fuentesMd}`);
    }
  }

  // ---- Child sections ----
  if (opts.includeChildren && opts.children?.length) {
    lines.push(`\n---\n\n## Secciones`);
    for (const child of opts.children) {
      lines.push(`\n### ${child.titulo}`);
      const childRoot = (child.contenido as { root?: { children?: unknown[] } } | null | undefined)?.root;
      if (childRoot?.children?.length) {
        lines.push(nodeToMd(childRoot.children));
      }
      if (child.fuentes) {
        const cf = child.fuentes.includes("<")
          ? stripHtml(child.fuentes)
          : child.fuentes.trim();
        if (cf) lines.push(`\n**Fuentes:** ${cf}`);
      }
    }
  }

  // Normalize excess blank lines
  return lines.join("\n").replace(/\n{4,}/g, "\n\n\n").trim() + "\n";
}

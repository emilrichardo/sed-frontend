/**
 * /publicaciones/[slug]/md
 *
 * Returns the full publication as raw Markdown (text/markdown).
 * Designed for:
 *  - AI crawlers and models (GPT, Gemini, Claude, etc.)
 *  - Automated pipelines that ingest structured data
 *  - <link rel="alternate" type="text/markdown"> discovery
 */

import { NextResponse } from "next/server";
import { getReportItem, getReports, resolveLexicalWidgets } from "@/lib/api";
import { publicationToMarkdown } from "@/lib/toMarkdown";
import { getAllPublicationSlugs } from "@/lib/static-params";

export const dynamic = "force-static";

export async function generateStaticParams() {
  const slugs = await getAllPublicationSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const reportItem = await getReportItem(slug);
  if (!reportItem) {
    return new NextResponse("Publicación no encontrada", { status: 404 });
  }

  // Resolve embedded widgets (same as the page does)
  if (reportItem.contenido?.root?.children) {
    reportItem.contenido.root.children = await resolveLexicalWidgets(
      reportItem.contenido.root.children,
    );
  }

  // Fetch child sections
  const childrenData = await getReports({
    where: { parent: { equals: reportItem.id } },
    sort: "createdAt",
    limit: 100,
  });

  // Resolve widgets in children too
  for (const child of childrenData.docs) {
    if (child.contenido?.root?.children) {
      child.contenido.root.children = await resolveLexicalWidgets(
        child.contenido.root.children,
      );
    }
  }

  const markdown = publicationToMarkdown(reportItem, {
    includeChildren: true,
    children: childrenData.docs.map((c) => ({
      titulo: c.titulo,
      contenido: c.contenido,
      fuentes: c.fuentes as string | undefined,
    })),
  });

  return new NextResponse(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `inline; filename="${slug}.md"`,
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

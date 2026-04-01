import type { MetadataRoute } from "next";
import { getReports } from "@/lib/api";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
  "https://santiagoendatos.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // ---- Static routes ----
  entries.push(
    { url: `${SITE_URL}/`, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/publicaciones`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
  );

  // ---- Publication pages ----
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const data = await getReports({ page, limit: 100, depth: 0 });

    for (const pub of data.docs) {
      if (!pub.slug) continue;
      const lastMod = pub.createdAt ? new Date(pub.createdAt) : new Date();

      // HTML page
      entries.push({
        url: `${SITE_URL}/publicaciones/${pub.slug}`,
        lastModified: lastMod,
        changeFrequency: "monthly",
        priority: 0.8,
      });

      // Markdown alternate (for AI crawlers / structured consumption)
      entries.push({
        url: `${SITE_URL}/publicaciones/${pub.slug}/md`,
        lastModified: lastMod,
        changeFrequency: "monthly",
        priority: 0.5,
      });
    }

    hasMore = data.page < data.totalPages;
    page++;
  }

  return entries;
}

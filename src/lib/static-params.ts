/**
 * Helpers para generateStaticParams en modo NEXT_STATIC_EXPORT=true.
 * En deploys con servidor, estas rutas se generan bajo demanda.
 */

import {
  getBulletins,
  getCategories,
  getReports,
  getActosAdministrativos,
  getActosAdministrativos as getAllActos,
} from "./api";

const shouldPrebuildDynamicRoutes =
  process.env.NEXT_STATIC_EXPORT === "true" ||
  process.env.NEXT_PREBUILD_DYNAMIC_ROUTES === "true";

export async function getAllBulletinSlugs(): Promise<string[]> {
  if (!shouldPrebuildDynamicRoutes) return [];

  const slugs: string[] = [];
  let page = 1;
  let hasMore = true;
  while (hasMore) {
    const data = await getBulletins({ page, limit: 100 });
    data.docs.forEach((b) => b.slug && slugs.push(b.slug));
    hasMore = data.page < data.totalPages;
    page++;
  }
  return slugs;
}

export async function getAllActoParams(): Promise<
  { slug: string; actoId: string }[]
> {
  if (!shouldPrebuildDynamicRoutes) return [];

  const params: { slug: string; actoId: string }[] = [];
  let page = 1;
  let hasMore = true;
  while (hasMore) {
    const data = await getAllActos({ page, limit: 500, depth: 1 });
    data.docs.forEach((acto) => {
      const boletin = acto.boletin;
      const bulletinSlug =
        typeof boletin === "object" && "slug" in boletin
          ? (boletin as { slug: string }).slug
          : null;
      if (bulletinSlug && acto.identificador_de_acto) {
        const encoded = encodeURIComponent(acto.identificador_de_acto);
        // Skip identifiers that would exceed filesystem path length limits
        if (encoded.length > 200) return;
        params.push({ slug: bulletinSlug, actoId: encoded });
      }
    });
    hasMore = data.page < data.totalPages;
    page++;
  }
  return params;
}

export async function getAllActoIds(): Promise<string[]> {
  if (!shouldPrebuildDynamicRoutes) return [];

  const ids: string[] = [];
  let page = 1;
  let hasMore = true;
  while (hasMore) {
    const data = await getActosAdministrativos({ page, limit: 500, depth: 0 });
    data.docs.forEach((acto) => ids.push(String(acto.id)));
    hasMore = data.page < data.totalPages;
    page++;
  }
  return ids;
}

export async function getAllCategorySlugs(): Promise<string[]> {
  if (!shouldPrebuildDynamicRoutes) return [];

  const cats = await getCategories({ limit: 500 });
  return cats.map((c) => c.slug).filter(Boolean);
}

export async function getAllPublicationSlugs(): Promise<string[]> {
  if (!shouldPrebuildDynamicRoutes) return [];

  const slugs: string[] = [];
  let page = 1;
  let hasMore = true;
  while (hasMore) {
    const data = await getReports({ page, limit: 100, depth: 0 });
    data.docs.forEach((r) => r.slug && slugs.push(r.slug));
    hasMore = data.page < data.totalPages;
    page++;
  }
  return slugs;
}

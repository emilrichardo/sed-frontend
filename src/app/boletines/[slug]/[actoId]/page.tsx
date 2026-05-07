import { getActoByIdentifier, ActoAdministrativo } from "@/lib/api";
import { getAllActoParams } from "@/lib/static-params";

export async function generateStaticParams() {
  return getAllActoParams();
}
import { ActDetailView } from "@/components/ActDetailView";
import ClientActoDetailFetcher from "@/components/ClientActoDetailFetcher";

export default async function ActoDetailPage({
  params,
}: {
  params: Promise<{ slug: string; actoId: string }>;
}) {
  const { slug, actoId } = await params;

  let entry: ActoAdministrativo | null = null;
  let serverError: string | null = null;

  try {
    entry = await getActoByIdentifier(decodeURIComponent(actoId), undefined, slug);
    if (
      entry &&
      typeof entry.boletin === "object" &&
      entry.boletin.slug &&
      entry.boletin.slug !== slug
    ) {
      throw new Error(`Acto not found in bulletin: ${slug}`);
    }
  } catch (err: unknown) {
    entry = null;
    serverError = err instanceof Error ? err.message : "Error desconocido";
    console.error(`Server fetch failed for acto ${actoId}:`, serverError);
  }

  if (entry) {
    return (
      <ActDetailView
        entry={entry}
        backLink={
          typeof entry.boletin === "object" && "slug" in entry.boletin
            ? `/boletines/${entry.boletin.slug}`
            : `/boletines/${slug}`
        }
      />
    );
  }

  // Fallback to client fetcher if server failed (e.g. due to auth/403)
  return (
    <ClientActoDetailFetcher
      identifier={decodeURIComponent(actoId)}
      slug={slug}
      initialError={serverError || undefined}
    />
  );
}

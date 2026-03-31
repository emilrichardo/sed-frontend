import { getActoByIdentifier, ActoAdministrativo } from "@/lib/api";
import { getAllActoParams } from "@/lib/static-params";
import { cookies } from "next/headers";

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

  // Verificar si el usuario está autenticado (cookie payload-token)
  const cookieStore = await cookies();
  const authToken = cookieStore.get("payload-token")?.value;

  try {
    entry = await getActoByIdentifier(decodeURIComponent(actoId), authToken);
  } catch (err: unknown) {
    serverError = err instanceof Error ? err.message : "Error desconocido";
    console.error(`Server fetch failed for acto ${actoId}:`, serverError);
  }

  if (entry) {
    return (
      <ActDetailView
        entry={entry}
        backLink={
          typeof entry.boletin === "object" && "slug" in entry.boletin
            ? `/boletines/${(entry.boletin as any).slug}`
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

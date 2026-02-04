import { getNewsItem, resolveLexicalWidgets } from "@/lib/api";
import { NewsDetail } from "@/components/NewsDetail";
import { notFound } from "next/navigation";
import Link from "next/link";

export const revalidate = 60;

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function NewsPage({ params }: PageProps) {
  const { slug } = await params;
  const newsItem = await getNewsItem(slug);

  if (!newsItem) {
    notFound();
  }

  // Resolve embedded widgets in rich text content
  if (newsItem.contenido?.root?.children) {
    newsItem.contenido.root.children = await resolveLexicalWidgets(
      newsItem.contenido.root.children,
    );
  }

  return (
    <article className="max-w-3xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <svg
          className="w-4 h-4 mr-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        Volver al inicio
      </Link>

      <NewsDetail initialData={newsItem} />

      {/* Debug view for raw data if needed, commented out for prod */}
      {/*
      <div className="mt-20 pt-10 border-t border-dashed border-border">
        <details>
          <summary className="cursor-pointer text-xs font-mono text-muted-foreground">Ver JSON crudo</summary>
          <pre className="mt-4 p-4 bg-muted text-xs overflow-auto max-h-96 rounded-sm">
            {JSON.stringify(newsItem, null, 2)}
          </pre>
        </details>
      </div>
      */}
    </article>
  );
}

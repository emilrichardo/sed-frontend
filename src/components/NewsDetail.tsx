import React from "react";
import { NewsItem } from "@/lib/api";
import { RichTextParser } from "@/components/RichTextParser";
import { BlockRenderer } from "@/components/BlockRenderer";
import { EditContentButton } from "@/components/EditContentButton";
import { SourcesSection } from "@/components/SourcesSection";
import { hasRealContent } from "@/utils/publicacion";
import { PublicationActions } from "@/components/PublicationActions";
import { PublicationTextToSpeech } from "@/components/PublicationTextToSpeech";
import { DownloadMdButton } from "@/components/DownloadMdButton";

interface NewsDetailProps {
  initialData: NewsItem;
  hideSources?: boolean;
  isEmbedded?: boolean;
  childrenItems?: Array<{ titulo: string; contenido: any }>;
  /** Pre-generated Markdown string for download/copy. Pass from server component. */
  mdContent?: string;
}

export const NewsDetail: React.FC<NewsDetailProps> = ({
  initialData,
  hideSources = false,
  isEmbedded = false,
  childrenItems = [],
  mdContent,
}) => {
  const hasContent = hasRealContent(initialData.contenido, initialData.layout);

  return (
    <>
      <header
        className={
          isEmbedded
            ? "mb-0 pb-0"
            : hasContent
              ? "mb-10 pb-8 border-b border-border"
              : "mb-0 pb-0"
        }
      >
        {isEmbedded ? (
          <h2
            className={`text-2xl md:text-3xl font-bold tracking-tight leading-tight ${
              hasContent ? "mb-4" : "mb-0"
            }`}
          >
            {initialData.titulo}
          </h2>
        ) : (
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-tight">
            {initialData.titulo}
          </h1>
        )}
        {initialData.createdAt && !isEmbedded && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mt-4">
            <time className="text-muted-foreground font-mono text-sm shrink-0">
              Publicado el{" "}
              {new Date(initialData.createdAt).toLocaleDateString("es-CL", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>

            {/* Author Section Logic */}
            {(() => {
              // Helper to resolve author object safely
              // We explicitly cast to any to handle potential runtime type mismatches gracefully,
              // though the API should return the correct shape.
              const rawAuthor = initialData.autor as any;
              const author =
                typeof rawAuthor === "object" && rawAuthor ? rawAuthor : null;

              // Ensure at least a name or surname is present to display
              if (!author || (!author.nombre && !author.apellido)) {
                return null;
              }

              return (
                <div className="flex items-center gap-3 pl-0 sm:pl-6 sm:border-l border-border/50">
                  {author.foto?.url ? (
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-border shrink-0 shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}

                      <img
                        src={author.foto.url}
                        alt={
                          author.foto.alt ||
                          `${author.nombre} ${author.apellido}`
                        }
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-border shrink-0 bg-muted flex items-center justify-center shadow-sm">
                      <span className="text-xs font-bold text-muted-foreground">
                        {(author.nombre || "?")[0]}
                        {(author.apellido || "?")[0]}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground mb-0.5">
                      Por
                    </span>
                    <span className="font-semibold text-foreground text-sm leading-none">
                      {author.nombre} {author.apellido}
                    </span>
                    {author.cargo && (
                      <span className="text-xs text-muted-foreground mt-0.5">
                        {author.cargo}
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}

            <EditContentButton
              collection="publicaciones"
              id={initialData.id}
              adminUrl={process.env.PAYLOAD_API_URL}
            />
          </div>
        )}

        {initialData.imagen_destacada?.url && !isEmbedded && (
          <div className="mt-8 rounded-lg overflow-hidden relative aspect-video shadow-sm border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={initialData.imagen_destacada.url}
              alt={initialData.imagen_destacada.alt || initialData.titulo}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* TTS (left) + Actions (right) — below image */}
        {!isEmbedded && (
          <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4 border-t border-border">
            <PublicationTextToSpeech
              content={initialData.contenido}
              title={initialData.titulo}
              childrenItems={childrenItems}
            />
            <div className="flex items-center gap-2 flex-wrap">
              <PublicationActions
                title={initialData.titulo}
                publicationId={initialData.id}
              />
              {mdContent && (
                <DownloadMdButton
                  markdown={mdContent}
                  filename={initialData.slug}
                />
              )}
            </div>
          </div>
        )}
      </header>

      {hasContent && (
        <div className="prose prose-neutral max-w-none font-sans mt-4">
          {initialData.contenido?.root?.children ? (
            <RichTextParser content={initialData.contenido.root.children} publicationId={initialData.id} />
          ) : (
            <BlockRenderer blocks={initialData.layout || []} />
          )}
        </div>
      )}

      {!hideSources && <SourcesSection content={initialData.fuentes} />}
    </>
  );
};

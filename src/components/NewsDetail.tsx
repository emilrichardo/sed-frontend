import React from "react";
import { NewsItem } from "@/lib/api";
import { RichTextParser } from "@/components/RichTextParser";
import { BlockRenderer } from "@/components/BlockRenderer";

interface NewsDetailProps {
  initialData: NewsItem;
}

export const NewsDetail: React.FC<NewsDetailProps> = ({ initialData }) => {
  return (
    <>
      <header className="mb-10 border-b border-border pb-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-tight">
          {initialData.titulo}
        </h1>
        {initialData.createdAt && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mt-4">
            <time className="text-muted-foreground font-mono text-sm shrink-0">
              Publicado el{" "}
              {new Date(initialData.createdAt).toLocaleDateString("es-CL", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>

            {initialData.autor && typeof initialData.autor === "object" && (
              <div className="flex items-center gap-3 pl-0 sm:pl-6 sm:border-l border-border/50">
                {initialData.autor.foto?.url ? (
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-border shrink-0 shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={initialData.autor.foto.url}
                      alt={
                        initialData.autor.foto.alt ||
                        `${initialData.autor.nombre} ${initialData.autor.apellido}`
                      }
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-border shrink-0 bg-muted flex items-center justify-center shadow-sm">
                    <span className="text-xs font-bold text-muted-foreground">
                      {initialData.autor.nombre?.[0]}
                      {initialData.autor.apellido?.[0]}
                    </span>
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground mb-0.5">
                    Por
                  </span>
                  <span className="font-semibold text-foreground text-sm leading-none">
                    {initialData.autor.nombre} {initialData.autor.apellido}
                  </span>
                  {initialData.autor.cargo && (
                    <span className="text-xs text-muted-foreground mt-0.5">
                      {initialData.autor.cargo}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {initialData.imagen_destacada?.url && (
          <div className="mt-8 rounded-lg overflow-hidden relative aspect-video shadow-sm border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={initialData.imagen_destacada.url}
              alt={initialData.imagen_destacada.alt || initialData.titulo}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </header>

      <div className="prose prose-neutral max-w-none font-sans">
        {initialData.contenido?.root?.children ? (
          <RichTextParser content={initialData.contenido.root.children} />
        ) : (
          <BlockRenderer blocks={initialData.layout || []} />
        )}
      </div>
    </>
  );
};

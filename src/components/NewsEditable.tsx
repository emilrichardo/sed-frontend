import React from "react";
import { NewsItem } from "@/lib/api";
import { RichTextParser } from "@/components/RichTextParser";
import { BlockRenderer } from "@/components/BlockRenderer";

interface NewsEditableProps {
  initialData: NewsItem;
}

export const NewsEditable: React.FC<NewsEditableProps> = ({ initialData }) => {
  // Read-only view, editing removed as requested

  return (
    <>
      <header className="mb-10 border-b border-border pb-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-tight">
          {initialData.titulo}
        </h1>
        {initialData.createdAt && (
          <time className="text-muted-foreground font-mono text-sm">
            Publicado el{" "}
            {new Date(initialData.createdAt).toLocaleDateString("es-CL", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
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

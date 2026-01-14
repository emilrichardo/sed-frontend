import React from "react";
import { PayloadBlock } from "@/lib/api";

// Placeholder for RichText renderer - will need to be expanded based on actual data
const RichText = ({ content }: { content: any }) => {
  if (!content) return null;
  // Simple recursive renderer for Slate/Lexical JSON structure
  // This is a simplified version and might need adjustment based on Payload config
  if (Array.isArray(content)) {
    return (
      <div className="prose prose-neutral max-w-none">
        {content.map((node, i) => (
          <RichText key={i} content={node} />
        ))}
      </div>
    );
  }

  if (content.text) {
    let text = <>{content.text}</>;
    if (content.bold) text = <strong>{text}</strong>;
    if (content.italic) text = <em>{text}</em>;
    if (content.code)
      text = (
        <code className="bg-muted px-1 py-0.5 rounded text-sm">{text}</code>
      );
    return text;
  }

  if (content.type === "h1")
    return (
      <h1 className="text-3xl font-bold mt-8 mb-4">
        <RichText content={content.children} />
      </h1>
    );
  if (content.type === "h2")
    return (
      <h2 className="text-2xl font-bold mt-6 mb-3">
        <RichText content={content.children} />
      </h2>
    );
  if (content.type === "h3")
    return (
      <h3 className="text-xl font-bold mt-4 mb-2">
        <RichText content={content.children} />
      </h3>
    );
  if (content.type === "ul")
    return (
      <ul className="list-disc pl-5 mb-4">
        <RichText content={content.children} />
      </ul>
    );
  if (content.type === "ol")
    return (
      <ol className="list-decimal pl-5 mb-4">
        <RichText content={content.children} />
      </ol>
    );
  if (content.type === "li")
    return (
      <li className="mb-1">
        <RichText content={content.children} />
      </li>
    );
  if (content.type === "link")
    return (
      <a
        href={content.url}
        className="underline decoration-1 underline-offset-2 hover:text-muted-foreground"
      >
        <RichText content={content.children} />
      </a>
    );

  if (content.children)
    return (
      <p className="mb-4 leading-relaxed">
        <RichText content={content.children} />
      </p>
    );

  return null;
};

interface BlockRendererProps {
  blocks: PayloadBlock[];
}

export const BlockRenderer: React.FC<BlockRendererProps> = ({ blocks }) => {
  if (!blocks || !Array.isArray(blocks)) {
    return null;
  }

  return (
    <div className="space-y-8">
      {blocks.map((block, index) => {
        const { blockType, id } = block;

        switch (blockType) {
          case "content": // Example standard block
          case "richText":
            return (
              <section key={id || index} className="max-w-2xl">
                <RichText content={block.richText || block.content} />
              </section>
            );

          case "media": // Example media block
          case "image":
            return (
              <figure key={id || index} className="my-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={block.media?.url || block.url}
                  alt={block.media?.alt || block.alt || "Image"}
                  className="w-full h-auto border border-border rounded-sm"
                />
                {(block.caption || block.media?.caption) && (
                  <figcaption className="text-sm text-muted-foreground mt-2 text-center">
                    {block.caption || block.media?.caption}
                  </figcaption>
                )}
              </figure>
            );

          // Add more block types here as we discover them

          default:
            // Fallback for unknown/custom blocks - render as JSON for debugging/doc style
            return (
              <div
                key={id || index}
                className="border border-dashed border-border p-4 rounded-sm bg-muted/30"
              >
                <p className="text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">
                  Block: {blockType}
                </p>
                <pre className="text-xs overflow-x-auto p-2 bg-muted rounded-sm">
                  {JSON.stringify(block, null, 2)}
                </pre>
              </div>
            );
        }
      })}
    </div>
  );
};

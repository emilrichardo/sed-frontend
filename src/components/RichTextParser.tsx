import React from "react";

export const RichTextParser = ({ content }: { content: any }) => {
  if (!content) return null;

  if (Array.isArray(content)) {
    return (
      <>
        {content.map((node: any, i: number) => (
          <RichTextParser key={i} content={node} />
        ))}
      </>
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
    if (content.strikethrough)
      text = <span className="line-through">{text}</span>;
    if (content.underline) text = <span className="underline">{text}</span>;
    return text;
  }

  if (!content.type) return null;

  switch (content.type) {
    case "h1":
      return (
        <h1 className="text-3xl font-bold mt-8 mb-4">
          <RichTextParser content={content.children} />
        </h1>
      );
    case "h2":
      return (
        <h2 className="text-2xl font-bold mt-6 mb-3">
          <RichTextParser content={content.children} />
        </h2>
      );
    case "h3":
      return (
        <h3 className="text-xl font-bold mt-4 mb-2">
          <RichTextParser content={content.children} />
        </h3>
      );
    case "h4":
      return (
        <h4 className="text-lg font-bold mt-4 mb-2">
          <RichTextParser content={content.children} />
        </h4>
      );
    case "h5":
      return (
        <h5 className="text-base font-bold mt-4 mb-2">
          <RichTextParser content={content.children} />
        </h5>
      );
    case "h6":
      return (
        <h6 className="text-sm font-bold mt-4 mb-2">
          <RichTextParser content={content.children} />
        </h6>
      );
    case "ul":
      return (
        <ul className="list-disc pl-5 mb-4">
          <RichTextParser content={content.children} />
        </ul>
      );
    case "ol":
      return (
        <ol className="list-decimal pl-5 mb-4">
          <RichTextParser content={content.children} />
        </ol>
      );
    case "li":
      return (
        <li className="mb-1">
          <RichTextParser content={content.children} />
        </li>
      );
    case "link":
      return (
        <a
          href={content.url}
          target={content.newTab ? "_blank" : undefined}
          rel={content.newTab ? "noopener noreferrer" : undefined}
          className="underline decoration-1 underline-offset-2 hover:text-muted-foreground"
        >
          <RichTextParser content={content.children} />
        </a>
      );
    case "upload":
      if (content.relationTo === "media" && content.value) {
        return (
          <figure className="my-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={content.value.url}
              alt={content.value.alt || "Image"}
              className="w-full h-auto border border-border rounded-sm"
            />
            {content.value.caption && (
              <figcaption className="text-sm text-muted-foreground mt-2 text-center">
                {content.value.caption}
              </figcaption>
            )}
          </figure>
        );
      }
      return null;
    case "quote":
      return (
        <blockquote className="border-l-4 border-border pl-4 italic my-4">
          <RichTextParser content={content.children} />
        </blockquote>
      );

    // Default paragraph or other blocks with children
    default:
      if (content.children) {
        return (
          <p className="mb-4 leading-relaxed">
            <RichTextParser content={content.children} />
          </p>
        );
      }
      return null;
  }
};

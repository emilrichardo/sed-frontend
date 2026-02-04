import React from "react";
import Markdown from "react-markdown";

interface SourcesSectionProps {
  content?: string;
}

export function SourcesSection({ content }: SourcesSectionProps) {
  if (!content) return null;

  return (
    <div className="mt-12 pt-8 border-t border-border">
      <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-widest">
        Fuentes
      </h4>
      <div className="prose prose-sm max-w-none text-xs text-muted-foreground prose-p:my-1 prose-ul:my-1">
        <Markdown>{content}</Markdown>
      </div>
    </div>
  );
}

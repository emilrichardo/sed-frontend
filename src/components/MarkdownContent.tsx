import ReactMarkdown from "react-markdown";

import { cn } from "@/lib/utils";

interface MarkdownContentProps {
  content?: string | null;
  className?: string;
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  if (!content?.trim()) return null;

  return (
    <div
      className={cn(
        "max-w-none text-foreground",
        "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
        "[&_blockquote]:my-6 [&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:bg-muted/40 [&_blockquote]:py-3 [&_blockquote]:pl-5 [&_blockquote]:pr-4 [&_blockquote]:italic",
        "[&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:text-3xl [&_h1]:font-heading [&_h1]:font-bold [&_h1]:leading-tight",
        "[&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-heading [&_h2]:font-bold [&_h2]:leading-tight",
        "[&_h3]:mt-7 [&_h3]:mb-3 [&_h3]:text-xl [&_h3]:font-heading [&_h3]:font-bold [&_h3]:leading-snug",
        "[&_h4]:mt-6 [&_h4]:mb-2 [&_h4]:text-lg [&_h4]:font-bold",
        "[&_hr]:my-8 [&_hr]:border-border",
        "[&_li]:my-1.5 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-4 [&_p]:leading-8",
        "[&_strong]:font-bold [&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-6",
        className,
      )}
    >
      <ReactMarkdown
        components={{
          a: ({ href, children }) => (
            <a
              href={href}
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface CardProps {
  title: string;
  description?: string;
  date?: string;
  href: string;
  className?: string;
  imageUrl?: string;
  imageAlt?: string;
  chartPreview?: React.ReactNode;
  layout?: "vertical" | "horizontal";
}

export function Card({
  title,
  description,
  date,
  href,
  className,
  imageUrl,
  imageAlt,
  chartPreview,
  layout = "vertical",
}: CardProps) {
  const isHorizontal = layout === "horizontal";
  const hasMedia = imageUrl || chartPreview;

  return (
    <div
      className={cn(
        "group flex border border-border bg-card transition-all rounded-xl shadow-sm hover:shadow-md overflow-hidden min-w-0",
        isHorizontal ? "flex-row" : "flex-col h-full",
        className,
      )}
    >
      {chartPreview && !isHorizontal && (
        <div className="p-5 pb-4 bg-background border-b border-border min-w-0">
          <h3 className="font-bold text-xl tracking-tight leading-snug uppercase group-hover:text-primary transition-colors line-clamp-2">
            <Link href={href} className="hover:underline">
              {title}
            </Link>
          </h3>
        </div>
      )}
      {hasMedia && (
        <div
          className={cn(
            "relative overflow-hidden shrink-0 bg-background border-b border-border min-w-0 flex flex-col",
            isHorizontal
              ? "w-1/3 md:w-[40%] aspect-[4/3] border-r"
              : chartPreview
                ? "w-full"
                : "aspect-[16/9] w-full",
          )}
        >
          {imageUrl ? (
            <Link href={href} className="block w-full h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={imageAlt || title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </Link>
          ) : (
            <div className="relative z-0 w-full flex-1 flex flex-col">
              {chartPreview}
            </div>
          )}
        </div>
      )}
      <div
        className={cn(
          "flex flex-col flex-1 p-5 min-w-0",
          isHorizontal ? "w-full justify-center" : "h-full justify-between",
        )}
      >
        <div className="flex flex-col gap-1.5 min-w-0">
          {date && (
            <time className="text-[10px] text-muted-foreground font-medium shrink-0">
              {new Date(date).toLocaleDateString("es-AR", {
                year: "numeric",
                month: "short",
              })}
            </time>
          )}
          {!(chartPreview && !isHorizontal) && (
            <h3 className="font-semibold text-base leading-snug group-hover:text-primary transition-colors line-clamp-2">
              <Link href={href} className="hover:underline">
                {title}
              </Link>
            </h3>
          )}
          {description && (
            <p className="mt-1.5 text-xs text-muted-foreground line-clamp-3 leading-relaxed flex-1">
              {description}
            </p>
          )}
        </div>
        {!isHorizontal && (
          <div className="mt-4 flex items-center text-xs font-semibold text-primary/80 group-hover:text-primary transition-colors">
            <Link
              href={href}
              className="flex flex-row items-center gap-1 group/link"
            >
              Ver detalles
              <svg
                className="w-3.5 h-3.5 ml-0.5 transition-transform group-hover/link:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

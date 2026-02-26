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
  layout = "vertical",
}: CardProps) {
  const isHorizontal = layout === "horizontal";

  return (
    <Link
      href={href}
      className={cn(
        "block group border bg-card transition-all rounded-lg shadow-sm hover:shadow-md overflow-hidden",
        isHorizontal ? "flex flex-row" : "",
        className,
      )}
    >
      {imageUrl && (
        <div
          className={cn(
            "overflow-hidden shrink-0 bg-muted",
            isHorizontal
              ? "w-1/3 md:w-[40%] aspect-[4/3] border-r" // Updated width to 40% on desktop
              : "w-full aspect-video border-b",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={imageAlt || title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}
      <div
        className={cn(
          "flex flex-col p-6", // Restore p-6 for better spacing? User asked to reduce spacing earlier but now wants vertical alignment. Let's keep p-6 or p-4? User said "quita ese espacio pronunciado" (remove pronounced space) on step 995, but now "aline verticalmente".
          // Let's use p-4 but handle vertical centering
          isHorizontal ? "w-full justify-center" : "h-full justify-between",
        )}
      >
        <div>
          {date && (
            <time className="text-xs text-muted-foreground font-mono mb-2 block font-medium">
              {new Date(date).toLocaleDateString("es-CL", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          )}
          <h3 className="text-lg font-bold tracking-tight group-hover:underline decoration-2 underline-offset-4 mb-1">
            {title}
          </h3>
          {description && (
            <p className="text-muted-foreground text-sm line-clamp-3 font-sans font-medium">
              {description}
            </p>
          )}
        </div>
        <div className="mt-4 flex items-center text-sm font-medium text-primary">
          Leer más
          <svg
            className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1"
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
        </div>
      </div>
    </Link>
  );
}

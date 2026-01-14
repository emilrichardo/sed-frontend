import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface CardProps {
  title: string;
  description?: string;
  date?: string;
  href: string;
  className?: string;
}

export function Card({ title, description, date, href, className }: CardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "block group border border-border p-6 hover:bg-muted/50 transition-colors",
        className
      )}
    >
      <div className="flex flex-col h-full justify-between">
        <div>
          {date && (
            <time className="text-xs text-muted-foreground font-mono mb-2 block">
              {new Date(date).toLocaleDateString("es-CL", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          )}
          <h3 className="text-lg font-medium group-hover:underline decoration-1 underline-offset-4 mb-2">
            {title}
          </h3>
          {description && (
            <p className="text-muted-foreground text-sm line-clamp-3">
              {description}
            </p>
          )}
        </div>
        <div className="mt-4 flex items-center text-sm font-medium">
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

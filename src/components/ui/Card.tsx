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
        "block group border border-black p-6 bg-card transition-all shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-none",
        className,
      )}
    >
      <div className="flex flex-col h-full justify-between">
        <div>
          {date && (
            <time className="text-xs text-muted-foreground font-mono mb-2 block font-bold uppercase tracking-normal">
              {new Date(date).toLocaleDateString("es-CL", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          )}
          <h3 className="text-lg font-bold uppercase tracking-tight group-hover:underline decoration-2 underline-offset-4 mb-2">
            {title}
          </h3>
          {description && (
            <p className="text-muted-foreground text-sm line-clamp-3 font-sans font-medium">
              {description}
            </p>
          )}
        </div>
        <div className="mt-4 flex items-center text-sm font-bold uppercase tracking-normal">
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

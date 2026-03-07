"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import type { CategoryWithChildren } from "@/components/CategoryMenu";
import { SunRaysAnimated } from "@/components/SunRaysAnimated";

interface Props {
  categories: CategoryWithChildren[];
}

/**
 * Horizontal category card grid for desktop only.
 * Equal-width tall cards: number top-left, arrow top-right, name bottom.
 */
export function DesktopCategoryBar({ categories }: Props) {
  const pathname = usePathname();

  if (categories.length === 0) return null;

  return (
    <nav
      aria-label="Categorías"
      className="hidden md:grid gap-4 overflow-x-auto scrollbar-none"
      style={{ gridTemplateColumns: `repeat(${categories.length}, 1fr)` }}
    >
      {categories.map((cat, idx) => {
        const isActive = pathname.startsWith(`/categorias/${cat.slug}`);
        return (
          <Link
            key={cat.id}
            href={`/categorias/${cat.slug}`}
            className={`group relative flex flex-col justify-between p-4 h-32 border-r border-border last:border-r-0 rounded-lg overflow-hidden transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-card hover:bg-primary hover:text-primary-foreground"
            }`}
          >
            {/* Sun rays background — visible on hover (and always on active) */}
            <div
              className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                isActive ? "opacity-20" : "opacity-0 group-hover:opacity-20"
              }`}
            >
              <div className="aspect-square h-[200%]">
                <SunRaysAnimated fill cycleDuration={6} strokeColor="black" />
              </div>
            </div>

            {/* Top row: number left, arrow right */}
            <div className="relative z-10 flex items-start justify-between">
              <span
                className={`text-[11px] font-mono tabular-nums font-bold ${
                  isActive
                    ? "text-primary-foreground/60"
                    : "text-muted-foreground group-hover:text-primary-foreground/60"
                }`}
              >
                {String(idx + 1).padStart(2, "0")}
              </span>
              <ArrowUpRight
                className={`h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                  isActive
                    ? "text-primary-foreground/60"
                    : "text-muted-foreground group-hover:text-primary-foreground/60"
                }`}
              />
            </div>

            {/* Bottom: category name */}
            <span
              className={`relative z-10 text-base group-hover:text-lg font-heading font-bold leading-tight tracking-tight transition-all duration-200 ${
                isActive
                  ? "text-primary-foreground"
                  : "group-hover:text-primary-foreground"
              }`}
            >
              {cat.nombre}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

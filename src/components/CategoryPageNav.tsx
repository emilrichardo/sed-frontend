"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface Props {
  title: string;
  backHref: string;
  backLabel: string;
}

/**
 * Sticky secondary navbar shown on category, subcategory, and publication pages.
 * Positioned right below the main Navbar (top-14 mobile / top-16 desktop).
 */
export function CategoryPageNav({ title, backHref, backLabel }: Props) {
  return (
    <div className="sticky top-14 md:top-16 z-40 bg-background/95 backdrop-blur-sm border-b border-border animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="flex items-center h-11">
        <Link
          href={backHref}
          className="flex items-center justify-center h-full px-4 border-r border-border hover:bg-muted transition-colors shrink-0 gap-1 text-muted-foreground hover:text-foreground"
          title={backLabel}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="text-xs font-medium hidden sm:inline">{backLabel}</span>
        </Link>

        <span className="flex-1 px-4 text-sm font-semibold truncate">
          {title}
        </span>
      </div>
    </div>
  );
}

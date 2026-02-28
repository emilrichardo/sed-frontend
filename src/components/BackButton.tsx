"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  href?: string;
  label?: string;
  className?: string;
  fallbackToRouter?: boolean;
}

/**
 * Unified back navigation component. Always renders at the top
 * with consistent spacing across all pages.
 */
export function BackButton({
  href,
  label = "Volver",
  className,
  fallbackToRouter = true,
}: BackButtonProps) {
  const router = useRouter();

  const baseStyles =
    "inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-4 md:mb-6 mt-0";

  if (href) {
    return (
      <Link href={href} className={cn(baseStyles, className)}>
        <ArrowLeft className="h-4 w-4" />
        {label}
      </Link>
    );
  }

  if (fallbackToRouter) {
    return (
      <button
        onClick={() => router.back()}
        className={cn(baseStyles, className)}
      >
        <ArrowLeft className="h-4 w-4" />
        {label}
      </button>
    );
  }

  return null;
}

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

export function BackButton({
  href,
  label = "Volver",
  className,
  fallbackToRouter = true,
}: BackButtonProps) {
  const router = useRouter();

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          "inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-6",
          className,
        )}
      >
        <ArrowLeft className="h-4 w-4" />
        {label}
      </Link>
    );
  }

  if (fallbackToRouter) {
    return (
      <button
        onClick={() => router.back()}
        className={cn(
          "inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-6",
          className,
        )}
      >
        <ArrowLeft className="h-4 w-4" />
        {label}
      </button>
    );
  }

  return null;
}

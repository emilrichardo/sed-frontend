"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ReportSidebar } from "@/components/ReportSidebar";
import { BackButton } from "@/components/BackButton";

import type { ReportItem } from "@/lib/api";

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface Props {
  headings: Heading[];
  childrenReports: ReportItem[];
  parentReport: ReportItem | null;
  currentSlug: string;
  backLink: { href: string; label: string };
  children: React.ReactNode;
}

export function PublicationLayoutWrapper({
  headings,
  childrenReports,
  parentReport,
  currentSlug,
  backLink,
  children,
}: Props) {
  const { layoutMode } = useAuth();

  if (layoutMode === "web") {
    return (
      // Negative margins escape LayoutContent's px-4/px-8/py-6 container
      <div className="flex flex-col min-h-screen">
        {/* Mobile top navigation bar */}
        <div className="md:hidden sticky top-0 z-40 flex items-center h-12 px-3 bg-background/95 backdrop-blur-sm border-b border-border">
          <Link
            href={backLink.href}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors min-w-0"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span className="truncate">{backLink.label}</span>
          </Link>
        </div>
        <main className="flex-1 bg-background">
          <article className="max-w-[960px] mx-auto py-6 px-4 md:py-14 md:px-8">
            <BackButton href={backLink.href} label={backLink.label} className="hidden md:inline-flex" />
            {children}
          </article>
        </main>
      </div>
    );
  }

  // Dashboard layout — existing sidebar
  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <ReportSidebar
        headings={headings}
        childrenReports={childrenReports}
        parentReport={parentReport}
        currentSlug={currentSlug}
        backLink={backLink}
      />
      <main className="flex-1 min-w-0 bg-background">
        <article className="max-w-[960px] mx-auto py-8 px-4 md:py-12 md:px-8">
          {children}
        </article>
      </main>
    </div>
  );
}

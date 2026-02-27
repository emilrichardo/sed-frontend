"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { ReportSidebar } from "@/components/ReportSidebar";
import { PublicationTopNav } from "@/components/PublicationTopNav";
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
      <div className="-mx-4 md:-mx-8 -mt-6 flex flex-col min-h-screen">
        <PublicationTopNav
          headings={headings}
          childrenReports={childrenReports}
        />
        <main className="flex-1 bg-background">
          <article className="max-w-[1440px] mx-auto py-10 px-4 md:py-14 md:px-8">
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
        <article className="max-w-6xl mx-auto py-8 px-4 md:py-12 md:px-8">
          {children}
        </article>
      </main>
    </div>
  );
}

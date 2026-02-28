"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { ReportSidebar } from "@/components/ReportSidebar";
import { BackButton } from "@/components/BackButton";
import Link from "next/link";
import { ChevronLeft, ChevronDown } from "lucide-react";

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

function MobilePublicationNav({
  headings,
  childrenReports,
  parentReport,
  currentSlug,
  backLink,
}: Omit<Props, "children">) {
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (!value) return;
    if (value.startsWith("pub:")) {
      window.location.href = `/publicaciones/${value.slice(4)}`;
    } else if (value.startsWith("heading:")) {
      const id = value.slice(8);
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      e.target.value = "";
    }
  };

  const hasOptions =
    parentReport || childrenReports.length > 0 || headings.length > 0;

  return (
    <div className="md:hidden sticky top-16 z-30 bg-background/90 backdrop-blur-sm border-b border-border">
      <div className="flex items-center h-12">
        <Link
          href={backLink.href}
          className="flex items-center justify-center h-full px-4 border-r border-border hover:bg-muted transition-colors shrink-0"
          title={backLink.label}
        >
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </Link>

        {hasOptions ? (
          <>
            <select
              className="flex-1 bg-transparent text-sm px-3 py-2 border-none outline-none appearance-none cursor-pointer text-muted-foreground"
              onChange={handleSelectChange}
              defaultValue=""
            >
              <option value="" disabled>
                Ir a sección...
              </option>
              {parentReport && (
                <option value={`pub:${parentReport.slug}`}>
                  ↑ {parentReport.titulo} (Principal)
                </option>
              )}
              {childrenReports.map((child) => (
                <option key={child.id} value={`pub:${child.slug}`}>
                  {currentSlug === child.slug ? "▸ " : ""}
                  {child.titulo}
                </option>
              ))}
              {headings.length > 0 && (
                <>
                  {(parentReport || childrenReports.length > 0) && (
                    <option disabled>──────────</option>
                  )}
                  {headings.map((h) => (
                    <option key={h.id} value={`heading:${h.id}`}>
                      {h.level === 2 ? "  " : ""}
                      {h.text}
                    </option>
                  ))}
                </>
              )}
            </select>
            <ChevronDown className="h-4 w-4 mr-3 text-muted-foreground pointer-events-none shrink-0" />
          </>
        ) : (
          <span className="flex-1 px-4 text-sm text-muted-foreground truncate">
            {backLink.label}
          </span>
        )}
      </div>
    </div>
  );
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
      <div className="flex flex-col min-h-screen">
        <MobilePublicationNav
          headings={headings}
          childrenReports={childrenReports}
          parentReport={parentReport}
          currentSlug={currentSlug}
          backLink={backLink}
        />
        <main className="flex-1 bg-background">
          <article className="max-w-[960px] mx-auto py-10 px-4 md:py-14 md:px-8">
            <BackButton
              href={backLink.href}
              label={backLink.label}
              className="hidden md:inline-flex"
            />
            {children}
          </article>
        </main>
      </div>
    );
  }

  // Dashboard layout — existing sidebar
  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <MobilePublicationNav
        headings={headings}
        childrenReports={childrenReports}
        parentReport={parentReport}
        currentSlug={currentSlug}
        backLink={backLink}
      />
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

"use client";

import React from "react";
import Link from "next/link";
import { ReportItem } from "@/lib/api";
import { ChevronRight, FileText, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface SidebarContentProps {
  headings: Heading[];
  childrenReports: ReportItem[];
  parentReport?: ReportItem | null;
  currentSlug?: string;
  activeId: string;
  onHeadingClick: (id: string, e: React.MouseEvent) => void;
}

function SidebarContent({
  headings,
  childrenReports,
  parentReport,
  currentSlug,
  activeId,
  onHeadingClick,
}: SidebarContentProps) {
  return (
    <div className="space-y-8">
      {/* Table of Contents */}
      {headings.length > 0 && (
        <div>
          <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wider">
            En esta página
          </h3>
          <ul className="space-y-2 border-l border-border/50">
            {headings.map((heading) => (
              <li key={heading.id}>
                <a
                  href={`#${heading.id}`}
                  className={cn(
                    "block pl-4 py-1 text-sm border-l-2 transition-all hover:text-primary",
                    activeId === heading.id
                      ? "border-primary text-primary font-medium"
                      : "border-transparent text-muted-foreground hover:border-primary/50",
                  )}
                  onClick={(e) => onHeadingClick(heading.id, e)}
                >
                  {heading.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Report Structure (Children/Siblings) */}
      {(childrenReports.length > 0 || parentReport) && (
        <div className="pt-6 border-t border-border/50">
          <h3 className="font-semibold mb-4 text-sm text-foreground uppercase tracking-wider flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Contenido del Informe
          </h3>

          <nav className="flex flex-col space-y-1">
            {parentReport && (
              <Link
                href={`/informes/${parentReport.slug}`}
                className={cn(
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                  currentSlug === parentReport.slug
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                <div className="w-1 h-full mr-2 rounded-full bg-transparent group-hover:bg-primary/50" />
                <span className="truncate">
                  {parentReport.titulo} (Principal)
                </span>
              </Link>
            )}

            {childrenReports.map((item) => (
              <Link
                key={item.id}
                href={`/informes/${item.slug}`}
                className={cn(
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ml-2",
                  currentSlug === item.slug
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                <ChevronRight
                  className={cn(
                    "h-3 w-3 mr-2 shrink-0 transition-transform",
                    currentSlug === item.slug
                      ? "rotate-90 text-primary"
                      : "text-muted-foreground/50",
                  )}
                />
                <span className="truncate line-clamp-1">{item.titulo}</span>
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}

interface ReportSidebarProps {
  headings: Heading[];
  childrenReports: ReportItem[];
  parentReport?: ReportItem | null;
  className?: string;
  currentSlug?: string;
}

export function ReportSidebar({
  headings,
  childrenReports,
  parentReport,
  className,
  currentSlug,
}: ReportSidebarProps) {
  const [activeId, setActiveId] = React.useState<string>("");

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "0% 0% -80% 0%" },
    );

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  const handleHeadingClick = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
    });
    setActiveId(id);
  };

  return (
    <div className={className}>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-4 scrollbar-thin">
        <SidebarContent
          headings={headings}
          childrenReports={childrenReports}
          parentReport={parentReport}
          currentSlug={currentSlug}
          activeId={activeId}
          onHeadingClick={handleHeadingClick}
        />
      </aside>

      {/* Mobile Drawer */}
      <div className="lg:hidden mb-8">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="w-full flex justify-between items-center"
            >
              <span className="flex items-center gap-2">
                <Menu className="h-4 w-4" />
                Índice y Estructura
              </span>
              <ChevronRight className="h-4 w-4 rotate-90" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[85vw] sm:w-[350px] overflow-y-auto"
          >
            <SheetTitle className="sr-only">Navegación del Informe</SheetTitle>
            <div className="mt-6">
              <SidebarContent
                headings={headings}
                childrenReports={childrenReports}
                parentReport={parentReport}
                currentSlug={currentSlug}
                activeId={activeId}
                onHeadingClick={handleHeadingClick}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

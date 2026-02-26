"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ReportItem } from "@/lib/api";
import {
  ChevronLeft, // Added
  ChevronRight,
  FileText,
  LayoutGrid, // Added
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  User,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

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
  backLink?: { href: string; label: string };
  isCollapsed?: boolean;
}

function SidebarContent({
  headings,
  childrenReports,
  parentReport,
  currentSlug,
  activeId,
  onHeadingClick,
  backLink,
  isCollapsed = false,
}: SidebarContentProps) {
  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        {backLink && (
          <Link
            href={backLink.href}
            className="p-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title={backLink.label}
          >
            <ChevronRight className="h-5 w-5 rotate-180" />
          </Link>
        )}
        {/* We generally hide TOC/Structure in collapsed mode as they are text-heavy */}
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Back Link */}
      {backLink && (
        <div className="mb-6">
          <Button
            variant="outline"
            asChild
            className="w-full justify-start gap-2 pl-2"
          >
            <Link href={backLink.href} title={backLink.label}>
              <ChevronLeft className="h-4 w-4" />
              <span className="truncate">{backLink.label}</span>
            </Link>
          </Button>
        </div>
      )}

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
      {childrenReports.length > 0 && (
        <div className="pt-6 border-t border-border/50">
          <h3 className="font-semibold mb-4 text-sm text-foreground uppercase tracking-wider flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Contenido de la Publicación
          </h3>

          <nav className="flex flex-col space-y-1">
            {parentReport && (
              <Link
                href={`/publicaciones/${parentReport.slug}`}
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
                href={`/publicaciones/${item.slug}`}
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
  backLink?: { href: string; label: string };
}

export function ReportSidebar({
  headings,
  childrenReports,
  parentReport,
  className,
  currentSlug,
  backLink,
}: ReportSidebarProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout, layoutMode } = useAuth(); // Using Auth Context

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

  // If user is null (loading or not logged in), we might want to return null or render a skeleton?
  // But typically Report page is protected or public. If public, user might be null.
  // Sidebar.tsx returned null if !user.
  // If reports are public, we should handle !user gracefully (hide footer).
  // Assuming standard Sidebar behavior.

  return (
    <>
      {/* Desktop Sidebar - Mimicking Main Sidebar Layout */}
      <aside
        className={cn(
          "hidden lg:flex sticky top-0 h-screen transition-all duration-300 border-r border-border bg-background flex-col flex-shrink-0",
          isCollapsed ? "w-16" : "w-64",
          className,
        )}
      >
        {/* Header / Logo */}
        <div className="flex items-center justify-between p-4 h-16 border-b border-border text-foreground">
          {!isCollapsed && layoutMode !== "web" && (
            <Link href="/" className="flex items-center gap-2 overflow-hidden">
              <span className="text-lg font-bold tracking-tight whitespace-nowrap truncate">
                Santiago en Datos
              </span>
            </Link>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted ml-auto"
            title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Navigation / Content */}
        <div className="flex-1 overflow-y-auto">
          <SidebarContent
            headings={headings}
            childrenReports={childrenReports}
            parentReport={parentReport}
            currentSlug={currentSlug}
            activeId={activeId}
            onHeadingClick={handleHeadingClick}
            backLink={backLink}
            isCollapsed={isCollapsed}
          />
        </div>

        {/* User Session Footer (Only if user exists) */}
        {user && (
          <div className="border-t border-border p-4">
            {isCollapsed ? (
              <div className="flex flex-col items-center gap-4">
                <div
                  className="p-2 rounded-full bg-muted text-muted-foreground"
                  title={user.email}
                >
                  <User className="h-5 w-5" />
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                  title="Cerrar Sesión"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-2">
                  <div className="p-2 rounded-full bg-muted text-muted-foreground">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span
                      className="text-sm font-medium truncate"
                      title={user.email}
                    >
                      {user.email}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      Usuario
                    </span>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Mobile Drawer (Visible ONLY on LG Hidden) */}
      <div className="lg:hidden w-full bg-background border-b p-4">
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
            <SheetTitle className="sr-only">
              Navegación de la Publicación
            </SheetTitle>
            <div className="mt-6">
              <SidebarContent
                headings={headings}
                childrenReports={childrenReports}
                parentReport={parentReport}
                currentSlug={currentSlug}
                activeId={activeId}
                onHeadingClick={handleHeadingClick}
                backLink={backLink}
                isCollapsed={false}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

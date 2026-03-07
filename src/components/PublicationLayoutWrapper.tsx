"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { ReportSidebar } from "@/components/ReportSidebar";
import Link from "next/link";
import {
  ChevronLeft,
  MoreVertical,
  Send,
  Link as LinkIcon,
  Bookmark,
  BookmarkCheck,
  Check,
} from "lucide-react";

import type { ReportItem } from "@/lib/api";

interface Heading {
  id: string;
  text: string;
  level: number;
}


const FAVORITES_KEY = "sed_favorites";
function getFavorites(): string[] {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
  } catch {
    return [];
  }
}

interface Props {
  headings: Heading[];
  childrenReports: ReportItem[];
  parentReport: ReportItem | null;
  currentSlug: string;
  backLink: { href: string; label: string };
  children: React.ReactNode;
  title?: string;
  publicationId?: string | number;
}

function MobilePublicationNav({
  headings,
  childrenReports,
  parentReport,
  currentSlug,
  backLink,
  title,
  publicationId,
}: Omit<Props, "children">) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!publicationId) return;
    setIsFavorite(getFavorites().includes(String(publicationId)));
  }, [publicationId]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const handleSend = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: title || "", url });
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
    setMenuOpen(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
    setMenuOpen(false);
  };

  const handleToggleFavorite = () => {
    if (!publicationId) return;
    const favs = getFavorites();
    const id = String(publicationId);
    const idx = favs.indexOf(id);
    if (idx === -1) favs.push(id);
    else favs.splice(idx, 1);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
    setIsFavorite(idx === -1);
    setMenuOpen(false);
  };

  const showActions = !!title;

  return (
    <div className="sticky top-0 md:top-16 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center h-12">
        <Link
          href={backLink.href}
          className="flex items-center justify-center h-full px-4 border-r border-border hover:bg-muted transition-colors shrink-0"
          title={backLink.label}
        >
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </Link>

        <span className="flex-1 px-4 text-sm font-medium truncate">
          {title || backLink.label}
        </span>

        {/* Three-dot menu */}
        {showActions && (
          <div className="relative shrink-0" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center justify-center h-12 w-11 border-l border-border hover:bg-muted transition-colors"
              aria-label="Más opciones"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 rounded-md border border-border bg-background shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <button
                  onClick={handleSend}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <Send className="h-4 w-4 text-muted-foreground" />
                  Enviar
                </button>
                <button
                  onClick={handleCopyLink}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors border-t border-border/50"
                >
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  Copiar enlace
                </button>
                <button
                  onClick={handleToggleFavorite}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-sm transition-colors border-t border-border/50 ${
                    isFavorite
                      ? "text-primary bg-primary/5"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  {isFavorite ? (
                    <BookmarkCheck className="h-4 w-4 text-primary" />
                  ) : (
                    <Bookmark className="h-4 w-4 text-muted-foreground" />
                  )}
                  {isFavorite ? "Guardada" : "Favorita"}
                </button>
              </div>
            )}
          </div>
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
  title,
  publicationId,
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
          title={title}
          publicationId={publicationId}
        />
        <main className="flex-1 bg-background">
          <article className="max-w-[960px] mx-auto py-10 md:py-14 md:px-8">
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
        title={title}
        publicationId={publicationId}
      />
      <ReportSidebar
        headings={headings}
        childrenReports={childrenReports}
        parentReport={parentReport}
        currentSlug={currentSlug}
        backLink={backLink}
      />
      <main className="flex-1 min-w-0 bg-background">
        <article className="max-w-[960px] mx-auto py-8 md:py-12 md:px-8">
          {children}
        </article>
      </main>
    </div>
  );
}

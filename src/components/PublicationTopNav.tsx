"use client";

import { useState, useEffect, useRef } from "react";

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface ChildReport {
  id: number;
  titulo: string;
  slug: string;
}

interface Props {
  headings: Heading[];
  childrenReports: ChildReport[];
}

export function PublicationTopNav({ headings, childrenReports }: Props) {
  const [activeId, setActiveId] = useState<string>("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Track active heading via IntersectionObserver
  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-120px 0px -50% 0px", threshold: 0 },
    );

    const observerElements: Element[] = [];

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) {
        observer.observe(el);
        observerElements.push(el);
      }
    });

    childrenReports.forEach(({ slug }) => {
      const el = document.getElementById(slug);
      if (el) {
        observer.observe(el);
        observerElements.push(el);
      }
    });

    return () => {
      observerElements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, [headings, childrenReports]);

  // Center active item - using a separate effect to avoid collision
  useEffect(() => {
    if (!activeId || !scrollContainerRef.current) return;
    const activeEl = itemRefs.current.get(activeId);
    if (activeEl) {
      activeEl.scrollIntoView({
        inline: "center",
        behavior: "smooth",
      });
    }
  }, [activeId]);

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 104; // navbar(64) + topnav(40)
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  const hasItems = headings.length > 0 || childrenReports.length > 0;

  if (!hasItems) return null;

  return (
    <div className="sticky top-16 z-40 bg-background/80 backdrop-blur-md border-b border-border/50 shadow-sm overflow-hidden">
      <div className="max-w-[1440px] mx-auto flex items-stretch h-10 w-full">
        {/* Scrollable TOC + children */}
        {hasItems && (
          <div
            ref={scrollContainerRef}
            className="flex-1 flex items-center relative overflow-hidden"
          >
            {/* The infinite-feeling horizontal tape */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar px-4 py-1 h-full scroll-smooth">
              {/* Headings */}
              {headings.map((heading) => (
                <button
                  key={heading.id}
                  ref={(el) => {
                    if (el) itemRefs.current.set(heading.id, el);
                    else itemRefs.current.delete(heading.id);
                  }}
                  onClick={() => scrollToHeading(heading.id)}
                  className={`shrink-0 px-3 py-1.5 text-[11px] transition-all whitespace-nowrap border-b-2 ${
                    activeId === heading.id
                      ? "text-primary border-primary font-bold"
                      : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50 font-medium"
                  }`}
                >
                  {heading.text}
                </button>
              ))}

              {/* Separator */}
              {headings.length > 0 && childrenReports.length > 0 && (
                <div className="h-3 w-px bg-border/50 shrink-0 mx-2" />
              )}

              {/* Children */}
              {childrenReports.map((child) => (
                <button
                  key={child.id}
                  ref={(el) => {
                    if (el) itemRefs.current.set(child.slug, el);
                    else itemRefs.current.delete(child.slug);
                  }}
                  onClick={() => scrollToHeading(child.slug)}
                  className={`shrink-0 px-3 py-1.5 text-[11px] font-medium transition-all whitespace-nowrap border-b-2 ${
                    activeId === child.slug
                      ? "text-primary border-primary font-bold"
                      : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {child.titulo}
                </button>
              ))}
            </div>

            {/* Gradient Mask for Smooth Edges */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background via-background/20 to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background via-background/20 to-transparent pointer-events-none" />
          </div>
        )}
      </div>

      {/* Visual slide guide (subtle line or animaion could go here) */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

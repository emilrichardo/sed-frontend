"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  ArrowRight,
  FileText,
} from "lucide-react";
import type { ReportItem } from "@/lib/api";
import { cn } from "@/lib/utils";
import { SunRaysAnimated } from "@/components/SunRaysAnimated";

interface PublicationCarouselProps {
  items: ReportItem[];
  className?: string;
}

export function PublicationCarousel({
  items,
  className,
}: PublicationCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      // initial check
      handleScroll();
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, []);

  // Auto-scroll logic
  useEffect(() => {
    if (items.length <= 1) return; // Note needed if only 1 item

    const interval = setInterval(() => {
      if (isHovered) return; // Pause on hover

      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const { scrollLeft, scrollWidth, clientWidth } = container;

        // Loop back to start if we reached the right end
        if (scrollLeft >= scrollWidth - clientWidth - 10) {
          container.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          const itemWidth = container.children[0]?.clientWidth || 300;
          container.scrollBy({ left: itemWidth + 16, behavior: "smooth" });
        }
      }
    }, 4000); // Auto-scroll every 4 seconds

    return () => clearInterval(interval);
  }, [isHovered, items.length]);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const itemWidth = container.children[0]?.clientWidth || 300;
      const scrollAmount = itemWidth + 16;
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div
      className={cn("w-full relative group", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
    >
      {/* Desktop Arrows - Positioned outside the container */}
      <div className="absolute top-1/2 -translate-y-1/2 -left-4 md:-left-5 z-10 hidden md:flex">
        <button
          onClick={() => scroll("left")}
          disabled={!canScrollLeft}
          className="p-2.5 rounded-full border border-border bg-background/95 backdrop-blur-md hover:bg-muted transition-colors disabled:opacity-0 disabled:pointer-events-none shadow-sm"
          aria-label="Anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>

      <div className="absolute top-1/2 -translate-y-1/2 -right-4 md:-right-5 z-10 hidden md:flex">
        <button
          onClick={() => scroll("right")}
          disabled={!canScrollRight}
          className="p-2.5 rounded-full border border-border bg-background/95 backdrop-blur-md hover:bg-muted transition-colors disabled:opacity-0 disabled:pointer-events-none shadow-sm"
          aria-label="Siguiente"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Carousel Track */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 md:gap-5 overflow-x-auto pb-4 px-1 snap-x snap-mandatory scrollbar-none [&::-webkit-scrollbar]:hidden -mx-4 md:mx-0 px-4 md:px-0"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {items.map((item) => {
          const img = item.imagen_destacada as
            | { url?: string; alt?: string }
            | undefined;
          const imageUrl = img?.url;
          const date = item.publishedDate || item.createdAt;

          // Try to get root category or use default
          const cats = item.categorias as { nombre: string }[] | undefined;
          const rootCat = cats?.[0]?.nombre;

          return (
            <div
              key={item.id}
              className="min-w-[85vw] max-w-[85vw] sm:min-w-[45vw] sm:max-w-[45vw] lg:min-w-[30%] lg:max-w-[30%] snap-start shrink-0"
            >
              <Link
                href={`/publicaciones/${item.slug}`}
                className="flex flex-col h-full rounded-2xl border border-border bg-card overflow-hidden hover:shadow-md transition-all group/card hover:-translate-y-1"
              >
                {/* Image top */}
                <div className="relative w-full aspect-[16/9] bg-muted/30 overflow-hidden border-b border-border/50">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={img?.alt || item.titulo}
                      fill
                      unoptimized
                      className="object-cover transition-transform duration-700 group-hover/card:scale-105"
                      sizes="(max-width: 768px) 85vw, (max-width: 1024px) 45vw, 30vw"
                    />
                  ) : (
                    <div className="relative w-full h-full bg-primary flex items-center justify-center overflow-hidden">
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20">
                        <div className="aspect-square h-[200%]">
                          <SunRaysAnimated fill cycleDuration={6} strokeColor="black" />
                        </div>
                      </div>
                      <div className="relative z-10 flex items-center justify-center w-14 h-14 rounded-full bg-white">
                        <FileText className="h-6 w-6 text-primary" strokeWidth={1.5} />
                      </div>
                    </div>
                  )}
                  {rootCat && (
                    <div className="absolute top-3 left-3 px-2.5 py-1 bg-background/95 backdrop-blur-sm rounded-lg shadow-sm border border-border/50 pointer-events-none">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                        {rootCat}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content bottom */}
                <div className="p-5 flex flex-col flex-1 gap-3">
                  <h3 className="font-bold text-lg leading-snug line-clamp-3 group-hover/card:text-primary transition-colors font-heading flex-1">
                    {item.titulo}
                  </h3>

                  <div className="flex items-center justify-between pt-3 mt-auto border-t border-border/50 relative">
                    {date && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(date).toLocaleDateString("es-AR", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    )}
                    <span className="flex items-center gap-1 text-xs font-bold text-primary transition-transform group-hover/card:translate-x-1">
                      Leer
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

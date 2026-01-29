"use client";

import React, { useRef, useState, useEffect } from "react";
import { ActoAdministrativo } from "@/lib/api";
import Link from "next/link";
import {
  ChevronRight,
  ChevronLeft,
  Star,
  FileText,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BulletinHighlightsSliderProps {
  acts: ActoAdministrativo[];
  className?: string;
}

export default function BulletinHighlightsSlider({
  acts,
  className,
}: BulletinHighlightsSliderProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Note: Hooks must be called before early returns

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

      // Note: Approximate calculation for dots, can be refined with IntersectionObserver if needed
      // Simpler approach for dots:
      if (scrollContainerRef.current.children[0]) {
        const itemWidth = scrollContainerRef.current.children[0].clientWidth;
        const newIndex = Math.round(scrollLeft / itemWidth);
        setActiveIndex(newIndex);
      }
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      // Initial check
      handleScroll();
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount =
        container.clientWidth / (window.innerWidth >= 768 ? 2 : 1);
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const scrollToItem = (index: number) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const itemWidth = container.children[0].clientWidth; // Approximate
      const gap = 16; // 1rem gap
      container.scrollTo({
        left: index * (itemWidth + gap),
        behavior: "smooth",
      });
    }
  };

  if (!acts || acts.length === 0) return null;

  return (
    <div className={cn("w-full space-y-6 mb-12", className)}>
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xl font-bold flex items-center gap-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
          <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
          Destacados del Boletín
        </h3>

        {/* Desktop Arrows */}
        <div className="hidden md:flex gap-2">
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className="p-2 rounded-full border bg-background hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className="p-2 rounded-full border bg-background hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative group">
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto pb-6 px-1 snap-x snap-mandatory scrollbar-hide -mx-4 md:mx-0 px-4 md:px-0"
        >
          {acts.map((act) => (
            <div
              key={act.id}
              className="min-w-[85vw] max-w-[85vw] md:min-w-[40%] md:max-w-[40%] snap-center"
            >
              <div className="h-full relative overflow-hidden rounded-2xl bg-card border shadow-lg hover:shadow-xl transition-all duration-300 group/card flex flex-col">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -ml-5 -mb-5 pointer-events-none" />

                {/* Top Border Accent */}
                <div className="h-1 w-full bg-gradient-to-r from-primary via-purple-500 to-blue-500" />

                <div className="p-6 flex flex-col h-full gap-4 relative z-10">
                  {/* Header: Section & Opacity */}
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                      {act.seccion}
                    </span>
                    {act.nivel_opacidad && (
                      <span
                        className={cn(
                          "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border",
                          act.nivel_opacidad === "Transparente"
                            ? "border-green-200 text-green-700 bg-green-50"
                            : act.nivel_opacidad === "Parcial"
                              ? "border-yellow-200 text-yellow-700 bg-yellow-50"
                              : "border-border text-muted-foreground bg-muted",
                        )}
                      >
                        {act.nivel_opacidad}
                      </span>
                    )}
                    {act.destacado && (
                      <span className="flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-yellow-200 text-yellow-700 bg-yellow-50">
                        <Star className="h-3 w-3 fill-current" />
                        Destacado
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h4 className="text-xl font-extrabold leading-snug tracking-tight text-foreground group-hover/card:text-primary transition-colors line-clamp-3">
                    {act.titulo_periodistico || act.titulo || "Sin título"}
                  </h4>

                  {/* Summary */}
                  <div className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-auto">
                    {act.resumen ||
                      act.nota_periodistica ||
                      "Sin resumen disponible."}
                  </div>

                  {/* Footer Action */}
                  <div className="pt-4 mt-2 flex items-center justify-between border-t border-border/50">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                      <FileText className="h-3 w-3" />
                      {act.identificador_de_acto}
                    </div>

                    <Link
                      href={
                        typeof act.boletin === "object" &&
                        act.boletin &&
                        "slug" in act.boletin
                          ? `/boletines/${(act.boletin as { slug: string }).slug}/${encodeURIComponent(act.identificador_de_acto)}`
                          : `/boletines/${act.boletin}/${encodeURIComponent(act.identificador_de_acto)}`
                      }
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group/btn"
                    >
                      Leer análisis
                      <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Dots Pagination */}
        <div className="flex justify-center gap-2 mt-2 md:hidden">
          {acts.map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollToItem(idx)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                activeIndex === idx
                  ? "w-6 bg-primary"
                  : "w-2 bg-muted-foreground/30",
              )}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

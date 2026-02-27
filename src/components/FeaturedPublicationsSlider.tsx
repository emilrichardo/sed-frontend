"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Calendar, ArrowRight } from "lucide-react";
import type { FlatPublication } from "./PublicationsList";

export interface FeaturedPublicationNode extends FlatPublication {
  children?: FlatPublication[];
}

interface Props {
  items: FeaturedPublicationNode[];
}

export function FeaturedPublicationsSlider({ items }: Props) {
  // To make it infinite, we clone items
  // We'll add some clones at the end and start
  const clonesCount = 2; // Number of clones on each side
  const extendedItems = [
    ...items.slice(-clonesCount),
    ...items,
    ...items.slice(0, clonesCount),
  ];

  const [currentIndex, setCurrentIndex] = useState(clonesCount);
  const [isHovered, setIsHovered] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (items.length <= 1) return;

    if (!isHovered) {
      timerRef.current = setInterval(() => {
        next();
      }, 5000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [items.length, isHovered]);

  const handleTransitionEnd = () => {
    // Check if we reached the clones at the ends
    if (currentIndex >= items.length + clonesCount) {
      setIsTransitioning(false);
      setCurrentIndex(clonesCount);
    } else if (currentIndex < clonesCount) {
      setIsTransitioning(false);
      setCurrentIndex(items.length + clonesCount - 1);
    }
  };

  useEffect(() => {
    if (!isTransitioning) {
      // Small delay to allow React to update the position without transition, then re-enable transition
      const frame = requestAnimationFrame(() => {
        setIsTransitioning(true);
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [isTransitioning]);

  if (items.length === 0) return null;

  const next = () => {
    if (!isTransitioning) return;
    setCurrentIndex((prev) => prev + 1);
  };

  const prev = () => {
    if (!isTransitioning) return;
    setCurrentIndex((prev) => prev - 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold font-heading flex items-center gap-2">
          <span className="w-2 h-8 bg-primary rounded-full" />
          Destacados
        </h2>
        {items.length > 1 && (
          <div className="flex gap-2">
            <button
              onClick={prev}
              className="p-2 rounded-full border border-border bg-background hover:bg-muted transition-colors"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={next}
              className="p-2 rounded-full border border-border bg-background hover:bg-muted transition-colors"
              aria-label="Siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div
        className="relative overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className="flex gap-4"
          onTransitionEnd={handleTransitionEnd}
          style={{
            transition: isTransitioning
              ? "transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)"
              : "none",
            // On desktop: 1.3 visible.
            // Translation: currentIndex * (100% / 1.3 + gap)
            transform: `translateX(calc(-${currentIndex} * (100% / 1.3 + 12.3px)))`,
          }}
        >
          {extendedItems.map((item, index) => {
            const img = item.imagen_destacada as
              | { url?: string; alt?: string }
              | undefined;
            const imageUrl = img?.url;

            return (
              <div
                key={`${item.id}-${index}`}
                className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm aspect-[4/5] md:aspect-[21/9] shrink-0 w-full md:w-[calc((100%-32px)/1.3)]"
              >
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 bg-muted">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={img?.alt || item.titulo}
                      fill
                      unoptimized
                      className="object-cover"
                      priority
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/10 to-muted" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                </div>

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 space-y-4">
                  <div className="max-w-3xl space-y-2">
                    {item.parentTitle && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/20 text-primary uppercase tracking-widest backdrop-blur-sm">
                        {item.parentTitle}
                      </span>
                    )}

                    <h3 className="text-xl md:text-3xl font-extrabold font-heading leading-tight text-foreground tracking-tight line-clamp-2">
                      <Link
                        href={`/publicaciones/${item.slug}`}
                        className="hover:text-primary transition-colors"
                      >
                        {item.titulo}
                      </Link>
                    </h3>
                  </div>

                  {/* Children Links */}
                  {item.children && item.children.length > 0 && (
                    <div className="hidden md:block py-2">
                      <ul className="flex flex-wrap gap-x-6 gap-y-3">
                        {item.children.slice(0, 3).map((child) => (
                          <li key={child.id}>
                            <Link
                              href={`/publicaciones/${child.slug}`}
                              className="group/item flex items-center gap-2 text-sm text-foreground/90 hover:text-primary transition-colors font-medium bg-background/40 backdrop-blur-md p-2.5 rounded-xl border border-white/10 shadow-sm"
                            >
                              <ChevronRight className="h-4 w-4 text-primary shrink-0 group-hover/item:translate-x-0.5 transition-transform" />
                              <span className="max-w-[200px] truncate">
                                {child.titulo}
                              </span>
                            </Link>
                          </li>
                        ))}
                        {item.children.length > 3 && (
                          <li className="text-xs text-muted-foreground font-semibold self-center flex items-center">
                            + {item.children.length - 3} secciones adicionales
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      {(item.publishedDate || item.createdAt) && (
                        <>
                          <Calendar className="h-4 w-4" />
                          {new Date(
                            item.publishedDate || item.createdAt!,
                          ).toLocaleDateString("es-AR", {
                            year: "numeric",
                            month: "short",
                          })}
                        </>
                      )}
                    </div>
                    <Link
                      href={`/publicaciones/${item.slug}`}
                      className="inline-flex items-center gap-3 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:scale-105"
                    >
                      Ver Informe Completo
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Indicators - Mapped only to original items */}
        {items.length > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setIsTransitioning(true);
                  setCurrentIndex(i + clonesCount);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  (currentIndex - clonesCount + items.length) % items.length ===
                  i
                    ? "w-8 bg-primary"
                    : "w-1.5 bg-muted-foreground/30 hover:bg-primary/40"
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

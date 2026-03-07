"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Calendar, ArrowRight } from "lucide-react";
import type { FlatPublication } from "./PublicationsList";
import { SunRaysAnimated } from "@/components/SunRaysAnimated";

export interface FeaturedPublicationNode extends FlatPublication {
  children?: FlatPublication[];
}

interface Props {
  items: FeaturedPublicationNode[];
}

export function FeaturedPublicationsSlider({ items }: Props) {
  const clonesCount = 2;
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
      timerRef.current = setInterval(() => next(), 5000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [items.length, isHovered]);

  const handleTransitionEnd = () => {
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
      const frame = requestAnimationFrame(() => setIsTransitioning(true));
      return () => cancelAnimationFrame(frame);
    }
  }, [isTransitioning]);

  if (items.length === 0) return null;

  const next = () => {
    if (isTransitioning) setCurrentIndex((p) => p + 1);
  };
  const prev = () => {
    if (isTransitioning) setCurrentIndex((p) => p - 1);
  };

  return (
    <div className="space-y-4">
      {/* ── Nav controls ── */}
      {items.length > 1 && (
        <div className="flex justify-end gap-2">
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

      {/* ── Slider track ── */}
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className="flex gap-4 slider-track"
          onTransitionEnd={handleTransitionEnd}
          style={{
            transition: isTransitioning
              ? "transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)"
              : "none",
            transform: `translateX(calc(-${currentIndex} * (100% / var(--slides-visible, 1) + 16px)))`,
          }}
        >
          {extendedItems.map((item, index) => {
            const img = item.imagen_destacada as
              | { url?: string; alt?: string }
              | undefined;
            const imageUrl = img?.url;
            const date = item.publishedDate || item.createdAt;

            return (
              <div
                key={`${item.id}-${index}`}
                className="shrink-0 w-full md:w-[calc((100%-32px)/1.05)]"
              >
                {/* Mobile: image top, text bottom */}
                <div className="md:hidden rounded-xl border border-border bg-card overflow-hidden">
                  <Link href={`/publicaciones/${item.slug}`} className="block">
                    <div className="relative aspect-[16/9] overflow-hidden">
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
                        <div className="relative w-full h-full bg-primary flex items-center justify-center overflow-hidden">
                          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20">
                            <div className="aspect-square h-[200%]">
                              <SunRaysAnimated
                                fill
                                cycleDuration={6}
                                strokeColor="black"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-4 space-y-2">
                      {item.parentTitle && (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                          {item.parentTitle}
                        </span>
                      )}
                      <h3 className="font-bold text-base leading-snug line-clamp-2 font-heading">
                        {item.titulo}
                      </h3>
                      {date && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(date).toLocaleDateString("es-AR", {
                            year: "numeric",
                            month: "short",
                          })}
                        </p>
                      )}
                    </div>
                  </Link>
                </div>

                {/* Desktop: horizontal split — text left (primary bg), image right */}
                <div className="hidden md:flex rounded-2xl overflow-hidden border border-border shadow-sm min-h-[360px]">
                  {/* Left: solid primary background + text */}
                  <div className="flex-1 flex flex-col justify-between p-10 bg-primary text-primary-foreground">
                    <div>
                      {item.parentTitle && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white uppercase tracking-widest">
                          {item.parentTitle}
                        </span>
                      )}
                    </div>

                    <div className="space-y-5 flex-1 flex flex-col justify-center py-6">
                      <h3 className="text-3xl font-extrabold font-heading leading-tight tracking-tight text-white line-clamp-3">
                        <Link
                          href={`/publicaciones/${item.slug}`}
                          className="hover:opacity-80 transition-opacity"
                        >
                          {item.titulo}
                        </Link>
                      </h3>

                      {item.children && item.children.length > 0 && (
                        <ul className="flex flex-wrap gap-x-5 gap-y-2">
                          {item.children.slice(0, 3).map((child) => (
                            <li key={child.id}>
                              <Link
                                href={`/publicaciones/${child.slug}`}
                                className="flex items-center gap-1.5 text-sm text-white/75 hover:text-white transition-colors"
                              >
                                <ChevronRight className="h-3.5 w-3.5 text-white/50 shrink-0" />
                                <span className="max-w-[200px] truncate">
                                  {child.titulo}
                                </span>
                              </Link>
                            </li>
                          ))}
                          {item.children.length > 3 && (
                            <li className="text-xs text-white/50 self-center">
                              +{item.children.length - 3} más
                            </li>
                          )}
                        </ul>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      {date && (
                        <div className="flex items-center gap-1.5 text-xs text-white/50">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(date).toLocaleDateString("es-AR", {
                            year: "numeric",
                            month: "short",
                          })}
                        </div>
                      )}
                      <Link
                        href={`/publicaciones/${item.slug}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-primary font-bold rounded-xl hover:bg-white/90 transition-all text-sm shadow-sm"
                      >
                        Ver Informe
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>

                  {/* Right: image */}
                  <div className="w-[42%] shrink-0 relative overflow-hidden bg-primary/80">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={img?.alt || item.titulo}
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-700 hover:scale-105"
                        priority
                        sizes="42vw"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-primary/60 flex items-center justify-center overflow-hidden">
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-30">
                          <div className="aspect-square h-[200%]">
                            <SunRaysAnimated
                              fill
                              cycleDuration={8}
                              strokeColor="black"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dot indicators */}
        {items.length > 1 && (
          <div className="flex justify-center gap-2 mt-4">
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

      <style jsx global>{`
        .slider-track {
          --slides-visible: 1;
        }
        @media (min-width: 768px) {
          .slider-track {
            --slides-visible: 1;
          }
        }
      `}</style>
    </div>
  );
}

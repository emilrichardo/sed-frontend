"use client";

import { useEffect, useRef, useState } from "react";

interface StatItem {
  label: string;
  value: string;
  suffix?: string;
}

const stats: StatItem[] = [
  { label: "Publicaciones", value: "320", suffix: "+" },
  { label: "Categorías", value: "15" },
  { label: "Boletines Oficiales", value: "1.200", suffix: "+" },
  { label: "Datos Abiertos", value: "48" },
  { label: "Informes Estadísticos", value: "85" },
  { label: "Municipios", value: "28" },
];

/**
 * Compact scrolling stats carousel that auto-animates.
 * Shows small stat widgets sliding horizontally.
 */
export function StatsCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let pos = 0;
    const speed = 0.5; // px per frame

    const animate = () => {
      if (!isPaused && el) {
        pos += speed;
        // Reset when halfway (since content is duplicated)
        if (pos >= el.scrollWidth / 2) {
          pos = 0;
        }
        el.scrollLeft = pos;
      }
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPaused]);

  // Double the stats for seamless loop
  const allStats = [...stats, ...stats];

  return (
    <div
      className="relative overflow-hidden py-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-hidden"
        style={{ scrollBehavior: "auto" }}
      >
        {allStats.map((stat, i) => (
          <div
            key={`${stat.label}-${i}`}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-border bg-card shrink-0 hover:bg-muted/50 transition-colors"
          >
            <span className="text-xl md:text-2xl font-heading font-bold text-primary tabular-nums">
              {stat.value}
              {stat.suffix && (
                <span className="text-primary/60">{stat.suffix}</span>
              )}
            </span>
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

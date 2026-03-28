"use client";

import { useEffect, useRef } from "react";
import type { SiteStatCounts } from "@/lib/api";

interface StatItem {
  label: string;
  value: string;
  suffix?: string;
}

// Santiago del Estero — fixed geographic facts
const DEPTOS_SANTIAGO = 27;

const GEO_STATS: StatItem[] = [
  { label: "Superficie", value: "136.351km²" },
  { label: "Hab", value: "1.060.906" },
  { label: "Departamentos", value: String(DEPTOS_SANTIAGO) },
];

function buildStats(counts?: SiteStatCounts): StatItem[] {
  const fmt = (n: number) =>
    new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(n);

  const dynamicStats: StatItem[] = counts
    ? [
        { label: "Publicaciones", value: fmt(counts.informes) },
        { label: "Categorías", value: fmt(counts.categorias) },
        { label: "Boletines Oficiales", value: fmt(counts.boletines) },
        ...(counts.estadisticas > 0
          ? [{ label: "Datos Estadísticos", value: fmt(counts.estadisticas) }]
          : []),
      ]
    : [
        { label: "Publicaciones", value: "320", suffix: "+" },
        { label: "Categorías", value: "15" },
        { label: "Boletines Oficiales", value: "1.200", suffix: "+" },
        { label: "Datos Estadísticos", value: "48" },
        { label: "Informes", value: "85" },
      ];

  return [...GEO_STATS, ...dynamicStats];
}

interface Props {
  counts?: SiteStatCounts;
}

/**
 * Compact scrolling stats carousel that auto-animates.
 * Shows small stat widgets sliding horizontally.
 */
export function StatsCarousel({ counts }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(false);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let pos = 0;
    const speed = 0.5; // px per frame

    const animate = () => {
      if (!isPausedRef.current && el) {
        pos += speed;
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
  }, []);

  const stats = buildStats(counts);
  // Double for seamless loop
  const allStats = [...stats, ...stats];

  return (
    <div
      className="relative overflow-hidden py-4"
      onMouseEnter={() => {
        isPausedRef.current = true;
      }}
      onMouseLeave={() => {
        isPausedRef.current = false;
      }}
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
            className="flex  flex-1 tems-center gap-3 px-4 py-2.5 rounded-xl border border-border bg-card shrink-0 hover:bg-muted/50 transition-colors"
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

"use client";

import { useState, useEffect, useRef } from "react";
import { SunRaysAnimated } from "@/components/SunRaysAnimated";

/**
 * Hero section that compacts vertically as the user scrolls.
 * Initially full-size, smoothly transitions to a compact bar.
 */
export function HomeHero({ className }: { className?: string }) {
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Compact range: 0 → 300px scroll
  const progress = Math.min(scrollY / 300, 1);

  // Vertical padding: from 64px/80px down to 16px/20px
  const padY = Math.round(64 - progress * 48); // 64 → 16

  // Title scale: 1 → 0.4
  const titleScale = 1 - progress * 0.6;
  // Title opacity stays full
  const titleOpacity = 1 - progress * 0.3;

  // Subtitle fades out
  const subtitleOpacity = 1 - progress * 2.5; // disappears at 40% scroll

  // Sun opacity fades
  const sunOpacity = 0.2 - progress * 0.2;

  return (
    <section
      ref={heroRef}
      className={`relative overflow-hidden bg-primary flex items-center justify-center text-primary-foreground px-4 md:px-8 rounded-2xl transition-[padding] duration-100 ease-out ${className || ""}`}
      style={{
        paddingTop: `${padY}px`,
        paddingBottom: `${padY}px`,
      }}
    >
      {/* Sun animation — fades out on scroll */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-100"
        style={{ opacity: Math.max(sunOpacity, 0) }}
      >
        <div className="aspect-square h-[120%]">
          <SunRaysAnimated fill cycleDuration={4} strokeColor="black" />
        </div>
      </div>

      <div className="relative z-10 max-w-[1440px] mx-auto text-center">
        <p
          className="text-xs font-mono uppercase tracking-[0.2em] text-primary-foreground/60 mb-4 transition-opacity duration-100"
          style={{ opacity: Math.max(1 - progress * 3, 0) }}
        >
          Santiago del Estero | Argentina
        </p>

        <div
          className="transition-transform duration-100 ease-out origin-center"
          style={{
            transform: `scale(${titleScale})`,
            opacity: titleOpacity,
          }}
        >
          <h1 className="text-[clamp(3rem,10vw,8rem)] font-heading font-bold leading-[0.9] tracking-tight">
            Santiago
            <br />
            en Datos
          </h1>
        </div>

        <div
          className="overflow-hidden transition-all duration-100"
          style={{
            opacity: Math.max(subtitleOpacity, 0),
            maxHeight: subtitleOpacity > 0.05 ? "200px" : "0px",
            marginTop: subtitleOpacity > 0.05 ? "2rem" : "0",
          }}
        >
          <p className="text-base md:text-lg text-primary-foreground/70 max-w-lg leading-relaxed mx-auto">
            Transparencia, análisis y acceso a datos públicos de la provincia.
          </p>
        </div>
      </div>
    </section>
  );
}

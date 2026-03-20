"use client";

import { useState, useEffect } from "react";
import { SunRaysAnimated } from "@/components/SunRaysAnimated";
import { Wordmark } from "@/components/brand/Wordmark";

// March 26, 2026 at midnight Argentina time (UTC-3)
const TARGET_DATE = new Date("2026-03-27T03:00:00Z");

function getTimeLeft() {
  const diff = TARGET_DATE.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-5xl md:text-7xl font-mono font-light text-primary-foreground tabular-nums leading-none">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary-foreground/50">
        {label}
      </span>
    </div>
  );
}

export default function ProximamentePage() {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-primary flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Animated sun background */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.12]">
        <div className="aspect-square h-[130%]">
          <SunRaysAnimated fill cycleDuration={4} strokeColor="black" />
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 text-center max-w-2xl mx-auto">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary-foreground/50">
          Santiago del Estero · Argentina
        </p>

        <div style={{ width: "clamp(180px, 55vw, 500px)" }}>
          <Wordmark className="text-primary-foreground w-full" />
        </div>

        <p className="text-sm md:text-base text-primary-foreground/60 max-w-sm leading-relaxed">
          Transparencia, análisis y acceso a datos públicos de la provincia.
        </p>

        <div className="flex flex-col items-center gap-4 mt-2">
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-primary-foreground/40">
            Próximamente · 26 de marzo
          </p>

          <div className="flex items-start gap-4 md:gap-8">
            <CountdownUnit value={timeLeft.days} label="días" />
            <span className="text-3xl md:text-5xl text-primary-foreground/20 font-light leading-none mt-1">
              :
            </span>
            <CountdownUnit value={timeLeft.hours} label="horas" />
            <span className="text-3xl md:text-5xl text-primary-foreground/20 font-light leading-none mt-1">
              :
            </span>
            <CountdownUnit value={timeLeft.minutes} label="min" />
            <span className="text-3xl md:text-5xl text-primary-foreground/20 font-light leading-none mt-1">
              :
            </span>
            <CountdownUnit value={timeLeft.seconds} label="seg" />
          </div>
        </div>
      </div>
    </div>
  );
}

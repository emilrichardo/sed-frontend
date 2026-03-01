"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ChevronDown } from "lucide-react";

interface MobileScrollTransitionProps {
  nextPage: string;
  nextLabel: string;
}

export function MobileScrollTransition({ nextPage, nextLabel }: MobileScrollTransitionProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigatingRef = useRef(false);
  const router = useRouter();

  // Delay before activating the observer so that an inherited scroll position
  // from the previous page doesn't immediately trigger the transition.
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !navigatingRef.current) {
          setIsVisible(true);
          timerRef.current = setTimeout(() => {
            setIsLoading(true);
            setTimeout(() => {
              navigatingRef.current = true;
              router.push(nextPage);
            }, 700);
          }, 1500);
        } else {
          setIsVisible(false);
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
          if (!navigatingRef.current) setIsLoading(false);
        }
      },
      { threshold: 0.8 }
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [ready, nextPage, router]);

  return (
    <div className="md:hidden mt-6 mb-20">
      <div
        ref={sentinelRef}
        className="flex flex-col items-center gap-2 py-8"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-sm font-medium text-primary">
              Cargando {nextLabel}…
            </span>
          </>
        ) : (
          <>
            <ChevronDown
              className={`h-5 w-5 transition-all duration-500 ${
                isVisible
                  ? "opacity-100 translate-y-0 text-primary"
                  : "opacity-30 -translate-y-1 text-muted-foreground"
              }`}
            />
            <span className="text-xs text-muted-foreground">{nextLabel}</span>
          </>
        )}
      </div>
    </div>
  );
}

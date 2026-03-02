"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ChevronUp } from "lucide-react";

interface MobileScrollTransitionProps {
  nextPage: string;
  nextLabel: string;
}

// Finger travel needed (after resistance) to trigger navigation
const PULL_THRESHOLD = 75;
// Maximum visual pull distance (px)
const MAX_PULL = 110;
// Rubber-band resistance factor (< 1 = harder to pull)
const RESISTANCE = 0.45;
// Height of the indicator container (px) – indicator slides up from this offset
const CONTAINER_H = 88;

export function MobileScrollTransition({ nextPage, nextLabel }: MobileScrollTransitionProps) {
  const [pullDistance, setPullDistance] = useState(0);
  // true while springing back so we enable the CSS spring transition
  const [springBack, setSpringBack] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ready, setReady] = useState(false);

  // Refs so event-handler closures always read the latest value
  const pullRef = useRef(0);
  const touchStartY = useRef(0);
  const navigatingRef = useRef(false);

  const router = useRouter();

  // Delay activation so an inherited scroll position from the previous page
  // doesn't fire the gesture immediately on mount.
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 800);
    return () => clearTimeout(t);
  }, []);

  const triggerNavigation = useCallback(() => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    setSpringBack(false);
    setIsLoading(true);
    setTimeout(() => router.push(nextPage), 700);
  }, [nextPage, router]);

  useEffect(() => {
    if (!ready) return;

    const isAtBottom = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      return scrollTop + clientHeight >= scrollHeight - 4;
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (navigatingRef.current) return;
      touchStartY.current = e.touches[0].clientY;
      pullRef.current = 0;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (navigatingRef.current) return;

      // If user scrolled back up, reset
      if (!isAtBottom()) {
        if (pullRef.current > 0) {
          pullRef.current = 0;
          setSpringBack(false);
          setPullDistance(0);
        }
        return;
      }

      // deltaY > 0 means finger moved upward (pulling content up / pulling next page)
      const deltaY = touchStartY.current - e.touches[0].clientY;

      if (deltaY <= 0) {
        if (pullRef.current > 0) {
          pullRef.current = 0;
          setSpringBack(false);
          setPullDistance(0);
        }
        return;
      }

      // Apply rubber-band resistance and cap at MAX_PULL
      const pull = Math.min(deltaY * RESISTANCE, MAX_PULL);
      pullRef.current = pull;
      setSpringBack(false); // disable spring transition while actively pulling
      setPullDistance(pull);

      // Prevent native overscroll bounce so our indicator is the only feedback
      if (pull > 5) e.preventDefault();
    };

    const handleTouchEnd = () => {
      if (navigatingRef.current) return;

      if (pullRef.current >= PULL_THRESHOLD) {
        triggerNavigation();
      } else if (pullRef.current > 0) {
        // Not enough — spring the indicator back down
        pullRef.current = 0;
        setSpringBack(true);
        setPullDistance(0);
      }
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [ready, triggerNavigation]);

  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const isTriggered = progress >= 1;
  const circumference = 2 * Math.PI * 14; // r = 14 in viewBox "0 0 36 36"

  // Slide indicator up from the container bottom as the user pulls.
  // translateY(CONTAINER_H) = fully hidden; translateY(0) = fully visible.
  const translateY = Math.max(CONTAINER_H - pullDistance, 0);

  return (
    <div
      className="md:hidden mb-20 relative overflow-hidden"
      style={{ height: CONTAINER_H }}
    >
      <div
        className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 py-4"
        style={{
          transform: `translateY(${translateY}px)`,
          opacity: Math.min(progress * 1.8, 1),
          // Only enable CSS transition when springing back (or loading);
          // during active pull we track the finger directly (no lag).
          transition:
            springBack || isLoading
              ? "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease"
              : "none",
        }}
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
            {/* Circular progress ring */}
            <div className="relative h-10 w-10 flex items-center justify-center">
              <svg
                className="absolute inset-0"
                viewBox="0 0 36 36"
                style={{ transform: "rotate(-90deg)" }}
              >
                {/* Track */}
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  strokeWidth="2"
                  stroke="currentColor"
                  className="text-muted-foreground/25"
                />
                {/* Fill */}
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  strokeWidth="2"
                  strokeLinecap="round"
                  stroke="currentColor"
                  strokeDasharray={`${progress * circumference} ${circumference}`}
                  className={isTriggered ? "text-primary" : "text-primary/70"}
                />
              </svg>

              <ChevronUp
                className={`h-4 w-4 transition-colors duration-200 ${
                  isTriggered ? "text-primary" : "text-muted-foreground"
                }`}
                style={{
                  transform: isTriggered ? "translateY(-2px)" : "translateY(0)",
                  transition: "transform 0.2s ease",
                }}
              />
            </div>

            <span
              className={`text-xs font-medium transition-colors duration-200 ${
                isTriggered ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {isTriggered ? `Soltá para ir a ${nextLabel}` : `↑ ${nextLabel}`}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

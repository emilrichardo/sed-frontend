"use client";

import { useState, useEffect } from "react";

/**
 * Horizontal scroll progress bar that appears at the top of the page,
 * showing how much of the publication content has been read.
 */
export function ScrollProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        setProgress(Math.min((scrollTop / docHeight) * 100, 100));
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (progress < 1) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[70] h-1 bg-muted/30">
      <div
        className="h-full bg-primary transition-[width] duration-100 ease-out rounded-r-full"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

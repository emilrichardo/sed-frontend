"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TableBlock } from "./TableBlock";
import type { TablaBlockData } from "@/utils/publicacion";

export function PublicationTableSlider({
  blocks,
}: {
  blocks: TablaBlockData[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!blocks || blocks.length === 0) return null;

  const next = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % blocks.length);
  };

  const prev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + blocks.length) % blocks.length);
  };

  return (
    <div
      className="w-full relative group/slider flex flex-col h-[500px] overflow-hidden"
      onClick={(e) => e.preventDefault()}
    >
      <div
        className="relative flex-1 overflow-hidden"
        onClick={(e) => e.preventDefault()}
      >
        <div
          className="flex h-full transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {blocks.map((block, index) => (
            <div
              key={index}
              className="w-full shrink-0 h-full overflow-y-auto custom-scrollbar relative"
            >
              <TableBlock fields={block as any} isWidget={true} />
            </div>
          ))}
        </div>

        {/* Navigation Arrows for Slider */}
        {blocks.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full border border-border bg-background/80 backdrop-blur-sm text-foreground hover:bg-muted transition-colors opacity-0 group-hover/slider:opacity-100 z-10 shadow-sm"
              aria-label="Anterior tabla"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full border border-border bg-background/80 backdrop-blur-sm text-foreground hover:bg-muted transition-colors opacity-0 group-hover/slider:opacity-100 z-10 shadow-sm"
              aria-label="Siguiente tabla"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Indicators */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {blocks.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentIndex(i);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 shadow-sm ${
                    currentIndex === i
                      ? "w-4 bg-primary"
                      : "w-1.5 bg-muted-foreground/50 hover:bg-muted-foreground/80"
                  }`}
                  aria-label={`Tabla ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

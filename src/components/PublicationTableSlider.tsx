"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { TableBlock } from "./TableBlock";
import type { TablaBlockData } from "@/utils/publicacion";

// ── Full-screen table modal ──────────────────────────────────────────────────

function TableModal({
  block,
  onClose,
}: {
  block: TablaBlockData;
  onClose: () => void;
}) {
  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex flex-col animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Modal panel */}
      <div
        className="relative flex flex-col bg-background w-full h-full md:m-6 md:rounded-xl md:h-[calc(100vh-3rem)] md:w-[calc(100vw-3rem)] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border shrink-0 bg-background">
          <span className="text-sm font-medium text-muted-foreground font-mono uppercase tracking-widest">
            Tabla completa
          </span>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Table content — full size, scrollable */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <TableBlock fields={block as any} isWidget={false} />
        </div>
      </div>
    </div>
  );
}

// ── Slider ───────────────────────────────────────────────────────────────────

export function PublicationTableSlider({
  blocks,
}: {
  blocks: TablaBlockData[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expandedBlock, setExpandedBlock] = useState<TablaBlockData | null>(
    null,
  );

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

  const handleExpand = (e: React.MouseEvent, block: TablaBlockData) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedBlock(block);
  };

  return (
    <>
      <div
        className="w-full relative group/slider flex flex-col overflow-hidden"
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
                style={{ minHeight: 'fit-content' }}
              >
                <TableBlock fields={block as any} isWidget={true} />

                {/* Expand button — top right corner of each block */}
                <button
                  onClick={(e) => handleExpand(e, block)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg border border-border bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all opacity-0 group-hover/slider:opacity-100 z-20 shadow-sm"
                  aria-label="Ver tabla completa"
                  title="Ver tabla completa"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
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

      {/* Full-screen modal */}
      {expandedBlock && (
        <TableModal
          block={expandedBlock}
          onClose={() => setExpandedBlock(null)}
        />
      )}
    </>
  );
}

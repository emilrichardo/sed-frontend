"use client";

import React, { useState, useRef } from "react";
import HTMLFlipBook from "react-pageflip";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

// Use locally served worker from public/ (no CDN dependency, no CORS issues)
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface BulletinFlipbookProps {
  pdfUrl: string;
  onClose: () => void;
  isOpen: boolean;
}

// Route external PDF URLs through a same-origin proxy to avoid CORS issues
function getProxiedUrl(url: string): string {
  if (url.startsWith("/") || url.startsWith("blob:")) return url;
  return `/api/pdf-proxy?url=${encodeURIComponent(url)}`;
}

export default function BulletinFlipbook({
  pdfUrl,
  onClose,
  isOpen,
}: BulletinFlipbookProps) {
  const proxiedUrl = getProxiedUrl(pdfUrl);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const flipBookRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageWidth, setPageWidth] = useState(400); // Default larger start width

  // Auto-calculate optimal width based on container width (30% of screen approx)
  React.useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        // Aim for a width that fits with some padding, maintaining aspect ratio roughly
        // If height is the constraint, width follows.
        // Let's assume A4 ratio roughly 0.707
        const RATIO = 0.707;

        let targetWidth = clientWidth - 40; // 20px padding each side
        let targetHeight = targetWidth / RATIO;

        if (targetHeight > clientHeight - 40) {
          targetHeight = clientHeight - 40;
          targetWidth = targetHeight * RATIO;
        }

        setPageWidth(Math.floor(targetWidth));
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    // Small timeout to allow slide-in animation to finish/layout to settle
    const timer = setTimeout(updateDimensions, 350);
    return () => {
      window.removeEventListener("resize", updateDimensions);
      clearTimeout(timer);
    };
  }, [isOpen]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const nextPage = () => {
    flipBookRef.current?.pageFlip()?.flipNext();
  };

  const prevPage = () => {
    flipBookRef.current?.pageFlip()?.flipPrev();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60"
        style={{ zIndex: 9998 }}
        onClick={onClose}
      />

      <div
        className="fixed inset-y-0 right-0 w-full md:w-1/2 bg-zinc-900 border-l border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
        style={{ zIndex: 9999 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900 z-10 shrink-0">
          <h3 className="text-white font-medium text-sm flex items-center gap-2">
            <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-xs">
              PDF
            </span>
            Modo Lectura
          </h3>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors px-3 py-1.5 rounded-md text-sm"
          >
            <X className="h-4 w-4" />
            Cerrar
          </button>
        </div>

        {/* Main Content */}
        <div
          className="flex-1 overflow-hidden relative flex items-center justify-center bg-zinc-900/95"
          ref={containerRef}
        >
          {pageWidth > 0 && (
            <div className="relative flex justify-center items-center">
              <Document
                file={proxiedUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={
                  <div className="text-white text-sm animate-pulse">
                    Cargando PDF...
                  </div>
                }
                error={
                  <div className="text-red-400 text-sm p-4 text-center">
                    Error al cargar el PDF.
                  </div>
                }
                className="flex justify-center"
              >
                <HTMLFlipBook
                  width={pageWidth}
                  height={pageWidth * 1.4142} // A4 ratio approx
                  size="fixed"
                  minWidth={200}
                  maxWidth={1000}
                  minHeight={300}
                  maxHeight={1400}
                  maxShadowOpacity={0.5}
                  showCover={true}
                  mobileScrollSupport={true}
                  className="demo-book"
                  ref={flipBookRef}
                  onFlip={(e: any) => setCurrentPage(e.data)}
                  startPage={0}
                  drawShadow={true}
                  flippingTime={800}
                  usePortrait={true}
                  startZIndex={0}
                  autoSize={true}
                  clickEventForward={true}
                  useMouseEvents={true}
                  swipeDistance={30}
                  showPageCorners={true}
                  disableFlipByClick={false}
                  style={{}}
                >
                  {Array.from(new Array(numPages || 0), (el, index) => (
                    <div
                      key={`page_${index + 1}`}
                      className="bg-white overflow-hidden shadow-lg border border-gray-200"
                    >
                      <Page
                        pageNumber={index + 1}
                        width={pageWidth}
                        renderAnnotationLayer={false}
                        renderTextLayer={false}
                        loading=""
                      />
                      <div className="absolute bottom-2 right-2 text-[10px] text-gray-500 font-mono bg-white/80 px-1 rounded">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </HTMLFlipBook>
              </Document>
            </div>
          )}
        </div>

        {/* Footer / Controls */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900 flex items-center justify-between text-white shrink-0">
          <button
            onClick={prevPage}
            disabled={currentPage === 0}
            className="p-2 hover:bg-zinc-800 rounded-full disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <span className="text-xs font-mono text-zinc-400">
            {numPages ? `${currentPage + 1} / ${numPages}` : "--"}
          </span>

          <button
            onClick={nextPage}
            disabled={numPages ? currentPage === numPages - 1 : true}
            className="p-2 hover:bg-zinc-800 rounded-full disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </>
  );
}

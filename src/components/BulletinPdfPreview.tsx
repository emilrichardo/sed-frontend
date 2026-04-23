"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Loader2, AlertCircle } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

function getProxiedUrl(url: string): string {
  if (url.startsWith("/") || url.startsWith("blob:")) return url;
  return `/api/pdf-proxy?url=${encodeURIComponent(url)}`;
}

interface BulletinPdfPreviewProps {
  pdfUrl: string;
  heightVh?: number;
  className?: string;
}

export default function BulletinPdfPreview({
  pdfUrl,
  heightVh = 75,
  className,
}: BulletinPdfPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageWidth, setPageWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setPageWidth(Math.max(0, el.clientWidth - 16));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const proxiedUrl = getProxiedUrl(pdfUrl);

  return (
    <div
      ref={containerRef}
      className={
        "rounded-lg border overflow-auto shadow-sm bg-muted/10 p-2 " +
        (className ?? "")
      }
      style={{ height: `${heightVh}vh` }}
    >
      <Document
        file={proxiedUrl}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        loading={
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span className="text-sm">Cargando PDF...</span>
          </div>
        }
        error={
          <div className="flex flex-col items-center justify-center h-full text-destructive p-4 text-center">
            <AlertCircle className="h-5 w-5 mb-2" />
            <span className="text-sm">No se pudo cargar el PDF.</span>
          </div>
        }
      >
        {pageWidth > 0 &&
          Array.from(new Array(numPages ?? 0), (_, i) => (
            <div
              key={`page_${i + 1}`}
              className="mb-2 mx-auto shadow-sm bg-white"
              style={{ width: pageWidth }}
            >
              <Page
                pageNumber={i + 1}
                width={pageWidth}
                renderAnnotationLayer={false}
                renderTextLayer={false}
                loading=""
              />
            </div>
          ))}
      </Document>
    </div>
  );
}

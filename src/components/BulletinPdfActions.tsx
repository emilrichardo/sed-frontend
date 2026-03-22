"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { BookOpen, Download } from "lucide-react";

const BulletinFlipbook = dynamic(() => import("./BulletinFlipbook"), {
  ssr: false,
});

export default function BulletinPdfActions({ pdfUrl }: { pdfUrl: string }) {
  const [showFlipbook, setShowFlipbook] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowFlipbook(true)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary border border-border rounded-full px-3 py-1 transition-colors"
      >
        <BookOpen className="h-3.5 w-3.5" />
        Modo Lectura
      </button>
      <a
        href={pdfUrl}
        download
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary border border-border rounded-full px-3 py-1 transition-colors"
      >
        <Download className="h-3.5 w-3.5" />
        Descargar PDF
      </a>
      <BulletinFlipbook
        isOpen={showFlipbook}
        onClose={() => setShowFlipbook(false)}
        pdfUrl={pdfUrl}
      />
    </>
  );
}

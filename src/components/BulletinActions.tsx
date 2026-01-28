"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Boletin } from "@/lib/api";
import BulletinFlipbook from "./BulletinFlipbook";
import { Eye, BookOpen } from "lucide-react";

export default function BulletinActions({ bulletin }: { bulletin: Boletin }) {
  const { user } = useAuth();
  const [showFlipbook, setShowFlipbook] = React.useState(false);

  if (!user || !bulletin.archivo_binario) return null;

  const getPdfUrl = () => {
    let url = "";
    if (typeof bulletin.archivo_binario === "string") {
      return "";
    } else if (
      typeof bulletin.archivo_binario === "object" &&
      bulletin.archivo_binario !== null
    ) {
      const media = bulletin.archivo_binario;
      if (media.filename) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        url = `${supabaseUrl}/storage/v1/object/public/boletines-pdf/${media.filename}`;
      } else if (media.url) {
        url = media.url;
      }
    }
    return url;
  };

  const pdfUrl = getPdfUrl();

  const handleOpenOriginal = () => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank");
    } else {
      alert("No se pudo obtener la URL del archivo.");
    }
  };

  return (
    <>
      <div className="flex gap-2 mt-4">
        <button
          onClick={handleOpenOriginal}
          className="flex items-center gap-2 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium transition-colors"
        >
          <Eye className="w-4 h-4" />
          Ver PDF Original
        </button>
        <button
          onClick={() => setShowFlipbook(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          Modo Lectura
        </button>
      </div>

      <BulletinFlipbook
        isOpen={showFlipbook}
        onClose={() => setShowFlipbook(false)}
        pdfUrl={pdfUrl}
      />
    </>
  );
}

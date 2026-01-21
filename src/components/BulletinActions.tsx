"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Boletin } from "@/lib/api";
import { FileDown, Eye } from "lucide-react";

export default function BulletinActions({ bulletin }: { bulletin: Boletin }) {
  const { user } = useAuth();

  if (!user || !bulletin.archivo_binario) return null;

  const handlePreview = () => {
    let url = "";

    // Handle different shapes of archivo_binario
    if (typeof bulletin.archivo_binario === "string") {
      // If it's just an ID, we can't guess the filename easily without fetching it or assuming logic.
      // But typically with depth, it's an object.
      // If string, let's assume we can't do much unless we have a formatted URL.
      console.warn("Bulletin binary is a string ID, cannot resolve URL.");
      return;
    } else if (
      typeof bulletin.archivo_binario === "object" &&
      bulletin.archivo_binario !== null
    ) {
      // Check if Payload gave us a valid URL (and if it's localhost issue) or if we need to construct it
      const media = bulletin.archivo_binario;

      // If media.url exists and seems broken (localhost), or generally prefer explicit construction:
      if (media.filename) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        // Construct explicit Supabase URL
        url = `${supabaseUrl}/storage/v1/object/public/boletines-pdf/${media.filename}`;
      } else if (media.url) {
        url = media.url;
      }
    }

    if (url) {
      window.open(url, "_blank");
    } else {
      alert("No se pudo obtener la URL del archivo.");
    }
  };

  return (
    <div className="flex gap-2 mt-4">
      <button
        onClick={handlePreview}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        <Eye className="w-4 h-4" />
        Ver PDF Original
      </button>
    </div>
  );
}

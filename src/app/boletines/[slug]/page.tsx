import React from "react";
import { getBulletin, Boletin } from "@/lib/api";
import Link from "next/link";
import { Archive } from "lucide-react";
import BulletinActions from "@/components/BulletinActions";
import BulletinEntriesLoader from "@/components/BulletinEntriesLoader";
import BulletinPdfActions from "@/components/BulletinPdfActions";

function getBulletinPdfUrl(bulletin: Boletin): string | null {
  if (!bulletin.archivo_binario) return null;
  if (typeof bulletin.archivo_binario === "string") return null;
  const media = bulletin.archivo_binario as { url?: string };
  return media.url ?? null;
}

export default async function BulletinDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let bulletin: Boletin;

  try {
    bulletin = await getBulletin(slug);
  } catch (err: unknown) {
    console.error("Error loading bulletin:", err);
    const errorMessage =
      err instanceof Error
        ? err.message
        : "No se pudo encontrar el boletín solicitado.";
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold">Error al cargar el boletín</h1>
        <p className="text-muted-foreground mt-2">{errorMessage}</p>
        <Link
          href="/boletines"
          className="text-primary hover:underline mt-4 inline-block"
        >
          Volver al archivo
        </Link>
      </div>
    );
  }

  const pdfUrl = getBulletinPdfUrl(bulletin);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR", {
      timeZone: "UTC",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <main className="container mx-auto px-4 py-8 space-y-8">
      <div className="pb-6 space-y-3">
        {/* Top bar: metadata + actions */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
            <span className="font-mono font-medium text-foreground/70 text-xs bg-muted px-2.5 py-1 rounded-full">
              Boletín Oficial Nº {bulletin.numero}
            </span>
            <span>·</span>
            <span>{formatDate(bulletin.fecha_publicacion)}</span>
            {bulletin.cantidad_paginas && (
              <>
                <span>·</span>
                <span>{bulletin.cantidad_paginas} páginas</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {pdfUrl && <BulletinPdfActions pdfUrl={pdfUrl} />}
            <Link
              href="/boletines"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary border border-border rounded-full px-3 py-1 transition-colors"
            >
              <Archive className="h-3.5 w-3.5" />
              Archivo
            </Link>
          </div>
        </div>

        <BulletinActions bulletin={bulletin} />

        {bulletin.imagen_destacada?.url && (
          <div className="mt-6 rounded-lg overflow-hidden relative aspect-video shadow-sm border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bulletin.imagen_destacada.url}
              alt={
                bulletin.imagen_destacada.alt || `Boletín ${bulletin.numero}`
              }
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      <div className="space-y-6">
        <BulletinEntriesLoader bulletin={bulletin} />
      </div>
    </main>
  );
}

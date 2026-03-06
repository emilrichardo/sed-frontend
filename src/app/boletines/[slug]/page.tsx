import React from "react";
import { getBulletin, Boletin } from "@/lib/api";
import Link from "next/link";
import { Archive } from "lucide-react";
import BulletinActions from "@/components/BulletinActions";
import BulletinEntriesLoader from "@/components/BulletinEntriesLoader";

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
      <div className="pb-6 space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-heading font-bold">
            Boletín Oficial Nº {bulletin.numero}
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono bg-muted px-3 py-1 rounded-full">
              {bulletin.año_edicion}
            </span>
            <Link
              href="/boletines"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary border border-border rounded-full px-3 py-1 transition-colors"
            >
              <Archive className="h-3.5 w-3.5" />
              Archivo
            </Link>
          </div>
        </div>
        <p className="text-muted-foreground">
          Publicado el {formatDate(bulletin.fecha_publicacion)} •{" "}
          {bulletin.cantidad_paginas} páginas
        </p>
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
        {/* Fetch entries on the client because they may require auth token from localStorage */}
        <BulletinEntriesLoader bulletin={bulletin} />
      </div>
    </main>
  );
}

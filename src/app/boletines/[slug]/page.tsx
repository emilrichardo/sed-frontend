import React from "react";
import { getBulletin, Boletin } from "@/lib/api";
import Link from "next/link";
import { ChevronLeft, FileText } from "lucide-react";
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
  } catch (err: any) {
    console.error("Error loading bulletin:", err);
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold">Error al cargar el boletín</h1>
        <p className="text-muted-foreground mt-2">
          {err.message || "No se pudo encontrar el boletín solicitado."}
        </p>
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
      <Link
        href="/boletines"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver al archivo
      </Link>

      <div className="border-b pb-6 space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">
            Boletín Oficial Nº {bulletin.numero}
          </h1>
          <span className="text-sm font-mono bg-muted px-3 py-1 rounded-full">
            {bulletin.año_edicion}
          </span>
        </div>
        <p className="text-muted-foreground">
          Publicado el {formatDate(bulletin.fecha_publicacion)} •{" "}
          {bulletin.cantidad_paginas} páginas
        </p>
        <BulletinActions bulletin={bulletin} />
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Actos Administrativos en esta edición
        </h2>

        {/* Fetch entries on the client because they may require auth token from localStorage */}
        <BulletinEntriesLoader bulletinId={bulletin.id} />
      </div>
    </main>
  );
}

import React from "react";
import BulletinArchiveContainer from "@/components/BulletinArchiveContainer";
import { PageHeader } from "@/components/PageHeader";
import { FileText, Star } from "lucide-react";
import { getBulletins } from "@/lib/api";
import Link from "next/link";

export const metadata = {
  title: "Archivo de Boletines Oficiales | Santiago en Datos",
  description:
    "Consulta el archivo histórico de boletines oficiales y actos administrativos.",
};

export default async function BoletinPage() {
  // Fetch the most recent bulletin to feature at the top
  const latestResult = await getBulletins({ limit: 1 });
  const todayBulletin = latestResult.docs[0] ?? null;

  const isToday = todayBulletin
    ? new Date(todayBulletin.fecha_publicacion).toDateString() ===
      new Date().toDateString()
    : false;

  return (
    <main className="container mx-auto px-4 py-8 md:py-12 space-y-8">
      <PageHeader
        title="Boletín Oficial"
        description="Acceso centralizado a la normativa y actos administrativos oficiales."
        icon={FileText}
      />

      {/* ── Boletín Destacado ── */}
      {todayBulletin && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {isToday ? "Boletín del día" : "Último boletín publicado"}
            </span>
          </div>
          <Link
            href={`/boletines/${todayBulletin.slug}`}
            className="block p-5 md:p-6 border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all group rounded-lg shadow-sm hover:shadow-md"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {isToday && (
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-yellow-500 text-white rounded-full">
                      Hoy
                    </span>
                  )}
                  <h3 className="text-lg md:text-xl font-bold group-hover:text-primary transition-colors">
                    Boletín Oficial Nº {todayBulletin.numero}
                  </h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  Publicado el{" "}
                  {new Date(
                    todayBulletin.fecha_publicacion
                  ).toLocaleDateString("es-AR", {
                    timeZone: "UTC",
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold font-mono border border-primary rounded-full shrink-0">
                {todayBulletin.año_edicion}
              </span>
            </div>
            <div className="flex gap-6 text-xs md:text-sm text-muted-foreground">
              <span>{todayBulletin.cantidad_paginas} páginas</span>
              {(todayBulletin.cant_actos ?? 0) > 0 && (
                <span>{todayBulletin.cant_actos} actos</span>
              )}
            </div>
          </Link>
        </section>
      )}

      <BulletinArchiveContainer />
    </main>
  );
}

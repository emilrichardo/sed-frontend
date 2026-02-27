import { getBulletins, getReports, getCategories } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { PublicationTableSlider } from "@/components/PublicationTableSlider";
import { extractAllTablaBlocks, shouldShowChart } from "@/utils/publicacion";
import { SunRaysAnimated } from "@/components/SunRaysAnimated";

import Link from "next/link";
import { FileText, ArrowRight, BookOpen, ArrowUpRight } from "lucide-react";

export const revalidate = 60;

export default async function Home() {
  const [bulletins, reports, rootCategories] = await Promise.all([
    getBulletins({ limit: 1 }),
    getReports({ limit: 4, where: { parent: { exists: false } } }),
    getCategories({ sinPadre: true }),
  ]);

  const latestBulletin = bulletins.docs[0];

  return (
    <div className="w-full">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden  md:-mx-8 bg-primary text-primary-foreground px-4 md:px-8 py-16 md:py-20 rounded-2xl">
        {/* Sun — centered, 120% of hero height */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="aspect-square h-[120%] opacity-20">
            <SunRaysAnimated fill cycleDuration={4} strokeColor="black" />
          </div>
        </div>

        <div className="relative z-10 max-w-[1440px] mx-auto text-center">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary-foreground/60 mb-6">
            Santiago en Datos
          </p>
          <h1 className="text-[clamp(3rem,10vw,8rem)] font-heading font-bold leading-[0.9] tracking-tight">
            Santiago
            <br />
            en Datos
          </h1>
          <p className="mt-8 text-base md:text-lg text-primary-foreground/70 max-w-lg leading-relaxed mx-auto">
            Transparencia, análisis y acceso a datos públicos de la provincia.
          </p>
        </div>
      </section>

      {/* ── Categories list ── */}
      {rootCategories.length > 0 && (
        <nav
          className="-mx-4 md:-mx-8 border-b border-border"
          aria-label="Categorías principales"
        >
          {rootCategories.map((cat) => (
            <Link
              key={cat.id}
              href={`/categorias/${cat.slug}`}
              className="flex items-center justify-between w-full px-4 md:px-8 py-5 border-t border-border hover:bg-muted/50 transition-colors group"
            >
              <span className="text-2xl md:text-3xl font-heading font-bold tracking-tight group-hover:text-primary transition-colors">
                {cat.nombre}
              </span>
              <ArrowUpRight className="h-6 w-6 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          ))}
        </nav>
      )}

      {/* ── Main content ── */}
      <div className="py-8 md:py-12">
        <section className="mb-4 -mx-4">
          {latestBulletin ? (
            <Link
              href={`/boletines/${latestBulletin.slug}`}
              className="block p-6 border bg-card hover:bg-muted/50 transition-all group rounded-lg shadow-sm hover:shadow-md"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                    Boletín Oficial Nº {latestBulletin.numero}
                  </h3>
                  <p className="text-muted-foreground">
                    Publicado el{" "}
                    {new Date(
                      latestBulletin.fecha_publicacion,
                    ).toLocaleDateString("es-AR")}
                  </p>
                </div>
                <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold font-mono border border-primary rounded-full">
                  {latestBulletin.año_edicion}
                </span>
              </div>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>{latestBulletin.cantidad_paginas} páginas</span>
              </div>
            </Link>
          ) : (
            <p className="text-muted-foreground italic">
              No hay boletines disponibles.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

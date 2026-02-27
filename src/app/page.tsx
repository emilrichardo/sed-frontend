import { getBulletins, getReports, getCategories } from "@/lib/api";
import { Card } from "@/components/ui/Card";

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
      <section className="-mx-4 md:-mx-8 -mt-6 bg-primary text-primary-foreground px-4 md:px-8 py-20 md:py-32 rounded-2xl">
        <div className="max-w-[1440px] mx-auto text-center">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary-foreground/60 mb-6">
            Gobierno de Santiago del Estero
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

      {/* ── Categories super menu ── */}
      <section className="-mx-4 md:-mx-8 border-b border-border bg-card sticky top-16 z-40">
        <div className="max-w-[1440px] mx-auto">
          {rootCategories.length > 0 ? (
            <nav className="flex items-stretch overflow-x-auto" aria-label="Categorías principales">
              <span className="hidden md:flex items-center px-5 py-4 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground border-r border-border whitespace-nowrap shrink-0">
                Categorías
              </span>
              {rootCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categorias/${cat.slug}`}
                  className="flex items-center gap-1.5 px-5 py-4 text-sm font-medium whitespace-nowrap text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border-r border-border"
                >
                  {cat.nombre}
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                </Link>
              ))}
            </nav>
          ) : (
            <div className="px-5 py-4 text-xs text-muted-foreground italic">
              Categorías próximamente
            </div>
          )}
        </div>
      </section>

      {/* ── Main content ── */}
      <div className="py-8 md:py-12">
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Último Boletín Oficial
            </h2>
            <div className="flex items-center gap-4">
              <Link
                href="/admin/subir-boletin"
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground border border-primary hover:bg-primary/90 transition-colors rounded-md shadow-sm hover:shadow-md font-bold text-sm tracking-normal"
              >
                <FileText className="w-4 h-4" />
                Cargar Boletín
              </Link>
              <Link
                href="/boletines"
                className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
              >
                Ver todos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

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

        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              Publicaciones
            </h2>
            <Link
              href="/publicaciones"
              className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
            >
              Ver todos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {reports.docs.map((item) => {
              const contenido = item.contenido as { root?: { children?: any[] } };

              let description = "Sin descripción";
              if (contenido?.root?.children) {
                const firstTextNode = contenido.root.children.find(
                  (child: { children?: { text?: string }[] }) =>
                    child.children &&
                    child.children.length > 0 &&
                    child.children[0].text,
                );
                if (firstTextNode) {
                  description = firstTextNode.children![0].text!;
                }
              }

              return (
                <Card
                  key={item.id}
                  title={item.titulo}
                  description={description}
                  date={item.createdAt}
                  href={`/publicaciones/${item.slug}`}
                  imageUrl={item.imagen_destacada?.url}
                  imageAlt={item.imagen_destacada?.alt}
                />
              );
            })}
          </div>
          {reports.docs.length === 0 && (
            <p className="text-muted-foreground italic">
              No hay publicaciones disponibles.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

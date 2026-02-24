import { getBulletins, getReports } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Stats } from "@/components/Stats";

import Link from "next/link";
import { FileText, ArrowRight, BookOpen } from "lucide-react";

export const revalidate = 60;

export default async function Home() {
  const [bulletins, reports] = await Promise.all([
    getBulletins({ limit: 1 }),
    getReports({ limit: 4, where: { parent: { exists: false } } }),
  ]);

  const latestBulletin = bulletins.docs[0];

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <Stats />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.docs.map((item) => {
            const contenido = item.contenido as any;

            let description = "Sin descripción";
            if (contenido?.root?.children) {
              const firstTextNode = contenido.root.children.find(
                (child: any) =>
                  child.children &&
                  child.children.length > 0 &&
                  child.children[0].text,
              );
              if (firstTextNode) {
                description = firstTextNode.children[0].text;
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
                // layout="horizontal" removed to use default vertical layout for grid
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
  );
}

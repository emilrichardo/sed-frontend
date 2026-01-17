import { getNews, getBulletins } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { CreateNewsButton } from "@/components/CreateNewsButton";

import Link from "next/link";
import { FileText, ArrowRight } from "lucide-react";

export const revalidate = 60;

export default async function Home() {
  const [news, bulletins] = await Promise.all([
    getNews(),
    getBulletins({ limit: 1 }),
  ]);

  const latestBulletin = bulletins.docs[0];

  return (
    <div className="max-w-4xl mx-auto">
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Último Boletín Oficial
          </h2>
          <div className="flex items-center gap-4">
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
            className="block p-6 border rounded-xl bg-card hover:border-primary transition-all group shadow-sm"
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
              <span className="px-3 py-1 bg-muted rounded-full text-xs font-mono">
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

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Últimas Noticias</h2>
          <div className="flex items-center gap-4">
            <CreateNewsButton />
            <Link
              href="/noticias"
              className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
            >
              Ver todas
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {news.docs.map((item) => {
            // Extract a brief description from the content if available
            const description =
              item.contenido?.root?.children?.find(
                (child: any) =>
                  child.type === "paragraph" || child.type === "heading",
              )?.children?.[0]?.text || "Sin descripción";

            return (
              <Card
                key={item.id}
                title={item.titulo}
                description={description}
                date={item.createdAt}
                href={`/noticias/${item.slug}`}
              />
            );
          })}
        </div>

        {news.docs.length === 0 && (
          <p className="text-muted-foreground italic">
            No hay noticias disponibles.
          </p>
        )}
      </section>
    </div>
  );
}

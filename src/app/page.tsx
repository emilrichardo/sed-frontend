import { getNews, getBulletins } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { CreateNewsButton } from "@/components/CreateNewsButton";
import { Stats } from "@/components/Stats";

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
    <div className="max-w-7xl mx-auto">
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
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground border-2 border-primary hover:bg-black hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-[1px] font-bold text-sm uppercase tracking-wide"
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
            className="block p-6 border-2 border-black bg-card hover:bg-muted transition-all group shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px]"
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
              <span className="px-3 py-1 bg-black text-white text-xs font-bold font-mono uppercase border-2 border-black">
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
            const contenido = item.contenido as
              | {
                  root?: {
                    children?: Array<{
                      type?: string;
                      children?: Array<{ text?: string }>;
                    }>;
                  };
                }
              | undefined;
            const description =
              contenido?.root?.children?.find(
                (child) =>
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

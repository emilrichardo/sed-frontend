import { getNews } from "@/lib/api";
import { Card } from "@/components/ui/Card";

export const revalidate = 60;

export default async function Home() {
  const news = await getNews();

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-12 border-b border-border pb-6">
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          Santiago en Datos
        </h1>
        <p className="text-muted-foreground text-lg">
          Documentación y noticias.
        </p>
      </header>

      <section>
        <h2 className="text-2xl font-semibold mb-6">Últimas Noticias</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {news.docs.map((item) => {
            // Extract a brief description from the content if available
            const description =
              item.contenido?.root?.children?.find(
                (child: any) =>
                  child.type === "paragraph" || child.type === "heading"
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

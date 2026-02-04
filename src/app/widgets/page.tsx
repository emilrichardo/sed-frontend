import {
  getWidgets,
  getNews,
  getBulletins,
  getReports,
  WidgetItem,
} from "@/lib/api";
import { WidgetCard } from "@/components/WidgetCard";
import { Metadata } from "next";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Widgets | Santiago en Datos",
  description: "Visualizaciones de datos destacados.",
};

// Helper to fetch entries based on collection type
async function fetchEntriesForCollection(
  collection: string,
  limit: number,
  period?: string,
): Promise<Array<{ relationTo: string; value: any }>> {
  // Calculate date filter for period
  let where: Record<string, unknown> = {};
  if (period === "week") {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    where = { createdAt: { greater_than: weekAgo.toISOString() } };
  } else if (period === "month") {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    where = { createdAt: { greater_than: monthAgo.toISOString() } };
  }

  try {
    switch (collection) {
      case "noticias": {
        const result = await getNews({ limit, sort: "-createdAt" });
        return result.docs.map((item) => ({
          relationTo: "noticias",
          value: { id: item.id, titulo: item.titulo, slug: item.slug },
        }));
      }
      case "boletines": {
        const result = await getBulletins({
          limit,
          sort: "-fecha_publicacion",
        });
        return result.docs.map((item) => ({
          relationTo: "boletines",
          value: {
            id: item.id,
            titulo: `Boletín Nº ${item.numero}`,
            slug: item.slug,
          },
        }));
      }
      case "informes": {
        const result = await getReports({
          limit,
          where: { parent: { exists: false } },
        });
        return result.docs.map((item) => ({
          relationTo: "informes",
          value: { id: item.id, titulo: item.titulo, slug: item.slug },
        }));
      }
      default:
        return [];
    }
  } catch (error) {
    console.error(
      `[fetchEntriesForCollection] Error fetching ${collection}:`,
      error,
    );
    return [];
  }
}

// Resolve widget entries - if specific_entries is empty AND no charts, fetch from collection
async function resolveWidgetEntries(widget: WidgetItem): Promise<WidgetItem> {
  const config = widget.config;
  if (!config) return widget;

  // If widget has chart visualizations, don't fetch entries - it's a chart widget
  const hasCharts = widget.tablas_graficos && widget.tablas_graficos.length > 0;
  if (hasCharts) return widget;

  const specificEntries = config.specific_entries || [];
  const hasManualEntries = specificEntries.length > 0;

  // If manual entries exist, use them as-is
  if (hasManualEntries) return widget;

  // If no manual entries but collection is set, fetch latest
  if (config.collection && config.limit) {
    const fetchedEntries = await fetchEntriesForCollection(
      config.collection,
      config.limit,
      config.period,
    );

    return {
      ...widget,
      config: {
        ...config,
        specific_entries: fetchedEntries,
      },
    };
  }

  return widget;
}

export default async function WidgetsPage() {
  const { docs: rawWidgets } = await getWidgets();

  // Resolve entries for each widget
  const widgets = await Promise.all(rawWidgets.map(resolveWidgetEntries));

  return (
    <div className="max-w-7xl mx-auto py-8">
      <header className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-4">Widgets</h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Visualizaciones rápidas de indicadores clave y comparativas.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {widgets.map((widget) => (
          <div key={widget.id} className="min-h-[400px]">
            <WidgetCard widget={widget} />
          </div>
        ))}
      </div>

      {widgets.length === 0 && (
        <div className="text-center py-20">
          <p className="text-muted-foreground">
            No hay widgets disponibles en este momento.
          </p>
        </div>
      )}
    </div>
  );
}

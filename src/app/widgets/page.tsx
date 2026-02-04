import {
  getWidgets,
  fetchEntriesForCollection,
  resolveWidgetEntries,
} from "@/lib/api";
import { WidgetCard } from "@/components/WidgetCard";
import { PageHeader } from "@/components/PageHeader";
import { Layout } from "lucide-react";
import { Metadata } from "next";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Widgets | Santiago en Datos",
  description: "Visualizaciones de datos destacados.",
};

export default async function WidgetsPage() {
  const { docs: rawWidgets } = await getWidgets();

  // Resolve entries for each widget
  const widgets = await Promise.all(rawWidgets.map(resolveWidgetEntries));

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 space-y-8">
      <PageHeader
        title="Widgets"
        description="Visualizaciones rápidas de indicadores clave y comparativas."
        icon={Layout}
      />

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

import { getWidgets } from "@/lib/api";
import { WidgetCard } from "@/components/WidgetCard";
import { Metadata } from "next";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Widgets | Santiago en Datos",
  description: "Visualizaciones de datos destacados.",
};

export default async function WidgetsPage() {
  const { docs: widgets } = await getWidgets();

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

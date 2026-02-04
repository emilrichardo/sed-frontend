import React from "react";
import Link from "next/link";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { WidgetItem } from "@/lib/api";
import { ChartRenderer } from "./ChartRenderer";
import { TableBlock } from "./TableBlock";
import { ArrowRight } from "lucide-react";

interface WidgetCardProps {
  widget: WidgetItem;
}

// Helper to get URL based on collection type
const getEntryUrl = (relationTo: string, slug: string): string => {
  switch (relationTo) {
    case "noticias":
      return `/noticias/${slug}`;
    case "boletines":
      return `/boletines/${slug}`;
    case "informes":
      return `/informes/${slug}`;
    default:
      return `/${relationTo}/${slug}`;
  }
};

// Helper to get image URL
const getImageUrl = (image: any): string | null => {
  if (!image) return null;
  if (typeof image === "string") return image;
  if (image.url) return image.url;
  return null;
};

export const WidgetCard: React.FC<WidgetCardProps> = ({ widget }) => {
  // Check if this widget has specific entries to display
  const specificEntries = widget.config?.specific_entries;
  const hasSpecificEntries = specificEntries && specificEntries.length > 0;

  // Check if this widget has chart/table visualizations
  const hasVisualizations =
    widget.tablas_graficos && widget.tablas_graficos.length > 0;

  // Get image URL
  const imageUrl = getImageUrl(widget.image);
  const isLocalhost = imageUrl?.includes("localhost");

  return (
    <div className="bg-card text-card-foreground rounded-lg border shadow-sm flex flex-col h-full">
      {/* Widget Image */}
      {imageUrl && (
        <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
          <Image
            src={imageUrl}
            alt={widget.title}
            fill
            className="object-cover"
            unoptimized={isLocalhost}
          />
        </div>
      )}

      <div className="p-6 pb-4">
        <h3 className="text-2xl font-semibold leading-none tracking-tight mb-2">
          {widget.title}
        </h3>
        {widget.description && (
          <div className="text-sm text-muted-foreground prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{widget.description}</ReactMarkdown>
          </div>
        )}
      </div>

      <div className="p-6 pt-0 flex-grow flex flex-col gap-6">
        {/* Render chart/table visualizations (priority) */}
        {hasVisualizations &&
          widget.tablas_graficos!.map((item) => {
            const type = item.tipo_visualizacion;

            if (
              item.configuracion_visualizacion &&
              item.tabla_relacionada?.data
            ) {
              return (
                <div key={item.id} className="w-full min-h-[300px]">
                  <ChartRenderer
                    type={type}
                    data={item.tabla_relacionada.data.rows}
                    columns={item.tabla_relacionada.data.columns}
                    config={item.configuracion_visualizacion}
                  />
                </div>
              );
            } else if (item.tabla_relacionada?.data) {
              return <TableBlock key={item.id} fields={item as any} />;
            }
            return null;
          })}

        {/* Render specific entries as a list of links (only if no visualizations) */}
        {!hasVisualizations && hasSpecificEntries && (
          <ul className="space-y-2">
            {specificEntries.map((entry: any, index: number) => {
              const relationTo = entry.relationTo;
              const value = entry.value;
              if (!value || !value.titulo || !value.slug) return null;

              return (
                <li key={value.id || index}>
                  <Link
                    href={getEntryUrl(relationTo, value.slug)}
                    className="flex items-center gap-2 p-3 rounded-md border bg-muted/30 hover:bg-muted/60 transition-colors group"
                  >
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                    <span className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2">
                      {value.titulo}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {/* Show empty state only if no visualizations AND no specific entries */}
        {!hasVisualizations && !hasSpecificEntries && (
          <div className="flex items-center justify-center p-8 bg-muted/20 rounded-md border border-dashed flex-grow">
            <span className="text-muted-foreground italic">
              Sin visualización configurada
            </span>
          </div>
        )}
      </div>
      <div className="p-6 pt-0 mt-auto text-xs text-muted-foreground text-right">
        Actualizado: {new Date(widget.updatedAt).toLocaleDateString()}
      </div>
    </div>
  );
};

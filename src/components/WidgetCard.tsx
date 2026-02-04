import React from "react";
import ReactMarkdown from "react-markdown";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { WidgetItem } from "@/lib/api";
import { ChartRenderer } from "./ChartRenderer";
import { TableBlock } from "./TableBlock";

interface WidgetCardProps {
  widget: WidgetItem;
}

export const WidgetCard: React.FC<WidgetCardProps> = ({ widget }) => {
  return (
    <div className="bg-card text-card-foreground rounded-lg border shadow-sm flex flex-col h-full">
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
        {widget.tablas_graficos &&
          widget.tablas_graficos.map((item) => {
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
              // Fallback to table if no config?
              return (
                <TableBlock
                  key={item.id}
                  data={item.tabla_relacionada.data}
                  title={item.tabla_relacionada.titulo}
                />
              );
            }
            return null;
          })}

        {(!widget.tablas_graficos || widget.tablas_graficos.length === 0) && (
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

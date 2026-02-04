"use client";

import React, { useState } from "react";
import { Table, Code, Eye } from "lucide-react";
import { ChartRenderer } from "./ChartRenderer";

export const TableBlock = ({
  fields,
}: {
  fields: {
    id?: string;
    title?: string;
    blockType: string;
    source_type?: string;
    tipo_visualizacion?: string;
    configuracion_visualizacion?: any;
    tabla_relacionada?: {
      titulo?: string;
      data?: any;
      fuente?: string;
      actualizacion?: string;
      [key: string]: any;
    };
    data?: {
      rows: any[];
      columns: any[];
    };
    [key: string]: any;
  };
}) => {
  const [activeTab, setActiveTab] = useState<"visualizacion" | "json">(
    "visualizacion",
  );

  let { title, columns, rows, source_type, tabla_relacionada } = fields;

  // Handle source logic
  if (source_type === "collection" && tabla_relacionada?.data) {
    const relatedData = tabla_relacionada.data;
    columns = relatedData.columns || [];
    rows = relatedData.rows || [];

    if (tabla_relacionada.titulo) {
      title = tabla_relacionada.titulo;
    }
  } else if (fields.data) {
    // Handle manual tables
    columns = fields.data.columns || columns || [];
    rows = fields.data.rows || rows || [];
  }

  // Fallback defaults
  columns = columns || [];
  rows = rows || [];

  // Construct JSON for display
  // We want to show what was requested: "un pestaña en json con el formato que trae de datos"
  // effectively essentially dumping the relevant fields of this block.
  const jsonDisplay = {
    id: fields.id,
    titulo: title,
    source_type,
    tipo_visualizacion: fields.tipo_visualizacion,
    configuracion_visualizacion: fields.configuracion_visualizacion,
    data: {
      columns,
      rows,
    },
    ...(source_type === "collection" && tabla_relacionada
      ? {
          tabla_relacionada: {
            id: tabla_relacionada.id,
            titulo: tabla_relacionada.titulo,
            slug: tabla_relacionada.slug,
            fuente: tabla_relacionada.fuente,
            actualizacion: tabla_relacionada.actualizacion,
          },
        }
      : {}),
  };

  return (
    <div className="my-8 border rounded-lg shadow-sm bg-background">
      {/* Header / Tabs */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b">
        <div className="flex items-center gap-2">
          {activeTab === "visualizacion" ? (
            <h4 className="font-bold text-sm uppercase tracking-wider">
              {title || "Tabla"}
            </h4>
          ) : (
            <span className="font-mono text-xs text-muted-foreground">
              JSON Data
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-md">
          <button
            onClick={() => setActiveTab("visualizacion")}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-sm transition-all ${
              activeTab === "visualizacion"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            Visualización
          </button>
          <button
            onClick={() => setActiveTab("json")}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-sm transition-all ${
              activeTab === "json"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          >
            <Code className="h-3.5 w-3.5" />
            JSON
          </button>
        </div>
      </div>

      {activeTab === "json" ? (
        <div className="p-0">
          <pre className="p-4 text-xs font-mono bg-slate-950 text-slate-50 overflow-auto max-h-[500px] rounded-b-lg">
            {JSON.stringify(jsonDisplay, null, 2)}
          </pre>
        </div>
      ) : (
        <>
          {/* Visualization Content */}
          <div className="overflow-x-auto">
            {fields.tipo_visualizacion &&
              fields.tipo_visualizacion !== "table" &&
              fields.tipo_visualizacion !== "list_view" && (
                <div className="p-4 bg-card mb-6 border-b">
                  <ChartRenderer
                    type={fields.tipo_visualizacion}
                    config={fields.configuracion_visualizacion}
                    data={rows}
                    columns={columns}
                  />
                </div>
              )}

            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  {columns?.map((col: any, i: number) => (
                    <th
                      key={col.id || i}
                      className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap"
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows?.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-muted/50 transition-colors">
                    {columns?.map((col: any, j: number) => {
                      // Support both legacy "cells" array and new object format
                      let cellValue;
                      if (row.cells && Array.isArray(row.cells)) {
                        cellValue = row.cells.find(
                          (c: any) => c.columnId === col.id,
                        )?.value;
                      } else {
                        cellValue = row[col.id];
                      }

                      return (
                        <td key={col.id || j} className="px-4 py-3">
                          {cellValue}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Footer Metadata */}
          {(fields.tipo_visualizacion ||
            tabla_relacionada?.fuente ||
            tabla_relacionada?.actualizacion) && (
            <div className="bg-muted/10 px-4 py-3 border-t text-xs text-muted-foreground flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-center">
              <div className="flex flex-col gap-1">
                {fields.tipo_visualizacion && (
                  <div>
                    <span className="font-semibold block sm:inline mr-1">
                      Visualización:
                    </span>
                    <span className="capitalize">
                      {fields.tipo_visualizacion.replace("_", " ")}
                    </span>
                  </div>
                )}
                {tabla_relacionada?.fuente && (
                  <div>
                    <span className="font-semibold block sm:inline mr-1">
                      Fuente:
                    </span>
                    {tabla_relacionada.fuente}
                  </div>
                )}
              </div>
              {tabla_relacionada?.actualizacion && (
                <div className="text-right">
                  <span className="font-semibold block sm:inline mr-1">
                    Actualizado:
                  </span>
                  {new Date(
                    tabla_relacionada.actualizacion,
                  ).toLocaleDateString()}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

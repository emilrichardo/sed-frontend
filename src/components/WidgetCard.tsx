"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { WidgetItem } from "@/lib/api";
import { ChartRenderer } from "./ChartRenderer";
import { ArrowRight, BarChart3, Table, ExternalLink } from "lucide-react";

interface WidgetCardProps {
  widget: WidgetItem;
}

// Helper to get URL based on collection type
const getEntryUrl = (relationTo: string, slug: string): string => {
  switch (relationTo) {
    case "boletines":
      return `/boletines/${slug}`;
    case "publicaciones":
      return `/publicaciones/${slug}`;
    default:
      return `/${relationTo}/${slug}`;
  }
};

// Helper to get image URL
const getImageUrl = (image: unknown): string | null => {
  if (!image) return null;
  if (typeof image === "string") return image;
  if (typeof image === "object" && image !== null && "url" in image) {
    return (image as { url: string }).url;
  }
  return null;
};

// Helper to get CTA URL
const getCtaUrl = (cta: NonNullable<WidgetItem["cta"]>): string => {
  if (cta.link_type === "external" && cta.external_url) {
    return cta.external_url;
  }
  if (cta.link_type === "internal" && cta.internal_link) {
    const { relationTo, value } = cta.internal_link;
    return getEntryUrl(relationTo, value.slug);
  }
  return "#";
};

export const WidgetCard: React.FC<WidgetCardProps> = ({ widget }) => {
  const [activeTab, setActiveTab] = useState<"chart" | "table">("chart");

  // Check if this widget has specific entries to display
  const specificEntries = widget.config?.specific_entries as
    | Array<{
        relationTo: string;
        value: { id?: number; titulo?: string; slug?: string };
      }>
    | undefined;
  const hasSpecificEntries = specificEntries && specificEntries.length > 0;

  // Check if this widget has chart/table visualizations
  const hasVisualizations =
    widget.tablas_graficos && widget.tablas_graficos.length > 0;

  // Check if there are actual charts (not just tables)
  const hasActualCharts =
    hasVisualizations &&
    widget.tablas_graficos!.some(
      (item) =>
        item.tipo_visualizacion &&
        item.tipo_visualizacion !== "table" &&
        item.tipo_visualizacion !== "list_view" &&
        (item.configuracion_visualizacion || 
         item.tipo_visualizacion.startsWith("map_") ||
         item.tipo_visualizacion === "kpi_card" ||
         item.tipo_visualizacion === "gauge_chart" ||
         item.tipo_visualizacion === "status_light"),
    );

  // Get image URL
  const imageUrl = getImageUrl(widget.image);
  const isLocalhost = imageUrl?.includes("localhost");

  // Get all table data for the table view
  const tableData = hasVisualizations
    ? widget.tablas_graficos!.map((item) => ({
        id: item.id,
        title: item.tabla_relacionada?.titulo || "Datos",
        columns: item.tabla_relacionada?.data?.columns || [],
        rows: item.tabla_relacionada?.data?.rows || [],
      }))
    : [];

  // CTA data
  const cta = widget.cta;
  const hasCta = cta && cta.label;

  return (
    <div className="bg-card text-card-foreground rounded-lg border shadow-sm flex flex-col">
      {/* 1. Title */}
      <div className="p-6 pb-4">
        <h3 className="text-2xl font-semibold leading-none tracking-tight">
          {widget.title}
        </h3>
      </div>

      {/* 2. Image */}
      {imageUrl && (
        <div className="relative w-full h-48 overflow-hidden">
          <Image
            src={imageUrl}
            alt={widget.title}
            fill
            className="object-cover"
            unoptimized={isLocalhost}
          />
        </div>
      )}

      {/* 3. Chart/Table with Tab Switcher */}
      {hasActualCharts && (
        <div className="px-6 pt-4 pb-2">
          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-md w-fit">
            <button
              onClick={() => setActiveTab("chart")}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-sm transition-all ${
                activeTab === "chart"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Gráfico
            </button>
            <button
              onClick={() => setActiveTab("table")}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-sm transition-all ${
                activeTab === "table"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              <Table className="h-3.5 w-3.5" />
              Tabla
            </button>
          </div>
        </div>
      )}

      <div className="p-6 pt-2 flex-grow flex flex-col gap-6">
        {/* Chart View - only shown when there are actual charts and chart tab is active */}
        {hasActualCharts && activeTab === "chart" && (
          <>
            {widget.tablas_graficos!.map((item) => {
              const type = item.tipo_visualizacion;

              const hasConfig = item.configuracion_visualizacion || 
                type?.startsWith("map_") ||
                type === "kpi_card" ||
                type === "gauge_chart" ||
                type === "status_light";

              if (hasConfig && item.tabla_relacionada?.data) {
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
              }
              return null;
            })}
          </>
        )}

        {/* Table View - shown when chart widget has table tab active */}
        {hasActualCharts && activeTab === "table" && (
          <div className="overflow-x-auto">
            {tableData.map((table) => (
              <div key={table.id} className="mb-4">
                {table.title && (
                  <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                    {table.title}
                  </h4>
                )}
                <table className="w-full text-sm border rounded-md overflow-hidden">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      {table.columns?.map(
                        (col: { id: string; header: string }, i: number) => (
                          <th
                            key={col.id || i}
                            className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap"
                          >
                            {col.header}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {table.rows?.map(
                      (row: Record<string, unknown>, i: number) => (
                        <tr
                          key={i}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          {table.columns?.map(
                            (
                              col: { id: string; header: string },
                              j: number,
                            ) => (
                              <td key={col.id || j} className="px-4 py-3">
                                {String(row[col.id] ?? "")}
                              </td>
                            ),
                          )}
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}

        {/* Table-only widgets - show table directly without tabs */}
        {hasVisualizations && !hasActualCharts && (
          <div className="overflow-x-auto">
            {tableData.map((table) => (
              <div key={table.id} className="mb-4">
                {table.title && (
                  <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                    {table.title}
                  </h4>
                )}
                <table className="w-full text-sm border rounded-md overflow-hidden">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      {table.columns?.map(
                        (col: { id: string; header: string }, i: number) => (
                          <th
                            key={col.id || i}
                            className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap"
                          >
                            {col.header}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {table.rows?.map(
                      (row: Record<string, unknown>, i: number) => (
                        <tr
                          key={i}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          {table.columns?.map(
                            (
                              col: { id: string; header: string },
                              j: number,
                            ) => (
                              <td key={col.id || j} className="px-4 py-3">
                                {String(row[col.id] ?? "")}
                              </td>
                            ),
                          )}
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}

        {/* Render specific entries as a list of links (only if no visualizations) */}
        {!hasVisualizations && hasSpecificEntries && (
          <ul className="space-y-2">
            {specificEntries.map((entry, index) => {
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

        {/* 4. Description */}
        {widget.description && (
          <div className="text-sm text-muted-foreground prose prose-sm dark:prose-invert max-w-none border-t pt-4">
            <ReactMarkdown>{widget.description}</ReactMarkdown>
          </div>
        )}
      </div>

      {/* 5. CTA Button */}
      {hasCta && (
        <div className="p-6 pt-0">
          {cta.link_type === "external" ? (
            <a
              href={getCtaUrl(cta)}
              target={cta.open_new_tab ? "_blank" : "_self"}
              rel={cta.open_new_tab ? "noopener noreferrer" : undefined}
              className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors"
            >
              {cta.label}
              {cta.open_new_tab && <ExternalLink className="h-4 w-4" />}
            </a>
          ) : (
            <Link
              href={getCtaUrl(cta)}
              className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors"
            >
              {cta.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}

      {/* Footer with update date */}
      <div className="p-6 pt-0 mt-auto text-xs text-muted-foreground text-right">
        Actualizado: {new Date(widget.updatedAt).toLocaleDateString()}
      </div>
    </div>
  );
};

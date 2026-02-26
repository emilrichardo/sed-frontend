"use client";

import React, { useState, useMemo } from "react";
import {
  Table as TableIcon,
  Code,
  Eye,
  BarChartHorizontal,
  ChartBar,
  ChartBarStacked,
  ChartLine,
  ChartArea,
  ChartPie,
  ChartNetwork,
  ChartBarDecreasing,
  Disc2,
  Grid2x2,
  Hexagon,
  ArrowLeftRight,
  Hash,
  Gauge,
  Map,
} from "lucide-react";
import { ChartRenderer } from "./ChartRenderer";

// --- Column type detection ---

function isNumericColumn(
  colId: string,
  rows: { [key: string]: any; cells?: { columnId: string; value: any }[] }[],
): boolean {
  const values = rows
    .map((row) =>
      row.cells && Array.isArray(row.cells)
        ? row.cells.find((c) => c.columnId === colId)?.value
        : row[colId],
    )
    .filter((v) => v !== undefined && v !== null && v !== "");

  if (values.length === 0) return false;

  const numericCount = values.filter((v) => {
    const clean = v
      ?.toString()
      .trim()
      .replace(/[^0-9.,-]/g, "")
      .replace(/\./g, "")
      .replace(",", ".");
    return clean.length > 0 && !isNaN(parseFloat(clean));
  }).length;

  return numericCount >= Math.ceil(values.length * 0.6);
}

// --- Chart catalog ---

type ChartTypeDef = {
  id: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  minNumeric: number;
  maxNumeric?: number;
  minRows: number;
  maxRows?: number;
  minStringCols?: number;
};

const CHART_CATALOG: ChartTypeDef[] = [
  { id: "table", label: "Tabla", Icon: TableIcon, minNumeric: 0, minRows: 1 },
  {
    id: "bar_chart",
    label: "Barras horizontales",
    Icon: BarChartHorizontal,
    minNumeric: 1,
    minRows: 1,
  },
  {
    id: "column_chart",
    label: "Columnas",
    Icon: ChartBar,
    minNumeric: 1,
    minRows: 1,
  },
  {
    id: "stacked_bar_chart",
    label: "Barras apiladas",
    Icon: ChartBarStacked,
    minNumeric: 2,
    minRows: 1,
  },
  {
    id: "line_chart",
    label: "Líneas",
    Icon: ChartLine,
    minNumeric: 1,
    minRows: 2,
  },
  {
    id: "area_chart",
    label: "Área",
    Icon: ChartArea,
    minNumeric: 1,
    minRows: 2,
  },
  {
    id: "pie_chart",
    label: "Torta",
    Icon: ChartPie,
    minNumeric: 1,
    maxNumeric: 1,
    minRows: 2,
  },
  {
    id: "donut_chart",
    label: "Dona",
    Icon: Disc2,
    minNumeric: 1,
    maxNumeric: 1,
    minRows: 2,
  },
  {
    id: "treemap_chart",
    label: "Treemap",
    Icon: Grid2x2,
    minNumeric: 1,
    maxNumeric: 1,
    minRows: 2,
  },
  {
    id: "radar_chart",
    label: "Radar",
    Icon: Hexagon,
    minNumeric: 1,
    minRows: 3,
  },
  {
    id: "tornado_chart",
    label: "Tornado",
    Icon: ArrowLeftRight,
    minNumeric: 2,
    maxNumeric: 2,
    minRows: 1,
  },
  {
    id: "waterfall_chart",
    label: "Cascada",
    Icon: ChartBarDecreasing,
    minNumeric: 1,
    maxNumeric: 1,
    minRows: 2,
  },
  {
    id: "sankey_chart",
    label: "Sankey",
    Icon: ChartNetwork,
    minNumeric: 1,
    maxNumeric: 1,
    minRows: 2,
    minStringCols: 2,
  },
  {
    id: "kpi_card",
    label: "KPI",
    Icon: Hash,
    minNumeric: 1,
    maxNumeric: 1,
    minRows: 1,
    maxRows: 5,
  },
  {
    id: "gauge_chart",
    label: "Gauge",
    Icon: Gauge,
    minNumeric: 1,
    maxNumeric: 1,
    minRows: 1,
    maxRows: 1,
  },
  {
    id: "choropleth_map",
    label: "Mapa",
    Icon: Map,
    minNumeric: 1,
    maxNumeric: 1,
    minRows: 1,
  },
];

function getCompatibleChartTypes(
  columns: { id: string; header?: string }[],
  rows: any[],
): string[] {
  const numericCount = columns.filter((c) =>
    isNumericColumn(c.id, rows),
  ).length;
  const stringCount = columns.length - numericCount;
  const rowCount = rows.length;

  const chartTypes = CHART_CATALOG.filter(
    ({ minNumeric, maxNumeric, minRows, maxRows, minStringCols }) => {
      if (numericCount < minNumeric) return false;
      if (maxNumeric !== undefined && numericCount > maxNumeric) return false;
      if (rowCount < minRows) return false;
      if (maxRows !== undefined && rowCount > maxRows) return false;
      if (minStringCols !== undefined && stringCount < minStringCols)
        return false;
      return true;
    },
  ).map((ct) => ct.id);

  // Auto-detect geographic data for choropleth map
  const firstCol = columns[0];
  if (firstCol && rows.length > 0) {
    const headerNorm = (firstCol.header || "")
      .toLowerCase()
      .replace(
        /[áéíóú]/g,
        (c: string) =>
          (
            ({ á: "a", é: "e", í: "i", ó: "o", ú: "u" }) as Record<
              string,
              string
            >
          )[c] || c,
      );

    const hasDeptHeader = headerNorm.includes("departamento");
    const hasGeoHeader =
      hasDeptHeader ||
      headerNorm.includes("jurisdiccion") ||
      headerNorm.includes("jurisdicción") ||
      headerNorm.includes("provincia");

    if (hasGeoHeader) {
      chartTypes.push("choropleth_map");
    } else {
      // Fallback: value-based detection
      const firstColValues = rows
        .map((row) => {
          if (row.cells && Array.isArray(row.cells)) {
            return row.cells.find((c: any) => c.columnId === firstCol.id)
              ?.value;
          }
          return row[firstCol.id];
        })
        .filter(Boolean)
        .map((v: any) => String(v).toLowerCase());

      const SDE_DEPT_KEYWORDS = [
        "figueroa",
        "salavina",
        "atamisqui",
        "silipica",
        "jimenez",
        "loreto",
        "guasayan",
        "quebrachos",
        "aguirre",
        "choya",
        "alberdi",
        "avellaneda",
        "pellegrini",
        "mitre",
        "copo",
      ];
      const AR_PROVINCE_KEYWORDS = [
        "cordoba",
        "mendoza",
        "tucuman",
        "chaco",
        "corrientes",
        "misiones",
        "entre rios",
        "jujuy",
        "neuquen",
        "rio negro",
        "chubut",
        "formosa",
        "la pampa",
        "la rioja",
        "catamarca",
        "san juan",
        "san luis",
        "santa cruz",
        "tierra del fuego",
      ];

      const hasDeptValues = firstColValues.some((v: string) =>
        SDE_DEPT_KEYWORDS.some((k) => v.includes(k)),
      );
      const hasProvinceValues = firstColValues.some((v: string) =>
        AR_PROVINCE_KEYWORDS.some((k) => v.includes(k)),
      );

      if (hasDeptValues || hasProvinceValues) {
        chartTypes.push("choropleth_map");
      }
    }
  }

  return chartTypes;
}

// --- Main component ---

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

  const {
    title: fieldTitle,
    columns: fieldCols,
    rows: fieldRows,
    source_type,
    tabla_relacionada,
    fuente: fieldFuente,
    notas: fieldNotas,
  } = fields;
  let title = fieldTitle;
  const fuente = fieldFuente;
  const notas = fieldNotas;
  let columns = fieldCols;
  let rows = fieldRows;

  if (source_type === "collection" && tabla_relacionada?.data) {
    const relatedData = tabla_relacionada.data;
    columns = relatedData.columns || [];
    rows = relatedData.rows || [];
    if (tabla_relacionada.titulo) {
      title = tabla_relacionada.titulo;
    }
  } else if (fields.data) {
    columns = fields.data.columns || columns || [];
    rows = fields.data.rows || rows || [];
  }

  columns = columns || [];
  rows = rows || [];

  // Detect numeric columns for metric selection
  const numericColumns = useMemo(() => {
    return columns.filter((col: { id: string }) =>
      isNumericColumn(col.id, rows),
    );
  }, [columns, rows]);

  // Chart type switcher
  const allChartTypeIds = useMemo(() => CHART_CATALOG.map((ct) => ct.id), []);

  const compatibleTypes = useMemo(
    () => getCompatibleChartTypes(columns, rows),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(columns), JSON.stringify(rows)],
  );

  // Allow any chart type from catalog, prioritize tipo_visualizacion from CMS or compatible types
  const availableTypes = [...new Set([...compatibleTypes, ...allChartTypeIds])];

  // Map legacy map chart types to the unified choropleth_map
  const CHART_TYPE_ALIASES: Record<string, string> = {
    map_argentina: "choropleth_map",
    map_santiago: "choropleth_map",
    map_santiago_del_estero: "choropleth_map",
  };
  const resolvedVisualizationType = fields.tipo_visualizacion
    ? (CHART_TYPE_ALIASES[fields.tipo_visualizacion] ??
      fields.tipo_visualizacion)
    : undefined;

  const defaultChartType =
    resolvedVisualizationType &&
    allChartTypeIds.includes(resolvedVisualizationType)
      ? resolvedVisualizationType
      : availableTypes.includes("column_chart")
        ? "column_chart"
        : (availableTypes[0] ?? "bar_chart");

  const [selectedChartType, setSelectedChartType] = useState(defaultChartType);

  // State for selected metric (numeric column)
  const [selectedMetric, setSelectedMetric] = useState<string | null>(
    numericColumns.length > 1 ? "general" : null,
  );

  // Set default metric when numeric columns change
  useMemo(() => {
    if (numericColumns.length > 1 && !selectedMetric) {
      setSelectedMetric("general");
    } else if (numericColumns.length === 1 && !selectedMetric) {
      setSelectedMetric(numericColumns[0].id);
    }
  }, [numericColumns, selectedMetric]);

  // Build config with selected metric
  const chartConfig = useMemo(() => {
    if (selectedMetric === "general" && numericColumns.length > 1) {
      return {
        ...fields.configuracion_visualizacion,
        eje_valores: numericColumns.map((col: any) => col.id).join(","),
      };
    }

    if (!selectedMetric) {
      return fields.configuracion_visualizacion;
    }

    return {
      ...fields.configuracion_visualizacion,
      eje_valores: selectedMetric,
    };
  }, [selectedMetric, numericColumns, fields.configuracion_visualizacion]);

  // JSON display payload
  const jsonDisplay = {
    id: fields.id,
    titulo: title,
    fuente: fuente,
    notas: notas,
    source_type,
    tipo_visualizacion: fields.tipo_visualizacion,
    configuracion_visualizacion: fields.configuracion_visualizacion,
    data: { columns, rows },
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

  const showChart =
    activeTab === "visualizacion" && selectedChartType !== "table";

  return (
    <div className="my-8 border rounded-lg shadow-sm bg-background">
      {/* Header */}
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

      {/* Chart type switcher — show all chart types when in visualization mode */}
      {activeTab === "visualizacion" && (
        <div className="flex items-center gap-0.5 px-3 py-1.5 bg-muted/10 border-b flex-wrap">
          {CHART_CATALOG.map(({ id, label, Icon }) => (
            <button
              key={id}
              title={label}
              onClick={() => setSelectedChartType(id)}
              className={`p-1.5 rounded transition-all ${
                selectedChartType === id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      )}

      {/* Metric selector tabs - when multiple numeric columns exist */}
      {activeTab === "visualizacion" &&
        showChart &&
        numericColumns.length > 1 && (
          <div className="flex items-center gap-0.5 px-3 py-2 bg-muted/10 border-b overflow-x-auto">
            <span className="text-xs text-muted-foreground mr-2 whitespace-nowrap">
              Mostrar:
            </span>
            <button
              onClick={() => setSelectedMetric("general")}
              className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-all ${
                selectedMetric === "general"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              General (Comparar)
            </button>
            {numericColumns.map((col: any) => (
              <button
                key={col.id}
                onClick={() => setSelectedMetric(col.id)}
                className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-all ${
                  selectedMetric === col.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {col.header}
              </button>
            ))}
          </div>
        )}

      {activeTab === "json" ? (
        <div className="p-0">
          <pre className="p-4 text-xs font-mono bg-slate-950 text-slate-50 overflow-auto max-h-[500px] rounded-b-lg">
            {JSON.stringify(jsonDisplay, null, 2)}
          </pre>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            {showChart && (
              <div className="p-4 bg-card mb-6 border-b">
                <ChartRenderer
                  type={selectedChartType}
                  config={chartConfig}
                  data={rows}
                  columns={columns}
                />
              </div>
            )}

            {selectedChartType === "table" && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    {columns?.map(
                      (col: { id: string; header?: string }, i: number) => (
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
                  {rows?.map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-muted/50 transition-colors">
                      {columns?.map((col: { id: string }, j: number) => {
                        let cellValue;
                        if (row.cells && Array.isArray(row.cells)) {
                          cellValue = row.cells.find(
                            (c: { columnId: string; value: any }) =>
                              c.columnId === col.id,
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
            )}
          </div>

          {/* Footer Metadata */}
          {(fields.tipo_visualizacion ||
            fuente ||
            notas ||
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
                      {fields.tipo_visualizacion.replace(/_/g, " ")}
                    </span>
                  </div>
                )}
                {(fuente || tabla_relacionada?.fuente) && (
                  <div>
                    <span className="font-semibold block sm:inline mr-1">
                      Fuente:
                    </span>
                    {fuente || tabla_relacionada?.fuente}
                  </div>
                )}
                {notas && (
                  <div>
                    <span className="font-semibold block sm:inline mr-1">
                      Notas:
                    </span>
                    {notas}
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

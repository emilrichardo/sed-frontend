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
  CircleDot,
  Pointer,
  Waves,
  TableProperties,
  Sun,
  Flame,
  TrendingUp,
  Star,
} from "lucide-react";
import { ChartRenderer } from "./ChartRenderer";
import { getTextFromNodes } from "./RichTextParser";
import { useAuth } from "@/context/AuthContext";
import { Download } from "lucide-react";

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

// Removed duplicates/broken charts vs previous version:
// - treemap_chart (recharts) → replaced by treemap_plotly (plotly, better)
// - polar_chart → redundant with radar_chart
// - candlestick_chart → requires OHLC format not available from CMS
// - sparkline → too minimal, overlaps with line/area charts
// - box_plot → niche statistical use, hidden from toolbar
const CHART_CATALOG: ChartTypeDef[] = [
  { id: "table", label: "Tabla", Icon: TableIcon, minNumeric: 0, minRows: 1 },
  {
    id: "advanced_table",
    label: "Tabla avanzada",
    Icon: TableProperties,
    minNumeric: 0,
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
    id: "bar_chart",
    label: "Barras horizontales",
    Icon: BarChartHorizontal,
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
    id: "composed_chart",
    label: "Combinado (barra+línea)",
    Icon: Waves,
    minNumeric: 2,
    minRows: 1,
  },
  {
    id: "pie_chart",
    label: "Torta",
    Icon: ChartPie,
    minNumeric: 1,
    maxNumeric: 1,
    minRows: 2,
    maxRows: 12,
  },
  {
    id: "donut_chart",
    label: "Dona",
    Icon: Disc2,
    minNumeric: 1,
    maxNumeric: 1,
    minRows: 2,
    maxRows: 12,
  },
  {
    id: "treemap_plotly",
    label: "Treemap",
    Icon: Grid2x2,
    minNumeric: 1,
    maxNumeric: 1,
    minRows: 2,
  },
  {
    id: "sunburst_chart",
    label: "Sunburst",
    Icon: Sun,
    minNumeric: 1,
    maxNumeric: 1,
    minRows: 2,
  },
  {
    id: "funnel_chart",
    label: "Embudo",
    Icon: TrendingUp,
    minNumeric: 1,
    maxNumeric: 1,
    minRows: 2,
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
    id: "radar_chart",
    label: "Radar",
    Icon: Hexagon,
    minNumeric: 1,
    minRows: 3,
  },
  {
    id: "radial_bar_chart",
    label: "Barras radiales",
    Icon: Pointer,
    minNumeric: 1,
    minRows: 2,
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
    id: "scatter_chart",
    label: "Dispersión",
    Icon: CircleDot,
    minNumeric: 2,
    minRows: 3,
  },
  {
    id: "bubble_plotly",
    label: "Burbujas",
    Icon: CircleDot,
    minNumeric: 2,
    minRows: 3,
  },
  {
    id: "heatmap_chart",
    label: "Mapa de calor",
    Icon: Flame,
    minNumeric: 2,
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
  // choropleth_map: no maxNumeric — the metric selector handles multi-column data (one metric shown at a time)
  {
    id: "choropleth_map",
    label: "Mapa coroplético",
    Icon: Map,
    minNumeric: 1,
    minRows: 1,
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
    label: "Medidor",
    Icon: Gauge,
    minNumeric: 1,
    maxNumeric: 1,
    minRows: 1,
    maxRows: 1,
  },
];

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
  "buenos aires",
  "santa fe",
  "salta",
  "santiago del estero",
  "neuquen",
  "caba",
  "capital federal",
  "ciudad de buenos aires",
  "ciudad autonoma",
];

function normStr(s: string): string {
  return s
    .toLowerCase()
    .replace(
      /[áéíóúñ]/g,
      (c) =>
        (
          ({ á: "a", é: "e", í: "i", ó: "o", ú: "u", ñ: "n" }) as Record<
            string,
            string
          >
        )[c] || c,
    );
}

function detectGeoData(
  columns: { id: string; header?: string }[],
  rows: any[],
): boolean {
  if (!columns[0] || rows.length === 0) return false;
  const firstCol = columns[0];
  const headerNorm = normStr(firstCol.header || "");
  if (
    headerNorm.includes("departamento") ||
    headerNorm.includes("provincia") ||
    headerNorm.includes("jurisdiccion")
  )
    return true;

  const firstColValues = rows
    .map((row) => {
      if (row.cells && Array.isArray(row.cells)) {
        return row.cells.find((c: any) => c.columnId === firstCol.id)?.value;
      }
      return row[firstCol.id];
    })
    .filter(Boolean)
    .map((v: any) => normStr(String(v)));

  return (
    firstColValues.some((v) => SDE_DEPT_KEYWORDS.some((k) => v.includes(k))) ||
    firstColValues.some((v) => AR_PROVINCE_KEYWORDS.some((k) => v.includes(k)))
  );
}

function detectTimeSeries(
  columns: { id: string; header?: string }[],
  rows: any[],
): boolean {
  if (!columns[0] || rows.length < 2) return false;
  const firstCol = columns[0];
  const headerNorm = normStr(firstCol.header || "");
  if (
    headerNorm.includes("año") ||
    headerNorm.includes("anio") ||
    headerNorm.includes("fecha") ||
    headerNorm.includes("period")
  )
    return true;
  const values = rows.map((row) => {
    const v = row.cells
      ? row.cells.find((c: any) => c.columnId === firstCol.id)?.value
      : row[firstCol.id];
    return String(v || "").trim();
  });
  // Most values look like years (4-digit number 1900-2100) or dates
  const yearLike = values.filter((v) => /^(19|20)\d{2}$/.test(v)).length;
  return yearLike >= Math.ceil(values.length * 0.6);
}

function getChartCompatibilityInfo(
  columns: { id: string; header?: string }[],
  rows: any[],
): { compatibleIds: Set<string>; recommendedId: string } {
  const numericCount = columns.filter((c) =>
    isNumericColumn(c.id, rows),
  ).length;
  const stringCount = columns.length - numericCount;
  const rowCount = rows.length;
  const isGeo = detectGeoData(columns, rows);
  const isTimeSeries = detectTimeSeries(columns, rows);

  // Base compatibility from catalog rules
  const compatibleIds = new Set<string>(
    CHART_CATALOG.filter(
      ({ minNumeric, maxNumeric, minRows, maxRows, minStringCols }) => {
        if (numericCount < minNumeric) return false;
        if (maxNumeric !== undefined && numericCount > maxNumeric) return false;
        if (rowCount < minRows) return false;
        if (maxRows !== undefined && rowCount > maxRows) return false;
        if (minStringCols !== undefined && stringCount < minStringCols)
          return false;
        return true;
      },
    ).map((ct) => ct.id),
  );

  // choropleth_map: ONLY compatible when geographic data is detected
  if (!isGeo) {
    compatibleIds.delete("choropleth_map");
  }

  // scatter/bubble: require at least 2 numeric cols (already enforced by catalog)
  // heatmap: more useful with 3+ numeric cols
  if (numericCount < 3) {
    compatibleIds.delete("heatmap_chart");
  }

  // sankey: needs at least 2 distinct string cols
  if (stringCount < 2) {
    compatibleIds.delete("sankey_chart");
  }

  // Determine recommended chart
  let recommendedId = "column_chart";

  if (isGeo && compatibleIds.has("choropleth_map")) {
    recommendedId = "choropleth_map";
  } else if (rowCount === 1 && numericCount >= 1) {
    recommendedId = "kpi_card";
  } else if (isTimeSeries && numericCount >= 1 && rowCount >= 3) {
    recommendedId = numericCount >= 2 ? "area_chart" : "line_chart";
  } else if (numericCount === 1 && rowCount >= 2 && rowCount <= 8) {
    recommendedId = "pie_chart";
  } else if (numericCount === 2 && rowCount >= 2) {
    recommendedId = "tornado_chart";
  } else if (numericCount >= 3) {
    recommendedId = "stacked_bar_chart";
  } else if (numericCount === 1 && rowCount > 8) {
    // Many rows: horizontal bar is more readable
    recommendedId = "bar_chart";
  } else if (
    numericCount === 1 &&
    stringCount >= 2 &&
    compatibleIds.has("sankey_chart")
  ) {
    recommendedId = "sankey_chart";
  } else {
    recommendedId = "column_chart";
  }

  // Fallback: if recommended is not compatible, use first compatible
  if (!compatibleIds.has(recommendedId)) {
    recommendedId = [...compatibleIds][0] ?? "table";
  }

  return { compatibleIds, recommendedId };
}

// --- Main component ---

export const TableBlock = ({
  fields,
  isWidget = false,
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
  isWidget?: boolean;
}) => {
  const [activeTab, setActiveTab] = useState<"visualizacion" | "json">(
    "visualizacion",
  );
  const { user, isEditing } = useAuth();
  const isPublicUser = !user || !isEditing;

  const {
    title: fieldTitle,
    columns: fieldCols,
    rows: fieldRows,
    source_type,
    tabla_relacionada,
    fuente: fieldFuente,
    notas: fieldNotas,
    nota: fieldNota,
  } = fields;
  let title = fieldTitle;
  let fuente = fieldFuente || tabla_relacionada?.fuente;
  let notas =
    fieldNotas ||
    fieldNota ||
    tabla_relacionada?.notas ||
    tabla_relacionada?.nota;
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

  // Data cleaning: Extract notes or sources from rows if missing in metadata
  // Look for rows where the first cell starts with "Nota" or "Fuente"
  const rowExtractedNotas: string[] = [];
  const rowExtractedFuente: string[] = [];

  const filteredRows = rows.filter((row: any) => {
    let firstCellVal = "";
    if (row.cells && Array.isArray(row.cells)) {
      firstCellVal = String(row.cells[0]?.value || "");
    } else {
      const firstColId = columns[0]?.id;
      firstCellVal = String(row[firstColId] || "");
    }

    const lowerVal = firstCellVal.trim().toLowerCase();
    if (
      lowerVal.startsWith("nota") ||
      lowerVal.startsWith("metodología") ||
      lowerVal.startsWith("metodologia")
    ) {
      rowExtractedNotas.push(firstCellVal);
      return false;
    }
    if (lowerVal.startsWith("fuente")) {
      rowExtractedFuente.push(firstCellVal);
      return false;
    }
    return true;
  });

  // Helper to check if a value is effectively empty
  const isValueEmpty = (val: any) => {
    if (!val) return true;
    if (typeof val === "string") return val.trim() === "";
    if (typeof val === "object") return getTextFromNodes(val).trim() === "";
    return false;
  };

  if (isValueEmpty(notas) && rowExtractedNotas.length > 0) {
    notas = rowExtractedNotas.join(". ");
  }
  if (isValueEmpty(fuente) && rowExtractedFuente.length > 0) {
    fuente = rowExtractedFuente.join(". ");
  }

  // Determine X-axis column (excluded from metric selection)
  const xAxisColId =
    columns.find(
      (col: any) =>
        col.header === fields.configuracion_visualizacion?.eje_principal ||
        col.id === fields.configuracion_visualizacion?.eje_principal,
    )?.id ?? columns[0]?.id;

  // Detect numeric columns for metric selection (excluding X axis column)
  const numericColumns = useMemo(() => {
    return columns.filter(
      (col: { id: string }) =>
        col.id !== xAxisColId && isNumericColumn(col.id, filteredRows),
    );
  }, [columns, filteredRows, xAxisColId]);

  // Chart compatibility and recommendation
  const { compatibleIds, recommendedId } = useMemo(
    () => getChartCompatibilityInfo(columns, filteredRows),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(columns), JSON.stringify(filteredRows)],
  );

  // Map legacy chart type aliases to unified choropleth_map
  const CHART_TYPE_ALIASES: Record<string, string> = {
    map_argentina: "choropleth_map",
    map_santiago: "choropleth_map",
    map_santiago_del_estero: "choropleth_map",
    treemap_chart: "treemap_plotly",
  };
  const resolvedVisualizationType = fields.tipo_visualizacion
    ? (CHART_TYPE_ALIASES[fields.tipo_visualizacion] ??
      fields.tipo_visualizacion)
    : undefined;

  const allChartTypeIds = useMemo(() => CHART_CATALOG.map((ct) => ct.id), []);

  const defaultChartType =
    resolvedVisualizationType &&
    allChartTypeIds.includes(resolvedVisualizationType)
      ? resolvedVisualizationType
      : compatibleIds.has(recommendedId)
        ? recommendedId
        : ([...compatibleIds][0] ?? "table");

  const [selectedChartType, setSelectedChartType] = useState(defaultChartType);
  const [useHeatmap, setUseHeatmap] = useState(false);
  const [showTableView, setShowTableView] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  // Sorting logic
  const sortedRows = useMemo(() => {
    const sortableRows = [...filteredRows];
    if (sortConfig !== null) {
      sortableRows.sort((a: any, b: any) => {
        const aVal =
          a.cells?.[
            columns.findIndex((c: { id: string }) => c.id === sortConfig.key)
          ]?.value ?? a[sortConfig.key];
        const bVal =
          b.cells?.[
            columns.findIndex((c: { id: string }) => c.id === sortConfig.key)
          ]?.value ?? b[sortConfig.key];

        const aNum = parseFloat(String(aVal).replace(/[^0-9.-]/g, ""));
        const bNum = parseFloat(String(bVal).replace(/[^0-9.-]/g, ""));

        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortConfig.direction === "asc" ? aNum - bNum : bNum - aNum;
        }

        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortableRows;
  }, [filteredRows, sortConfig, columns]);

  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

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
        eje_valores: numericColumns
          .map((col: { id: string }) => col.id)
          .join(","),
        fuentes: fuente,
        notas: notas,
      };
    }

    if (!selectedMetric) {
      return {
        ...fields.configuracion_visualizacion,
        fuentes: fuente,
        notas: notas,
      };
    }

    return {
      ...fields.configuracion_visualizacion,
      eje_valores: selectedMetric,
      fuentes: fuente,
      notas: notas,
    };
  }, [
    selectedMetric,
    numericColumns,
    fields.configuracion_visualizacion,
    fuente,
    notas,
  ]);

  // JSON display payload
  const jsonDisplay = {
    id: fields.id,
    titulo: title,
    fuente: fuente,
    notas: notas,
    source_type,
    tipo_visualizacion: fields.tipo_visualizacion,
    configuracion_visualizacion: fields.configuracion_visualizacion,
    data: { columns, rows: filteredRows },
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

  const isNonTableChart =
    selectedChartType !== "table" && selectedChartType !== "advanced_table";
  const showPublicTable = isPublicUser && isNonTableChart && showTableView;

  const showChart =
    activeTab === "visualizacion" &&
    selectedChartType !== "table" &&
    !showPublicTable;

  const handleDownloadCSV = () => {
    if (!columns || !filteredRows) return;
    const headerRow = columns.map((col: any) => col.header || col.id).join(",");
    const dataRows = filteredRows.map((row: any) => {
      return columns
        .map((col: any) => {
          let val = row.cells
            ? row.cells.find((c: any) => c.columnId === col.id)?.value
            : row[col.id];
          if (val === null || val === undefined) val = "";
          // Escape quotes and wrap in quotes if contains comma
          val = String(val).replace(/"/g, '""');
          if (val.includes(",")) val = `"${val}"`;
          return val;
        })
        .join(",");
    });
    const csvContent = [headerRow, ...dataRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${slugifyText(title || "datos")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  function slugifyText(text: string) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }

  return (
    <div
      className={
        isWidget
          ? "w-full h-full bg-background flex flex-col justify-center"
          : "my-8 border rounded-lg shadow-sm bg-background"
      }
    >
      {/* Header */}
      {!isWidget && (
        <div className="flex flex-row items-center justify-between px-4 py-2 bg-muted/30 border-b gap-2">
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

          <div className="flex flex-wrap items-center gap-2">
            {!isPublicUser && (
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
            )}

            {isPublicUser && isNonTableChart && (
              <button
                onClick={() => setShowTableView((v) => !v)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all border shrink-0 ${
                  showTableView
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
                }`}
                title={showTableView ? "Ver gráfico" : "Ver datos en tabla"}
              >
                <TableIcon className="h-3.5 w-3.5" />
                {showTableView ? "Ver gráfico" : "Ver datos"}
              </button>
            )}

            <button
              onClick={handleDownloadCSV}
              className="flex items-center justify-center p-1.5 w-8 h-8 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md transition-all shadow-sm border border-border shrink-0 ml-auto sm:ml-0"
              title="Descargar tabla en formato CSV"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Chart type switcher */}
      {!isWidget && activeTab === "visualizacion" && !!user && (
        <div className="flex items-center gap-0.5 px-3 py-1.5 bg-muted/10 border-b flex-wrap">
          {CHART_CATALOG.map(({ id, label, Icon }) => {
            const isCompatible = compatibleIds.has(id);
            const isSelected = selectedChartType === id;
            const isRecommended = id === recommendedId;
            return (
              <button
                key={id}
                title={`${label}${isRecommended ? " ★ Recomendado" : ""}${!isCompatible ? " (datos insuficientes)" : ""}`}
                onClick={() => setSelectedChartType(id)}
                disabled={!isCompatible}
                className={`relative p-1.5 rounded transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : isCompatible
                      ? "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                      : "text-muted-foreground/25 cursor-not-allowed"
                }`}
              >
                <Icon className="h-4 w-4" />
                {isRecommended && !isSelected && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full border border-background" />
                )}
                {isRecommended && isSelected && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-300 rounded-full border border-primary-foreground" />
                )}
              </button>
            );
          })}
          {/* Recommendation legend */}
          <div className="ml-auto flex items-center gap-1.5 text-[10px] text-muted-foreground pl-2">
            <span className="w-2 h-2 bg-amber-400 rounded-full inline-block" />
            <span className="hidden sm:inline">Recomendado</span>
          </div>
          {(selectedChartType === "table" ||
            selectedChartType === "advanced_table") && (
            <div className="flex items-center gap-2 px-2 border-l ml-1">
              <button
                onClick={() => setUseHeatmap(!useHeatmap)}
                className={`flex items-center gap-2 px-2 py-1 text-[10px] uppercase font-bold border rounded transition-all ${
                  useHeatmap
                    ? "bg-orange-100 text-orange-700 border-orange-200"
                    : "text-muted-foreground border-transparent hover:bg-muted"
                }`}
              >
                <TableProperties className="h-3 w-3" />
                Heatmap
              </button>
            </div>
          )}
        </div>
      )}

      {/* Metric selector tabs - when multiple numeric columns exist */}
      {!isWidget &&
        activeTab === "visualizacion" &&
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
          <div className="overflow-x-auto w-full h-full flex-1">
            {showChart && (
              <div className={isWidget ? "p-4 h-full" : "px-2 py-3 md:px-4 md:py-4 bg-card border-b"}>
                <ChartRenderer
                  type={selectedChartType}
                  config={chartConfig}
                  data={filteredRows}
                  columns={columns}
                />
                {isWidget && isPublicUser && isNonTableChart && (
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => setShowTableView((v) => !v)}
                      className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                      title="Ver datos en tabla"
                    >
                      <TableIcon className="h-3 w-3" />
                      Ver datos
                    </button>
                  </div>
                )}
              </div>
            )}

            {(selectedChartType === "table" || showPublicTable) && (
              <>
              {isWidget && showPublicTable && (
                <div className="flex justify-end px-3 pt-2">
                  <button
                    onClick={() => setShowTableView(false)}
                    className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                    title="Ver gráfico"
                  >
                    <Eye className="h-3 w-3" />
                    Ver gráfico
                  </button>
                </div>
              )}
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    {columns?.map(
                      (col: { id: string; header?: string }, i: number) => (
                        <th
                          key={col.id || i}
                          onClick={() => requestSort(col.id)}
                          className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap text-xs sm:text-sm cursor-pointer hover:bg-muted/80 transition-colors group"
                        >
                          <div className="flex items-center justify-between">
                            {col.header}
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                              {sortConfig?.key === col.id
                                ? sortConfig.direction === "asc"
                                  ? "↑"
                                  : "↓"
                                : "⇅"}
                            </span>
                          </div>
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sortedRows?.map((row: any, i: number) => (
                    <tr
                      key={i}
                      className="hover:bg-muted/50 transition-colors group"
                    >
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

                        // Heatmap logic
                        let style = {};
                        if (
                          useHeatmap &&
                          isNumericColumn(col.id, filteredRows)
                        ) {
                          const num = parseFloat(
                            String(cellValue).replace(/[^0-9.-]/g, ""),
                          );
                          const colValues = filteredRows
                            .map((r: any) => {
                              const v = r.cells
                                ? r.cells.find(
                                    (c: { columnId: string; value: any }) =>
                                      c.columnId === col.id,
                                  )?.value
                                : r[col.id];
                              return parseFloat(
                                String(v).replace(/[^0-9.-]/g, ""),
                              );
                            })
                            .filter((v: number) => !isNaN(v));
                          const min = Math.min(...colValues);
                          const max = Math.max(...colValues);
                          const ratio =
                            max - min === 0 ? 0.5 : (num - min) / (max - min);
                          style = {
                            backgroundColor: `rgba(201, 91, 74, ${ratio * 0.2})`,
                            color: ratio > 0.8 ? "#000" : "inherit",
                            fontWeight: ratio > 0.8 ? "600" : "inherit",
                          };
                        }

                        return (
                          <td
                            key={col.id || j}
                            className={`px-4 py-2 sm:py-3 border-r last:border-0 border-border/20 text-xs sm:text-sm whitespace-nowrap max-w-[200px] sm:max-w-[400px] truncate`}
                            style={style}
                            title={String(cellValue)}
                          >
                            {cellValue}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              </>
            )}
          </div>

          {/* Fuente y notas — always shown for table/public table views */}
          {(selectedChartType === "table" || showPublicTable) &&
            (notas || fuente) && (
              <div className="px-4 py-3 border-t border-border/50 text-xs space-y-1.5">
                {notas && (
                  <div className="text-muted-foreground italic leading-relaxed">
                    <span className="font-semibold text-foreground/70 not-italic mr-1.5">
                      Notas:
                    </span>
                    {typeof notas === "string"
                      ? notas
                      : getTextFromNodes(notas)}
                  </div>
                )}
                {fuente && (
                  <div className="text-muted-foreground leading-relaxed flex items-start gap-1.5">
                    <span className="font-semibold text-foreground/70 shrink-0">
                      Fuente:
                    </span>
                    <span>
                      {typeof fuente === "string"
                        ? fuente
                        : getTextFromNodes(fuente)}
                    </span>
                  </div>
                )}
              </div>
            )}
        </>
      )}
    </div>
  );
};

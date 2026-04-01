"use client";

import React, { useState, useMemo, useRef } from "react";
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
  Save,
  Check,
  AlertCircle,
  Pencil,
  X,
  Play,
  Bot,
  Copy,
  Maximize2,
} from "lucide-react";
import { ChartRenderer } from "./ChartRenderer";
import { CustomVizBlock } from "./CustomVizBlock";
import { getTextFromNodes } from "./RichTextParser";
import { useAuth } from "@/context/AuthContext";
import { Download } from "lucide-react";
import { updatePublicacionBlockVisualizacion, updatePublicacionBlockCustomMarkup } from "@/lib/api";

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
  publicationId,
}: {
  fields: {
    id?: string;
    title?: string;
    blockType: string;
    source_type?: string;
    tipo_visualizacion?: string;
    custom_markup?: string;
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
  publicationId?: string | number;
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
    resolvedVisualizationType === "custom_viz"
      ? "custom_viz"
      : resolvedVisualizationType &&
          allChartTypeIds.includes(resolvedVisualizationType)
        ? resolvedVisualizationType
        : compatibleIds.has(recommendedId)
          ? recommendedId
          : ([...compatibleIds][0] ?? "table");

  const [selectedChartType, setSelectedChartType] = useState(defaultChartType);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [editingMarkup, setEditingMarkup] = useState(false);
  const [markupDraft, setMarkupDraft] = useState(fields.custom_markup || "");
  const [markupSaveState, setMarkupSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [showPrompt, setShowPrompt] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isCustomVizExpanded, setIsCustomVizExpanded] = useState(false);
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);

  const blockId = fields.id;
  const savedChartType = resolvedVisualizationType ?? defaultChartType;
  const canSave = !!user && !!publicationId && !!blockId && selectedChartType !== savedChartType;

  const handleSaveMarkup = async () => {
    if (!publicationId || !blockId) return;
    setMarkupSaveState("saving");
    try {
      await updatePublicacionBlockCustomMarkup(publicationId, blockId, markupDraft);
      setMarkupSaveState("saved");
      setEditingMarkup(false);
      setTimeout(() => setMarkupSaveState("idle"), 2500);
    } catch {
      setMarkupSaveState("error");
      setTimeout(() => setMarkupSaveState("idle"), 3000);
    }
  };

  const handleSave = async () => {
    if (!publicationId || !blockId) return;
    setSaveState("saving");
    try {
      await updatePublicacionBlockVisualizacion(publicationId, blockId, selectedChartType);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2500);
    } catch {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 3000);
    }
  };

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
    selectedChartType !== "custom_viz" &&
    !showPublicTable;

  const showCustomVizPanel =
    activeTab === "visualizacion" &&
    selectedChartType === "custom_viz" &&
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

  const aiPrompt = (() => {
    const tableData = filteredRows.map((row: any) =>
      Object.fromEntries(
        columns.map((col: any) => [
          col.header,
          row.cells
            ? row.cells.find((c: any) => c.columnId === col.id)?.value ?? ""
            : row[col.id] ?? "",
        ])
      )
    );
    const colNames = columns.map((c: any) => c.header).join(", ");
    const currentMarkup = markupDraft || fields.custom_markup || "<!-- sin markup aún -->";
    return `Sos un experto en visualización de datos con el nivel de The Pudding, NYT Graphics y Bloomberg Visual Data. Tu tarea es crear una visualización interactiva y de alto impacto en HTML + CSS + JS para el sitio "Santiago en Datos".

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASO 1 — ANÁLISIS DE DATOS (hacé esto mentalmente antes de codear)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Antes de elegir el tipo de gráfico, respondé estas preguntas:
1. ¿Qué historia cuentan estos datos? ¿Cuál es el insight principal?
2. ¿Cuántas dimensiones hay? ¿Hay una dimensión temporal, geográfica, jerárquica?
3. ¿Qué relación queremos mostrar: comparación, distribución, composición, tendencia, flujo?
4. ¿Cuántos registros hay? (1–5 → KPI/infografía; 6–20 → gráfico estándar; 20+ → gráfico denso / interactivo con filtro)
5. ¿Hay valores extremos, outliers o datos que merezcan destacarse?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DATOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Columnas: ${colNames}

window.__tableData (ya disponible en el iframe):
${JSON.stringify(tableData, null, 2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASO 2 — ELEGÍ UNA VISUALIZACIÓN DE ALTO IMPACTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROHIBIDO: usar barras/columnas si hay una opción más interesante. El default es la peor opción.

CATÁLOGO CREATIVO — elegí la que mejor comunique la historia:

▸ COMPARACIÓN ENTRE CATEGORÍAS
  - Lollipop chart: puntos en extremos de líneas, mucho más elegante que barras
  - Dot plot divergente: valores positivos/negativos desde un eje central
  - Slope chart: compara dos momentos (antes/después) con líneas que muestran dirección
  - Beeswarm plot: puntos distribuidos sin superposición, muestra distribución real
  - Ranking animado: lista ordenable con transiciones suaves al cambiar métrica

▸ COMPOSICIÓN / PARTES DE UN TODO
  - Waffle chart: grilla de cuadraditos, intuitiva para porcentajes
  - Pictogram chart: íconos SVG repetidos (personas, casas, etc.) como unidad visual
  - Treemap interactivo: rectángulos con hover detail, mejor que torta para muchas categorías
  - Packed circles: burbujas agrupadas por categoría, impacto visual inmediato
  - Stacked area con brushing: área apilada + selector de rango temporal

▸ DISTRIBUCIÓN / DENSIDAD
  - Ridgeline / joy plot: múltiples distribuciones superpuestas en cascada
  - Violin plot: distribución completa + media, más rico que boxplot
  - Strip plot: puntos individuales en columnas, honesto con los datos
  - Hexbin: densidad en grilla hexagonal para datasets grandes

▸ RELACIÓN / CORRELACIÓN
  - Scatter con tooltips ricos: tamaño = tercera variable, color = categoría
  - Bubble chart animado (Gapminder-style): tiempo controlado con slider
  - Connected scatter: puntos unidos por línea mostrando trayectoria temporal
  - Matrix heatmap: correlación entre todas las variables, gradiente de color

▸ TENDENCIA TEMPORAL
  - Area chart con anotaciones: hitos importantes marcados con líneas + labels
  - Small multiples / facet: misma serie para cada categoría en grilla compacta
  - Bump chart: evolución de rankings en el tiempo (cruces de líneas)
  - Step line: para datos que cambian abruptamente (tarifas, políticas)
  - Horizon chart: para muchas series temporales en poco espacio

▸ FLUJO / JERARQUÍA
  - Sankey: flujos entre nodos, ideal para presupuestos, migraciones
  - Sunburst interactivo: jerarquías con zoom al hacer click
  - Network graph: relaciones entre entidades
  - Chord diagram: flujos bidireccionales entre categorías

▸ GEOGRAFÍA
  - Choropleth con tooltip hover
  - Cartograma: tamaño distorsionado por valor (más honesto que choropleth)
  - Dot map: puntos individuales geolocalizados

▸ KPI / STORYTELLING (pocos datos, máximo impacto)
  - Número animado con counter.js: el valor "crece" hasta el final al cargar
  - Big number + sparkline contextual + anotación de tendencia
  - Infografía narrativa: texto + datos integrados, como artículo visual
  - Comparador tipo "X veces más que Y" con representación visual proporcional
  - Progress ring / gauge con gradiente y label central
  - Timeline horizontal de eventos con íconos y descripciones expandibles

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASO 3 — REQUISITOS DE INTERACTIVIDAD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

La visualización DEBE incluir al menos 2 de estos elementos:

✓ TOOLTIPS RICOS — al hover, mostrar panel con todos los datos relevantes del elemento, no solo el valor
✓ ANIMACIÓN DE ENTRADA — los elementos aparecen con transición (barras crecen, puntos aparecen en cascada, números cuentan)
✓ FILTRO / SELECTOR — botones o dropdown para filtrar por categoría o cambiar la métrica mostrada
✓ HIGHLIGHT — al hover un elemento, los demás se atenúan (opacity 0.3), el hover queda al 100%
✓ ORDENAMIENTO — click en encabezado para reordenar ASC/DESC
✓ CLICK-TO-DETAIL — click en elemento expande panel con información adicional
✓ SLIDER TEMPORAL — si hay fechas/años, un input range para navegar el tiempo
✓ ANOTACIONES — labels flotantes en los puntos más relevantes (máximo, mínimo, outlier)
✓ COMPARADOR — toggle entre dos vistas o dos métricas

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DESIGN SYSTEM — Santiago en Datos
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## CSS Variables (light / dark automático)
  --background          /* light: #ffffff   | dark: #161614  */
  --foreground          /* light: #262624   | dark: #f2f2f0  */
  --card                /* light: #ffffff   | dark: #1e1e1c  */
  --muted               /* light: #f5f5f4   | dark: #2a2a28  */
  --muted-foreground    /* light: #666666   | dark: #a3a3a0  */
  --primary             /* #c95b4a  — Rojo Santiago */
  --primary-foreground  /* #ffffff */
  --secondary           /* light: #f5f5f4   | dark: #2a2a28  */
  --border              /* light: #e5e5e5   | dark: #303030  */
  --radius              /* 0.5rem = 8px */
  --font-sans           /* Inter, ui-sans-serif, system-ui */
  --font-mono           /* Source Code Pro, monospace */

## Paletas (usar SIEMPRE estas, no inventar colores)

Identitaria (5 colores, preferida para series principales):
  #c95b4a  Rojo Santiago  |  #4d5f7a  Azul pizarra
  #b08f51  Dorado/ocre    |  #518765  Verde pino  |  #8a597a  Malva

Semáforo:  #16a34a verde  |  #ca8a04 ámbar  |  #c95b4a rojo

Multicolor (10, sin rojo):
  #2563eb #16a34a #ea580c #9333ea #0891b2
  #ca8a04 #db2777 #0d9488 #b45309 #6d28d9

Heatmap (5 tonos rojo):
  #fee2e2 → #fca5a5 → #ef4444 → #b91c1c → #7f1d1d

Gradiente sugerido para fills continuos:
  rgba(201,91,74,0.15) → rgba(201,91,74,0.85)

## Tipografía
- Títulos: var(--font-sans); font-weight: 700–800; letter-spacing: -0.02em
- Subtítulos / labels: var(--font-sans); font-weight: 500
- Números/datos: var(--font-mono); font-weight: 600

## Componentes visuales
Tarjetas: background var(--card); border: 0.5px solid var(--border); border-radius: 12px; padding: 14px 16px
Tooltips: background var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; box-shadow: 0 4px 20px rgba(0,0,0,.12); font-size: 12px
Pills: border-radius: 9999px; padding: 2px 10px; font-size: 11px; font-weight: 500
Ejes: color var(--muted-foreground); font-size: 11px; grid lines var(--border) opacity 0.4

## Animaciones recomendadas
  transition: all 0.2s ease                    /* hover states */
  @keyframes fadeIn { from { opacity:0; transform: translateY(8px) } }
  @keyframes growBar { from { transform: scaleX(0) } }  /* para barras horizontales */
  @keyframes countUp { /* usar requestAnimationFrame para números */ }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LIBRERÍAS DISPONIBLES VÍA CDN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Podés cargar cualquiera según lo que necesites:
  D3.js v7:      https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js
  Chart.js:      https://cdn.jsdelivr.net/npm/chart.js
  Plotly.js:     https://cdn.plot.ly/plotly-2.35.2.min.js
  Observable Plot: https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/dist/plot.umd.min.js
  GSAP (animaciones): https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js

Para SVG e infografías simples: usá SVG vanilla + CSS animations (sin dependencias).
Para gráficos estadísticos complejos: D3.js o Observable Plot.
Para iconos: incluí SVG inline, no uses librerías de iconos.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSTRUCCIONES DE ENTREGA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- NO incluyas <!DOCTYPE html>, <html>, <head> ni <body>
- Solo el contenido interno: <style>, <div id="root">, <script>
- Los datos ya están en window.__tableData (array de objetos, clave = nombre de columna)
- El resultado se inyecta en un iframe que ya tiene todas las CSS vars disponibles
- Usá margin: 0; padding: 0 en el elemento raíz; respetá padding interno con el contenedor
- NO uses colores hardcodeados para texto/fondo; usá siempre las CSS vars
- Si el modo dark/light es relevante, usá @media (prefers-color-scheme: dark) { }
- El código debe funcionar sin servidor (no fetch(), no módulos ES, no imports dinámicos)
- Priorizá legibilidad mobile: texto mínimo 12px, touch targets mínimo 44px

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MARKUP ACTUAL (punto de partida o referencia)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
\`\`\`html
${currentMarkup}
\`\`\``;
  })();

  return (
    <div
      className={
        isWidget
          ? "w-full bg-background flex flex-col"
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
          {/* Custom viz button — only when block has custom_markup */}
          {fields.custom_markup && (
            <div className="flex items-center border-l ml-1 pl-2">
              <button
                title="Visualización personalizada (HTML/JS)"
                onClick={() => setSelectedChartType("custom_viz")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  selectedChartType === "custom_viz"
                    ? "bg-violet-600 text-white shadow-sm"
                    : "bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-950/50 dark:text-violet-300 dark:hover:bg-violet-900/60 border border-violet-200 dark:border-violet-800"
                }`}
              >
                <Code className="h-3.5 w-3.5" />
                Custom
              </button>
            </div>
          )}

          {/* Recommendation legend + Save button */}
          <div className="ml-auto flex items-center gap-2 pl-2">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="w-2 h-2 bg-amber-400 rounded-full inline-block" />
              <span className="hidden sm:inline">Recomendado</span>
            </div>
            {canSave && (
              <button
                onClick={handleSave}
                disabled={saveState === "saving"}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  saveState === "saved"
                    ? "bg-green-600 text-white"
                    : saveState === "error"
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                }`}
              >
                {saveState === "saved" ? (
                  <><Check className="h-3 w-3" />Guardado</>
                ) : saveState === "error" ? (
                  <><AlertCircle className="h-3 w-3" />Error</>
                ) : saveState === "saving" ? (
                  <>Guardando...</>
                ) : (
                  <><Save className="h-3 w-3" />Guardar</>
                )}
              </button>
            )}
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
          <div className="w-full flex-1 overflow-visible">
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

            {showCustomVizPanel && (
              <div className="bg-card border-b h-auto relative group" style={{ minHeight: 'fit-content' }}>
                {editingMarkup ? (
                  /* ── Editor de markup ── */
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Code className="h-3.5 w-3.5" />
                        Editar markup HTML / JS
                      </span>
                      <button
                        onClick={() => { setEditingMarkup(false); setMarkupDraft(fields.custom_markup || ""); }}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                        Cancelar
                      </button>
                    </div>
                    <textarea
                      value={markupDraft}
                      onChange={(e) => setMarkupDraft(e.target.value)}
                      className="w-full h-72 font-mono text-xs bg-slate-950 text-slate-50 p-3 rounded border border-border resize-y focus:outline-none focus:ring-1 focus:ring-primary"
                      spellCheck={false}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSaveMarkup}
                        disabled={markupSaveState === "saving"}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                          markupSaveState === "saved"
                            ? "bg-green-600 text-white"
                            : markupSaveState === "error"
                              ? "bg-destructive text-destructive-foreground"
                              : "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                        }`}
                      >
                        {markupSaveState === "saved" ? (
                          <><Check className="h-3.5 w-3.5" />Guardado</>
                        ) : markupSaveState === "error" ? (
                          <><AlertCircle className="h-3.5 w-3.5" />Error</>
                        ) : markupSaveState === "saving" ? (
                          <>Guardando...</>
                        ) : (
                          <><Save className="h-3.5 w-3.5" />Guardar markup</>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Vista normal: toolbar (solo editor) + iframe ── */
                  <div>
                    {!!user && (
                      <div className="flex items-center gap-2 px-3 py-1.5 border-b bg-muted/10">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 flex-1">
                          Visualización personalizada
                        </span>
                        {showPrompt ? (
                          <button
                            onClick={() => setShowPrompt(false)}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <X className="h-3 w-3" />
                            Cerrar prompt
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => setShowPrompt(true)}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:hover:bg-violet-900/60 transition-colors border border-violet-200 dark:border-violet-800"
                            >
                              <Bot className="h-3.5 w-3.5" />
                              Prompt IA
                            </button>
                            <button
                              onClick={() => setEditingMarkup(true)}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors border border-transparent hover:border-border"
                            >
                              <Pencil className="h-3 w-3" />
                              Editar markup
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {/* ── Panel prompt IA ── */}
                    {showPrompt && !!user && (
                      <div className="p-4 border-b bg-violet-950/10 space-y-3">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Copiá este prompt y pegalo en tu IA favorita (ChatGPT, Claude, etc.) para generar una visualización personalizada con estos datos.
                        </p>
                        <textarea
                          ref={promptTextareaRef}
                          readOnly
                          value={aiPrompt}
                          className="w-full h-52 font-mono text-xs bg-slate-950 text-slate-50 p-3 rounded border border-border resize-y focus:outline-none"
                          onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                        />
                        <button
                          onClick={() => {
                            const ta = promptTextareaRef.current;
                            if (ta) {
                              ta.select();
                              ta.setSelectionRange(0, 99999);
                            }
                            if (navigator.clipboard && window.isSecureContext) {
                              navigator.clipboard.writeText(aiPrompt).catch(() => {
                                if (ta) document.execCommand("copy");
                              });
                            } else {
                              document.execCommand("copy");
                            }
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                            copied
                              ? "bg-green-600 text-white"
                              : "bg-violet-600 text-white hover:bg-violet-700"
                          }`}
                        >
                          {copied ? (
                            <><Check className="h-3.5 w-3.5" />Copiado!</>
                          ) : (
                            <><Copy className="h-3.5 w-3.5" />Copiar prompt</>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Expand button for custom viz */}
                    <button
                      onClick={() => setIsCustomVizExpanded(true)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg border border-border bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all opacity-0 group-hover:opacity-100 z-20 shadow-sm"
                      title="Ver en pantalla completa"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                    </button>

                    <CustomVizBlock
                      custom_markup={markupDraft || fields.custom_markup || ""}
                      data={{ columns, rows: filteredRows }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Fuente y notas — shown for custom viz */}
            {selectedChartType === "custom_viz" && (notas || fuente) && (
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

      {/* Expanded Custom Viz Modal */}
      {isCustomVizExpanded && selectedChartType === "custom_viz" && (
        <div
          className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex flex-col animate-in fade-in duration-200"
          onClick={() => setIsCustomVizExpanded(false)}
        >
          <div
            className="relative flex flex-col bg-background w-full h-full md:m-6 md:rounded-xl md:h-[calc(100vh-3rem)] md:w-[calc(100vw-3rem)] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border shrink-0 bg-background">
              <span className="text-sm font-medium text-muted-foreground font-mono uppercase tracking-widest">
                Visualización personalizada
              </span>
              <button
                onClick={() => setIsCustomVizExpanded(false)}
                className="p-2 rounded-full hover:bg-muted transition-colors"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content — full size, scrollable */}
            <div className="flex-1 overflow-auto p-4 md:p-6">
              <CustomVizBlock
                custom_markup={markupDraft || fields.custom_markup || ""}
                data={{ columns, rows: filteredRows }}
              />
              
              {/* Notas y fuentes en el modal expandido */}
              {(notas || fuente) && (
                <div className="mt-6 pt-4 border-t border-border/50 text-sm space-y-2">
                  {notas && (
                    <div className="text-muted-foreground italic">
                      <span className="font-semibold text-foreground/70 not-italic mr-1.5">Notas:</span>
                      {typeof notas === "string" ? notas : getTextFromNodes(notas)}
                    </div>
                  )}
                  {fuente && (
                    <div className="text-muted-foreground">
                      <span className="font-semibold text-foreground/70 mr-1.5">Fuente:</span>
                      {typeof fuente === "string" ? fuente : getTextFromNodes(fuente)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

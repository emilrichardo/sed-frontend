"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Treemap,
} from "recharts";

// Color Palettes
const COLORS_DEFAULT = ["#0f172a", "#334155", "#64748b", "#94a3b8", "#cbd5e1"];
const COLORS_VIBRANT = [
  "#2563eb", // Blue
  "#db2777", // Pink
  "#ea580c", // Orange
  "#16a34a", // Green
  "#9333ea", // Purple
  "#0891b2", // Cyan
  "#ca8a04", // Yellow
  "#dc2626", // Red
];
const COLORS_SEMAPHORE = ["#16a34a", "#ca8a04", "#dc2626"]; // Green, Yellow, Red
const COLORS_HEATMAP = ["#fee2e2", "#fca5a5", "#ef4444", "#b91c1c", "#7f1d1d"];

type ChartConfig = {
  colores?: "default" | "vibrant" | "semaphore" | "heatmap";
  eje_principal?: string; // X Axis (Label) - matches Column Header
  eje_valores?: string; // Y Axis (Value) - matches Column Header
  eje_secundario?: string; // Grouping/Stacking - matches Column Header
};

type ChartData = {
  [key: string]: string | number;
}[];

const getColors = (palette?: string) => {
  switch (palette) {
    case "vibrant":
      return COLORS_VIBRANT;
    case "semaphore":
      return COLORS_SEMAPHORE;
    case "heatmap":
      return COLORS_HEATMAP;
    default:
      return COLORS_DEFAULT;
  }
};

/**
 * Helper to resolve column ID from Header Name or simply return the Header if keys are headers
 * But typically the manual data has random IDs for keys.
 * We need to map the "User-facing Header" (e.g. "Jurisdicción") to the data key (e.g. "5mj779v10")
 */
const getDataKey = (columns: any[], headerName?: string) => {
  if (!headerName) return null;
  const col = columns.find((c) => c.header === headerName);
  return col ? col.id : null; // Fallback to null if not found
};

const prepareData = (rows: any[], columns: any[]) => {
  return rows.map((row) => {
    const newRow: any = {};
    columns.forEach((col) => {
      // Check for legacy "cells" array or new direct object key
      let val;
      if (row.cells && Array.isArray(row.cells)) {
        val = row.cells.find((c: any) => c.columnId === col.id)?.value;
      } else {
        val = row[col.id];
      }

      let numVal = NaN;
      if (val) {
        const strVal = val.toString().trim();
        // Heuristic for Spanish numbers:
        // If it contains '.', it might be a thousand separator primarily, unless it's a simple decimal like 1.5 in English/Code contexts.
        // But user data "1.963" usually means 1963 in this context unless specified otherwise.
        // "+ 3,9%" -> delete '+', '%', replace ',' with '.'.

        // 1. Remove non-numeric chars except . , -
        let cleanStr = strVal.replace(/[^0-9.,-]/g, "");

        // 2. Handle thousands (dots) and decimals (commas) common in Spanish
        // Remove dots (thousands)
        cleanStr = cleanStr.replace(/\./g, "");
        // Replace comma with dot (decimal)
        cleanStr = cleanStr.replace(/,/g, ".");

        numVal = parseFloat(cleanStr);
      }

      newRow[col.id] = !isNaN(numVal) ? numVal : val; // Use parsing if successful, else raw

      // Also store by Header name for easier debugging/tooltips if needed
      if (col.header) {
        newRow[col.header] = newRow[col.id];
      }
    });
    return newRow;
  });
};

const CustomTooltip = ({ active, payload, label, columns, valueKey }: any) => {
  if (active && payload && payload.length) {
    // Find header name for the value key
    const valCol = columns.find(
      (c: any) => c.id === valueKey || c.header === valueKey,
    );
    const labelName = valCol?.header || "Valor";

    return (
      <div className="bg-background border px-3 py-2 rounded shadow-md text-sm">
        <p className="font-bold mb-1">{label}</p>
        <p className="text-primary">
          {labelName}: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

export const ChartRenderer = ({
  type,
  config,
  data: rawData,
  columns,
}: {
  type: string;
  config?: ChartConfig;
  data: any[];
  columns: any[];
}) => {
  const chartData = prepareData(rawData, columns);
  const colors = getColors(config?.colores);

  // Resolve Data Keys
  const xKey = getDataKey(columns, config?.eje_principal) || columns[0]?.id; // Default to first col
  const yKey = getDataKey(columns, config?.eje_valores) || columns[1]?.id; // Default to second col

  // Only if we found valid keys
  if (!xKey || !yKey)
    return (
      <div className="p-4 text-center text-muted-foreground">
        Configuración de ejes incompleta
      </div>
    );

  // Common Chart Props
  const commonProps = {
    data: chartData,
    margin: { top: 20, right: 30, left: 20, bottom: 5 },
  };

  switch (type) {
    case "bar_chart": // Horizontal Bars
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart layout="vertical" {...commonProps}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={true}
              horizontal={false}
            />
            <XAxis type="number" />
            <YAxis
              dataKey={xKey}
              type="category"
              width={150}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              content={<CustomTooltip columns={columns} valueKey={yKey} />}
            />
            <Bar dataKey={yKey} fill={colors[0]} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );

    case "column_chart":
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip
              content={<CustomTooltip columns={columns} valueKey={yKey} />}
            />
            <Bar dataKey={yKey} fill={colors[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );

    case "pie_chart":
    case "donut_chart":
      const isDonut = type === "donut_chart";
      return (
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey={yKey}
              nameKey={xKey}
              cx="50%"
              cy="50%"
              innerRadius={isDonut ? 60 : 0}
              outerRadius={100}
              fill="#8884d8"
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
              labelLine={true}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      );

    case "line_chart":
      return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip
              content={<CustomTooltip columns={columns} valueKey={yKey} />}
            />
            <Line
              type="monotone"
              dataKey={yKey}
              stroke={colors[0]}
              strokeWidth={2}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      );

    case "area_chart":
      return (
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip
              content={<CustomTooltip columns={columns} valueKey={yKey} />}
            />
            <Area
              type="monotone"
              dataKey={yKey}
              stroke={colors[0]}
              fill={colors[0]}
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      );

    case "radar_chart":
      return (
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
            <PolarGrid />
            <PolarAngleAxis dataKey={xKey} tick={{ fontSize: 11 }} />
            <PolarRadiusAxis />
            <Radar
              name="Valor"
              dataKey={yKey}
              stroke={colors[0]}
              fill={colors[0]}
              fillOpacity={0.6}
            />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      );

    case "kpi_card":
      // Simply take the first row's value
      const kpiValue = chartData[0]?.[yKey] || "-";
      const kpiLabel = chartData[0]?.[xKey] || "KPI";
      return (
        <div className="flex flex-col items-center justify-center h-[200px] border rounded-xl bg-card">
          <span className="text-sm text-muted-foreground uppercase tracking-widest">
            {kpiLabel}
          </span>
          <span className="text-5xl font-black text-primary mt-2">
            {kpiValue}
          </span>
        </div>
      );

    default:
      return (
        <div className="p-8 text-center bg-muted/20 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground italic mb-2">
            Visualización "{type}" en desarrollo.
          </p>
          <p className="text-xs text-muted-foreground">
            Mostrando tabla de datos por defecto.
          </p>
        </div>
      );
  }
};

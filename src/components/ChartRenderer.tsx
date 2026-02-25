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
  ReferenceLine,
} from "recharts";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { scaleQuantile } from "d3-scale";

// Color Palettes
const COLORS_DEFAULT = [
  "#dc2626", // Red (Institutional)
  "#2563eb", // Blue
  "#db2777", // Pink
  "#ea580c", // Orange
  "#16a34a", // Green
  "#9333ea", // Purple
  "#0891b2", // Cyan
  "#ca8a04", // Yellow
];
const COLORS_SLATE = ["#0f172a", "#334155", "#64748b", "#94a3b8", "#cbd5e1"];
const COLORS_SEMAPHORE = ["#16a34a", "#ca8a04", "#dc2626"]; // Green, Yellow, Red
const COLORS_HEATMAP = ["#fee2e2", "#fca5a5", "#ef4444", "#b91c1c", "#7f1d1d"];

const SANTIAGO_RED = "#dc2626";
const BLACK = "#000000";

const getItemColor = (
  name: string | number | undefined,
  index: number,
  palette: string[],
) => {
  const strName = String(name || "").toLowerCase();
  const isSantiago = strName.includes("santiago del estero");
  
  if (isSantiago) {
    return SANTIAGO_RED;
  }
  
  // If any Santiago del Estero exists in data, make all others black
  const hasSantiagoInData = palette === COLORS_DEFAULT;
  if (hasSantiagoInData) {
    return BLACK;
  }
  
  return palette[index % palette.length];
};

type ChartConfig = {
  colores?: "default" | "vibrant" | "slate" | "semaphore" | "heatmap";
  colors?: string[]; // Custom colors array override
  eje_principal?: string; // X Axis (Label) - matches Column Header
  eje_valores?: string; // Y Axis (Value) - matches Column Header
  eje_secundario?: string; // Grouping/Stacking/Comparison - matches Column Header
};

type ChartData = {
  [key: string]: string | number;
}[];

const getColors = (palette?: string) => {
  switch (palette) {
    case "slate":
      return COLORS_SLATE;
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
const getDataKey = (columns: any[], headerNameOrId?: string) => {
  if (!headerNameOrId) return null;
  // First check if it's already a valid column ID
  const colById = columns.find((c) => c.id === headerNameOrId);
  if (colById) return colById.id;
  // Otherwise try to find by header name
  const col = columns.find((c) => c.header === headerNameOrId);
  return col ? col.id : null;
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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border px-3 py-2 rounded shadow-md text-sm">
        <p className="font-bold mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} style={{ color: entry.color || entry.stroke }}>
            {entry.name}:{" "}
            {typeof entry.value === "number"
              ? entry.value.toLocaleString("es-AR")
              : entry.value}
          </p>
        ))}
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

  // Determine Colors: Priority to explicit config.colors array, then palette
  let colors = getColors(config?.colores);
  if (
    config?.colors &&
    Array.isArray(config.colors) &&
    config.colors.length > 0
  ) {
    colors = config.colors;
  }

  // Resolve Data Keys
  const xKey = getDataKey(columns, config?.eje_principal) || columns[0]?.id;
  const yKey = getDataKey(columns, config?.eje_valores) || columns[1]?.id;
  const secondaryKey = getDataKey(columns, config?.eje_secundario);

  // Get proper labels - look up column header if eje_valores is a column ID
  const getColumnHeader = (colId: string | undefined) => {
    if (!colId) return "Y";
    const col = columns.find((c) => c.id === colId);
    return col?.header || colId;
  };

  const xLabel =
    config?.eje_principal || columns.find((c) => c.id === xKey)?.header || "X";
  const yLabel = getColumnHeader(yKey);
  const secondaryLabel = secondaryKey ? getColumnHeader(secondaryKey) : null;

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
              interval={0}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              dataKey={yKey}
              name={yLabel}
              radius={[0, 4, 4, 0]}
              fill={getItemColor(yLabel, 0, colors)}
              barSize={20}
            >
              {!secondaryKey &&
                chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getItemColor(chartData[index][xKey], index, colors)}
                  />
                ))}
            </Bar>
            {secondaryKey && (
              <Bar
                dataKey={secondaryKey}
                name={secondaryLabel}
                radius={[0, 4, 4, 0]}
                fill={getItemColor(secondaryLabel, 1, colors)}
                barSize={20}
              />
            )}
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
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              dataKey={yKey}
              name={yLabel}
              radius={[4, 4, 0, 0]}
              fill={getItemColor(yLabel, 0, colors)}
              barSize={20}
            >
              {!secondaryKey &&
                chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getItemColor(chartData[index][xKey], index, colors)}
                  />
                ))}
            </Bar>
            {secondaryKey && (
              <Bar
                dataKey={secondaryKey}
                name={secondaryLabel}
                radius={[4, 4, 0, 0]}
                fill={getItemColor(secondaryLabel, 1, colors)}
                barSize={20}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      );

    case "stacked_bar_chart":
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
              interval={0}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              dataKey={yKey}
              name={yLabel}
              stackId="a"
              fill={getItemColor(yLabel, 0, colors)}
              barSize={20}
            />
            {secondaryKey && (
              <Bar
                dataKey={secondaryKey}
                name={secondaryLabel}
                stackId="a"
                fill={getItemColor(secondaryLabel, 1, colors)}
                barSize={20}
              />
            )}
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
              innerRadius={isDonut ? 40 : 0}
              outerRadius={70}
              fill="#8884d8"
              label={({ name, percent }: { name?: string; percent?: number }) =>
                `${name || ""} ${((percent || 0) * 100).toFixed(0)}%`
              }
              labelLine={true}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getItemColor(entry[xKey], index, colors)}
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
            <Tooltip content={<CustomTooltip />} />
            {secondaryKey && <Legend />}
            <Line
              type="monotone"
              dataKey={yKey}
              name={yLabel}
              stroke={getItemColor(yLabel, 0, colors)}
              strokeWidth={2}
              activeDot={{ r: 8 }}
            />
            {secondaryKey && (
              <Line
                type="monotone"
                dataKey={secondaryKey}
                name={secondaryLabel ?? undefined}
                stroke={getItemColor(secondaryLabel, 1, colors)}
                strokeWidth={2}
                activeDot={{ r: 8 }}
              />
            )}
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
            <Tooltip content={<CustomTooltip />} />
            {secondaryKey && <Legend />}
            <Area
              type="monotone"
              dataKey={yKey}
              name={yLabel}
              stroke={getItemColor(yLabel, 0, colors)}
              fill={getItemColor(yLabel, 0, colors)}
              fillOpacity={0.3}
            />
            {secondaryKey && (
              <Area
                type="monotone"
                dataKey={secondaryKey}
                name={secondaryLabel ?? undefined}
                stroke={getItemColor(secondaryLabel, 1, colors)}
                fill={getItemColor(secondaryLabel, 1, colors)}
                fillOpacity={0.3}
              />
            )}
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
              name={yLabel}
              dataKey={yKey}
              stroke={getItemColor(yLabel, 0, colors)}
              fill={getItemColor(yLabel, 0, colors)}
              fillOpacity={0.6}
            />
            {secondaryKey && (
              <Radar
                name={secondaryLabel}
                dataKey={secondaryKey}
                stroke={getItemColor(secondaryLabel, 1, colors)}
                fill={getItemColor(secondaryLabel, 1, colors)}
                fillOpacity={0.6}
              />
            )}
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      );

    case "treemap_chart":
    case "treemap":
      return (
        <ResponsiveContainer width="100%" height={400}>
          <Treemap
            data={chartData}
            dataKey={yKey}
            nameKey={xKey}
            stroke="#fff"
            fill={colors[0]}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getItemColor(entry[xKey], index, colors)}
              />
            ))}
            <Tooltip content={<CustomTooltip />} />
          </Treemap>
        </ResponsiveContainer>
      );

    case "pyramid_chart":
    case "tornado_chart": {
      // For Tornado/Pyramid:
      // xKey (eje_principal per config) will be the LABEL axis in Recharts layout="vertical"
      // yKey will be LEFT
      // secondaryKey will be RIGHT

      const leftKey = yKey;
      const rightKey =
        secondaryKey || columns.find((c) => c.id !== xKey && c.id !== yKey)?.id;

      const leftLabel =
        columns.find((c) => c.id === leftKey)?.header || "Izquierda";
      const rightLabel =
        columns.find((c) => c.id === rightKey)?.header || "Derecha";

      const tornadoData = chartData.map((d) => ({
        ...d,
        _left: -Math.abs(Number(d[leftKey]) || 0),
        _right: Math.abs(Number(d[rightKey]) || 0),
      }));

      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            layout="vertical"
            data={tornadoData}
            stackOffset="sign"
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <ReferenceLine
              x={0}
              stroke="hsl(var(--muted-foreground))"
              strokeOpacity={0.5}
            />
            <XAxis
              type="number"
              tickFormatter={(val) => Math.abs(val).toLocaleString()}
            />
            <YAxis
              dataKey={xKey}
              type="category"
              width={100}
              tick={{ fontSize: 12 }}
              interval={0}
            />
            <Tooltip
              cursor={{ fill: "transparent" }}
              content={<CustomTooltip />}
            />
            <Legend
              verticalAlign="top"
              wrapperStyle={{ paddingBottom: "20px" }}
              {...({
                payload: [
                  {
                    value: leftLabel,
                    type: "rect",
                    color: getItemColor(leftLabel, 0, colors),
                  },
                  {
                    value: rightLabel,
                    type: "rect",
                    color: getItemColor(rightLabel, 1, colors),
                  },
                ],
              } as any)}
            />
            <Bar
              dataKey="_left"
              fill={getItemColor(leftLabel, 0, colors)}
              radius={[4, 0, 0, 4]}
              name={leftLabel}
            />
            <Bar
              dataKey="_right"
              fill={getItemColor(rightLabel, 1, colors)}
              radius={[0, 4, 4, 0]}
              name={rightLabel}
            />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    case "kpi_card": {
      // Simply take the first row's value
      const kpiValue = chartData[0]?.[yKey] ?? "-";
      const kpiLabel = chartData[0]?.[xKey] || yLabel || "KPI";
      return (
        <div className="flex flex-col items-center justify-center h-[200px] border rounded-xl bg-card shadow-sm">
          <span className="text-sm text-muted-foreground uppercase tracking-widest font-semibold">
            {kpiLabel}
          </span>
          <span className="text-6xl font-black text-primary mt-2">
            {typeof kpiValue === "number"
              ? kpiValue.toLocaleString()
              : kpiValue}
          </span>
        </div>
      );
    }

    case "gauge_chart": {
      const value = Number(chartData[0]?.[yKey]) || 0;
      const target = 100; // Default max 100
      const data = [
        { name: "Progress", value: Math.min(value, target) },
        { name: "Remaining", value: Math.max(0, target - value) },
      ];

      return (
        <div className="flex flex-col items-center pt-8">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="100%"
                startAngle={180}
                endAngle={0}
                innerRadius={80}
                outerRadius={120}
                paddingAngle={0}
                dataKey="value"
              >
                <Cell
                  fill={getItemColor(chartData[0]?.[xKey] || yLabel, 0, colors)}
                />
                <Cell fill="hsl(var(--muted)/0.3)" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-[-40px] text-center">
            <span className="text-4xl font-black text-foreground">
              {value}
              {yLabel?.includes("%") ? "%" : ""}
            </span>
            <p className="text-muted-foreground text-sm uppercase tracking-wider font-medium mt-1">
              {xLabel !== "Categoría" ? chartData[0]?.[xKey] : yLabel}
            </p>
          </div>
        </div>
      );
    }

    case "status_light": {
      const value = chartData[0]?.[yKey];
      const label = chartData[0]?.[xKey] || yLabel;
      // Heuristic for status: green if starts with 'ok' or number > 0, etc.
      // But usually this would be mapped to semaphore colors.
      let lightColor = colors[0];
      if (config?.colores === "semaphore") {
        const valNum = Number(value);
        if (!isNaN(valNum)) {
          if (valNum > 80) lightColor = COLORS_SEMAPHORE[0];
          else if (valNum > 40) lightColor = COLORS_SEMAPHORE[1];
          else lightColor = COLORS_SEMAPHORE[2];
        }
      }

      return (
        <div className="flex items-center gap-4 p-6 border rounded-xl bg-card">
          <div
            className="w-12 h-12 rounded-full shadow-lg animate-pulse"
            style={{
              backgroundColor: lightColor,
              boxShadow: `0 0 20px ${lightColor}66`,
            }}
          />
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground uppercase tracking-tight">
              {label}
            </p>
          </div>
        </div>
      );
    }

    case "waterfall_chart": {
      const wfData: any[] = [];
      let currentRunning = 0;
      chartData.forEach((d) => {
        const value = Number(d[yKey]) || 0;
        const isPos = value >= 0;
        const base = isPos ? currentRunning : currentRunning + value;
        currentRunning += value;
        wfData.push({
          ...d,
          _base: base,
          _bar: Math.abs(value),
          _positive: isPos,
          _value: value,
        });
      });

      const allTops = wfData.map((d) => d._base + d._bar);
      const allBases = wfData.map((d) => d._base);
      const minDomain = Math.min(0, ...allBases);
      const maxDomain = Math.max(...allTops);
      const pad = (maxDomain - minDomain) * 0.1 || 10;

      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={wfData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis domain={[minDomain - pad, maxDomain + pad]} />
            <Tooltip
              content={({ active, label }) => {
                if (!active || !label) return null;
                const entry = wfData.find(
                  (d) => String(d[xKey]) === String(label),
                );
                if (!entry) return null;
                const v = entry._value;
                const col = entry._positive
                  ? SANTIAGO_RED
                  : colors[2] || "#dc2626";
                return (
                  <div className="bg-background border px-3 py-2 rounded shadow-md text-sm">
                    <p className="font-bold mb-1">{label}</p>
                    <p style={{ color: col }}>
                      {yLabel}: {v > 0 ? "+" : ""}
                      {v.toLocaleString("es-AR")}
                    </p>
                  </div>
                );
              }}
            />
            <ReferenceLine
              y={0}
              stroke="hsl(var(--muted-foreground))"
              strokeOpacity={0.4}
            />
            {/* Invisible spacer bar */}
            <Bar
              dataKey="_base"
              stackId="wf"
              fill="transparent"
              legendType="none"
              name=""
            />
            {/* Visible change bar */}
            <Bar
              dataKey="_bar"
              stackId="wf"
              radius={[4, 4, 0, 0]}
              name={yLabel}
            >
              {wfData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry._positive
                      ? getItemColor(entry[xKey], index, colors)
                      : colors[2] || "#dc2626"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    }

    case "sankey_chart": {
      // eje_principal = source, eje_secundario = target, eje_valores = numeric value
      const tgtKey =
        secondaryKey || columns.find((c) => c.id !== xKey && c.id !== yKey)?.id;

      if (!tgtKey) {
        return (
          <div className="p-4 text-center text-muted-foreground text-sm">
            Sankey requiere 3 columnas: origen (eje_principal), destino
            (eje_secundario) y valor numérico (eje_valores).
          </div>
        );
      }

      const SVG_W = 560;
      const SVG_H = 300;
      const NODE_W = 14;
      const GAP = 8;
      const LABEL_W = 130;

      const srcNames = [
        ...new Set(chartData.map((d) => String(d[xKey] ?? "")).filter(Boolean)),
      ];
      const tgtNames = [
        ...new Set(
          chartData.map((d) => String(d[tgtKey] ?? "")).filter(Boolean),
        ),
      ];

      const srcTotals: Record<string, number> = {};
      const tgtTotals: Record<string, number> = {};
      chartData.forEach((d) => {
        const v = Number(d[yKey]) || 0;
        const s = String(d[xKey] ?? "");
        const t = String(d[tgtKey] ?? "");
        srcTotals[s] = (srcTotals[s] || 0) + v;
        tgtTotals[t] = (tgtTotals[t] || 0) + v;
      });

      const totalFlow = Object.values(srcTotals).reduce((a, b) => a + b, 0);
      if (totalFlow === 0) {
        return (
          <div className="p-4 text-muted-foreground text-sm text-center">
            Sin datos para Sankey
          </div>
        );
      }

      const innerW = SVG_W - 2 * LABEL_W;
      const leftX = LABEL_W;
      const rightX = LABEL_W + innerW;

      const usableSrcH = SVG_H - Math.max(0, srcNames.length - 1) * GAP;
      const usableTgtH = SVG_H - Math.max(0, tgtNames.length - 1) * GAP;

      let acc = 0;
      const srcLayout: Record<string, { y: number; h: number; off: number }> =
        {};
      srcNames.forEach((name) => {
        const h = Math.max(4, (srcTotals[name] / totalFlow) * usableSrcH);
        srcLayout[name] = { y: acc, h, off: 0 };
        acc += h + GAP;
      });

      acc = 0;
      const tgtLayout: Record<string, { y: number; h: number; off: number }> =
        {};
      tgtNames.forEach((name) => {
        const h = Math.max(4, (tgtTotals[name] / totalFlow) * usableTgtH);
        tgtLayout[name] = { y: acc, h, off: 0 };
        acc += h + GAP;
      });

      const cx = (leftX + NODE_W + rightX) / 2;
      const paths = chartData
        .map((d, i) => {
          const v = Number(d[yKey]) || 0;
          if (v === 0) return null;
          const flowH = (v / totalFlow) * SVG_H;
          const src = srcLayout[String(d[xKey] ?? "")];
          const tgt = tgtLayout[String(d[tgtKey] ?? "")];
          if (!src || !tgt) return null;

          const x1 = leftX + NODE_W;
          const x2 = rightX;
          const y1 = src.y + src.off;
          const y2 = tgt.y + tgt.off;
          src.off += flowH;
          tgt.off += flowH;

          const pathD = [
            `M ${x1} ${y1}`,
            `C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`,
            `L ${x2} ${y2 + flowH}`,
            `C ${cx} ${y2 + flowH}, ${cx} ${y1 + flowH}, ${x1} ${y1 + flowH}`,
            "Z",
          ].join(" ");

          return {
            d: pathD,
            color: colors[i % colors.length],
            title: `${d[xKey]} → ${d[tgtKey]}: ${v.toLocaleString("es-AR")}`,
          };
        })
        .filter(Boolean);

      return (
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            className="w-full"
            style={{ height: 350 }}
          >
            {paths.map((p, i) =>
              p ? (
                <path
                  key={i}
                  d={p.d}
                  fill={p.color}
                  fillOpacity={0.4}
                  stroke={p.color}
                  strokeWidth={0.5}
                >
                  <title>{p.title}</title>
                </path>
              ) : null,
            )}
            {srcNames.map((name, i) => {
              const n = srcLayout[name];
              return (
                <g key={`src-${i}`}>
                  <rect
                    x={leftX}
                    y={n.y}
                    width={NODE_W}
                    height={n.h}
                    fill={colors[i % colors.length]}
                    rx={2}
                  />
                  <text
                    x={leftX - 6}
                    y={n.y + n.h / 2}
                    textAnchor="end"
                    dominantBaseline="middle"
                    fontSize={10}
                    className="fill-foreground"
                  >
                    {name}
                  </text>
                </g>
              );
            })}
            {tgtNames.map((name, i) => {
              const n = tgtLayout[name];
              const colIdx = (i + srcNames.length) % colors.length;
              return (
                <g key={`tgt-${i}`}>
                  <rect
                    x={rightX}
                    y={n.y}
                    width={NODE_W}
                    height={n.h}
                    fill={colors[colIdx]}
                    rx={2}
                  />
                  <text
                    x={rightX + NODE_W + 6}
                    y={n.y + n.h / 2}
                    dominantBaseline="middle"
                    fontSize={10}
                    className="fill-foreground"
                  >
                    {name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      );
    }

    case "map_argentina": {
      const geoUrl = "https://raw.githubusercontent.com/ArgentinaData/georef-ar-api/master/out/geojson/provincias.geo.json";
      
      const getValue = (name: string) => {
        const row = chartData.find((d) => {
          const xVal = String(d[xKey] || "").toLowerCase();
          return xVal.includes(name.toLowerCase()) || name.toLowerCase().includes(xVal);
        });
        return row ? Number(String(row[yKey]).replace(/[^0-9.-]/g, "")) : null;
      };

      const colorScale = scaleQuantile<string>()
        .domain(chartData.map((d) => Number(String(d[yKey]).replace(/[^0-9.-]/g, ""))).filter((v) => !isNaN(v)))
        .range(["#fef2f2", "#fecaca", "#f87171", "#dc2626", "#991b1b"]);

      return (
        <div className="w-full">
          <ResponsiveContainer width="100%" height={500}>
            <ComposableMap projection="geoMercator" projectionConfig={{ scale: 350, center: [-64, -34] }}>
              <ZoomableGroup>
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const name = geo.properties.name || geo.properties.nombre || "";
                      const value = getValue(name);
                      const isSantiago = name.toLowerCase().includes("santiago");
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={isSantiago ? SANTIAGO_RED : value ? colorScale(value) : "#e5e7eb"}
                          stroke="#fff"
                          strokeWidth={0.5}
                          style={{
                            default: { outline: "none" },
                            hover: { outline: "none", opacity: 0.8 },
                            pressed: { outline: "none" },
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
              </ZoomableGroup>
            </ComposableMap>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap gap-2 justify-center text-xs">
            <div className="flex items-center gap-1"><span className="w-3 h-3 bg-[#fef2f2] border"></span> Bajo</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 bg-[#fecaca] border"></span></div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 bg-[#f87171] border"></span></div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 bg-[#dc2626] border"></span></div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 bg-[#991b1b] border"></span> Alto</div>
          </div>
        </div>
      );
    }

    case "map_santiago_del_estero": {
      const geoUrl = "https://raw.githubusercontent.com/ArgentinaData/georef-ar-api/master/out/geojson/departamentos%3Fprovincia%3D22.geo.json";
      
      const getValue = (name: string) => {
        const row = chartData.find((d) => {
          const xVal = String(d[xKey] || "").toLowerCase();
          return xVal.includes(name.toLowerCase()) || name.toLowerCase().includes(xVal);
        });
        return row ? Number(String(row[yKey]).replace(/[^0-9.-]/g, "")) : null;
      };

      const values = chartData.map((d) => Number(String(d[yKey]).replace(/[^0-9.-]/g, ""))).filter((v) => !isNaN(v));
      const colorScale = scaleQuantile<string>()
        .domain(values.length ? values : [0])
        .range(["#fef2f2", "#fecaca", "#f87171", "#dc2626", "#991b1b"]);

      return (
        <div className="w-full">
          <ResponsiveContainer width="100%" height={500}>
            <ComposableMap projection="geoMercator" projectionConfig={{ scale: 2200, center: [-63.5, -27.5] }}>
              <ZoomableGroup>
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const name = geo.properties.name || geo.properties.nombre || "";
                      const value = getValue(name);
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={value ? colorScale(value) : "#e5e7eb"}
                          stroke="#fff"
                          strokeWidth={0.5}
                          style={{
                            default: { outline: "none" },
                            hover: { outline: "none", opacity: 0.8 },
                            pressed: { outline: "none" },
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
              </ZoomableGroup>
            </ComposableMap>
          </ResponsiveContainer>
        </div>
      );
    }

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

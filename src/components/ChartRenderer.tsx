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
  "#dc2626",
  "#2563eb",
  "#db2777",
  "#ea580c",
  "#16a34a",
  "#9333ea",
  "#0891b2",
  "#ca8a04",
];
const COLORS_SLATE = ["#0f172a", "#334155", "#64748b", "#94a3b8", "#cbd5e1"];
const COLORS_SEMAPHORE = ["#16a34a", "#ca8a04", "#dc2626"];
const COLORS_HEATMAP = ["#fee2e2", "#fca5a5", "#ef4444", "#b91c1c", "#7f1d1d"];

const SANTIAGO_RED = "#dc2626";
const BLACK = "#000000";

// Province name mappings
const PROVINCE_ALIASES: Record<string, string[]> = {
  "ciudad de buenos aires": ["caba", "capital federal"],
  "buenos aires": ["buenos aires", "provincia de buenos aires"],
  "santa fe": ["santa fe", "santafe"],
  "santiago del estero": ["santiago del estero", "sde", "santiago"],
  "córdoba": ["córdoba", "cordoba"],
  "mendoza": ["mendoza"],
  "tucumán": ["tucumán", "tucuman"],
  "salta": ["salta"],
  "chaco": ["chaco"],
  "misiones": ["misiones"],
  "corrientes": ["corrientes"],
  "entre ríos": ["entre ríos", "entre Rios"],
  "jujuy": ["jujuy"],
  "neuquén": ["neuquén", "neuquen"],
  "río negro": ["río negro", "rio negro"],
  "formosa": ["formosa"],
  "la pampa": ["la pampa"],
  "la rioja": ["la rioja"],
  "catamarca": ["catamarca"],
  "san juan": ["san juan"],
  "san luis": ["san luis"],
  "tierra del fuego": ["tierra del fuego"],
  "chubut": ["chubut"],
  "santa cruz": ["santa cruz"],
  "república argentina": ["república argentina", "argentina"],
};

// Embedded GeoJSON for Argentine provinces
const ARGENTINA_PROVINCES_GEOJSON = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", properties: { name: "Buenos Aires" }, geometry: { type: "Polygon", coordinates: [[[-57.5, -34.3], [-57.5, -35.5], [-58.5, -35.5], [-58.5, -34.3], [-57.5, -34.3]]] }},
    { type: "Feature", properties: { name: "CABA" }, geometry: { type: "Polygon", coordinates: [[[-58.5, -34.55], [-58.5, -34.7], [-58.3, -34.7], [-58.3, -34.55], [-58.5, -34.55]]] }},
    { type: "Feature", properties: { name: "Santa Fe" }, geometry: { type: "Polygon", coordinates: [[[-60, -30], [-60, -34], [-63, -34], [-63, -30], [-60, -30]]] }},
    { type: "Feature", properties: { name: "Córdoba" }, geometry: { type: "Polygon", coordinates: [[[-62.5, -30], [-62.5, -35], [-66, -35], [-66, -30], [-62.5, -30]]] }},
    { type: "Feature", properties: { name: "Mendoza" }, geometry: { type: "Polygon", coordinates: [[[-66.5, -32], [-66.5, -37], [-70.5, -37], [-70.5, -32], [-66.5, -32]]] }},
    { type: "Feature", properties: { name: "Tucumán" }, geometry: { type: "Polygon", coordinates: [[[-66, -26.5], [-66, -28], [-65, -28], [-65, -26.5], [-66, -26.5]]] }},
    { type: "Feature", properties: { name: "Salta" }, geometry: { type: "Polygon", coordinates: [[[-66, -22], [-66, -26.5], [-68, -26.5], [-68, -22], [-66, -22]]] }},
    { type: "Feature", properties: { name: "Chaco" }, geometry: { type: "Polygon", coordinates: [[[-58.5, -26], [-58.5, -30.5], [-62, -30.5], [-62, -26], [-58.5, -26]]] }},
    { type: "Feature", properties: { name: "Santiago del Estero" }, geometry: { type: "Polygon", coordinates: [[[-62.5, -27], [-62.5, -30.5], [-65, -30.5], [-65, -27], [-62.5, -27]]] }},
    { type: "Feature", properties: { name: "Corrientes" }, geometry: { type: "Polygon", coordinates: [[[-55.5, -27], [-55.5, -32.5], [-58, -32.5], [-58, -27], [-55.5, -27]]] }},
    { type: "Feature", properties: { name: "Misiones" }, geometry: { type: "Polygon", coordinates: [[[-53.5, -25.5], [-53.5, -28], [-56, -28], [-56, -25.5], [-53.5, -25.5]]] }},
    { type: "Feature", properties: { name: "Jujuy" }, geometry: { type: "Polygon", coordinates: [[[-66, -21.5], [-66, -24.5], [-65, -24.5], [-65, -21.5], [-66, -21.5]]] }},
    { type: "Feature", properties: { name: "Entre Ríos" }, geometry: { type: "Polygon", coordinates: [[[-57.5, -31.5], [-57.5, -34], [-60, -34], [-60, -31.5], [-57.5, -31.5]]] }},
    { type: "Feature", properties: { name: "Neuquén" }, geometry: { type: "Polygon", coordinates: [[[-68, -36.5], [-68, -41], [-71.5, -41], [-71.5, -36.5], [-68, -36.5]]] }},
    { type: "Feature", properties: { name: "Río Negro" }, geometry: { type: "Polygon", coordinates: [[[-63, -37], [-63, -44], [-69, -44], [-69, -37], [-63, -37]]] }},
    { type: "Feature", properties: { name: "Formosa" }, geometry: { type: "Polygon", coordinates: [[[-61.5, -24], [-61.5, -26.5], [-59.5, -26.5], [-59.5, -24], [-61.5, -24]]] }},
    { type: "Feature", properties: { name: "La Pampa" }, geometry: { type: "Polygon", coordinates: [[[-63, -35], [-63, -39.5], [-68, -39.5], [-68, -35], [-63, -35]]] }},
    { type: "Feature", properties: { name: "La Rioja" }, geometry: { type: "Polygon", coordinates: [[[-66.5, -28], [-66.5, -32], [-69, -32], [-69, -28], [-66.5, -28]]] }},
    { type: "Feature", properties: { name: "Catamarca" }, geometry: { type: "Polygon", coordinates: [[[-66, -27], [-66, -30.5], [-69, -30.5], [-69, -27], [-66, -27]]] }},
    { type: "Feature", properties: { name: "San Juan" }, geometry: { type: "Polygon", coordinates: [[[-68, -30], [-68, -34], [-70.5, -34], [-70.5, -30], [-68, -30]]] }},
    { type: "Feature", properties: { name: "San Luis" }, geometry: { type: "Polygon", coordinates: [[[-65, -32], [-65, -36.5], [-67, -36.5], [-67, -32], [-65, -32]]] }},
    { type: "Feature", properties: { name: "Chubut" }, geometry: { type: "Polygon", coordinates: [[[-64, -42.5], [-64, -47], [-69.5, -47], [-69.5, -42.5], [-64, -42.5]]] }},
    { type: "Feature", properties: { name: "Santa Cruz" }, geometry: { type: "Polygon", coordinates: [[[-66, -46], [-66, -52], [-72, -52], [-72, -46], [-66, -46]]] }},
    { type: "Feature", properties: { name: "Tierra del Fuego" }, geometry: { type: "Polygon", coordinates: [[[-65, -52], [-65, -55.5], [-68, -55.5], [-68, -52], [-65, -52]]] }},
  ]
};

const normalizeName = (name: string): string => {
  return name.toLowerCase().replace(/[áéíóúñ]/g, (c) => 
    "aeioun"["áéíóúñ".indexOf(c)] || c
  ).trim();
};

const findMatchingValue = (
  geoName: string,
  chartData: any[],
  xKey: string,
  yKey: string
): number | null => {
  const normalizedGeo = normalizeName(geoName);
  
  for (const row of chartData) {
    const xVal = normalizeName(String(row[xKey] || ""));
    if (xVal === normalizedGeo || xVal.includes(normalizedGeo) || normalizedGeo.includes(xVal)) {
      const valStr = String(row[yKey] || "").replace(/[^0-9.,%-]/g, "").replace("%", "").replace(",", ".");
      const val = parseFloat(valStr);
      if (!isNaN(val)) return val;
    }
  }
  
  const aliases = PROVINCE_ALIASES[normalizedGeo] || [];
  for (const alias of aliases) {
    for (const row of chartData) {
      const xVal = normalizeName(String(row[xKey] || ""));
      if (xVal.includes(alias) || alias.includes(xVal)) {
        const valStr = String(row[yKey] || "").replace(/[^0-9.,%-]/g, "").replace("%", "").replace(",", ".");
        const val = parseFloat(valStr);
        if (!isNaN(val)) return val;
      }
    }
  }
  
  return null;
};

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
  
  if (palette === COLORS_DEFAULT) {
    return BLACK;
  }
  
  return palette[index % palette.length];
};

type ChartConfig = {
  colores?: "default" | "vibrant" | "slate" | "semaphore" | "heatmap";
  colors?: string[];
  eje_principal?: string;
  eje_valores?: string;
  eje_secundario?: string;
};

type ChartData = { [key: string]: string | number }[];

const getColors = (palette?: string) => {
  switch (palette) {
    case "slate": return COLORS_SLATE;
    case "semaphore": return COLORS_SEMAPHORE;
    case "heatmap": return COLORS_HEATMAP;
    default: return COLORS_DEFAULT;
  }
};

const getDataKey = (columns: any[], headerNameOrId?: string) => {
  if (!headerNameOrId) return null;
  const colById = columns.find((c) => c.id === headerNameOrId);
  if (colById) return colById.id;
  const col = columns.find((c) => c.header === headerNameOrId);
  return col ? col.id : null;
};

const prepareData = (rows: any[], columns: any[]) => {
  return rows.map((row) => {
    const newRow: any = {};
    columns.forEach((col) => {
      let val;
      if (row.cells && Array.isArray(row.cells)) {
        val = row.cells.find((c: any) => c.columnId === col.id)?.value;
      } else {
        val = row[col.id];
      }

      let numVal = NaN;
      if (val) {
        const strVal = val.toString().trim();
        let cleanStr = strVal.replace(/[^0-9.,-]/g, "");
        cleanStr = cleanStr.replace(/\./g, "");
        cleanStr = cleanStr.replace(/,/g, ".");
        numVal = parseFloat(cleanStr);
      }

      newRow[col.id] = !isNaN(numVal) ? numVal : val;
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
            {entry.name}: {typeof entry.value === "number" ? entry.value.toLocaleString("es-AR") : entry.value}
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

  let colors = getColors(config?.colores);
  if (config?.colors && Array.isArray(config.colors) && config.colors.length > 0) {
    colors = config.colors;
  }

  const yKeyString = config?.eje_valores || "";
  const yKeys = yKeyString.includes(",") ? yKeyString.split(",").map((k) => k.trim()).filter(Boolean) : [];
  const hasMultipleYKeys = yKeys.length > 1;

  const xKey = getDataKey(columns, config?.eje_principal) || columns[0]?.id;
  const yKey = hasMultipleYKeys ? yKeys[0] : (getDataKey(columns, config?.eje_valores) || columns[1]?.id);
  const secondaryKey = getDataKey(columns, config?.eje_secundario);

  const getColumnHeader = (colId: string | undefined) => {
    if (!colId) return "Y";
    const col = columns.find((c) => c.id === colId);
    return col?.header || colId;
  };

  const xLabel = config?.eje_principal || columns.find((c) => c.id === xKey)?.header || "X";
  const yLabel = getColumnHeader(yKey);

  if (!xKey || !yKey) {
    return <div className="p-4 text-center text-muted-foreground">Configuración de ejes incompleta</div>;
  }

  const commonProps = {
    data: chartData,
    margin: { top: 20, right: 30, left: 20, bottom: 5 },
  };

  switch (type) {
    case "bar_chart":
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart layout="vertical" {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" vertical horizontal={false} />
            <XAxis type="number" />
            <YAxis dataKey={xKey} type="category" width={150} tick={{ fontSize: 12 }} interval={0} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {hasMultipleYKeys ? (
              yKeys.map((yk, idx) => (
                <Bar key={yk} dataKey={yk} name={getColumnHeader(yk)} radius={[0, 4, 4, 0]} fill={colors[idx % colors.length]} barSize={20} />
              ))
            ) : (
              <Bar dataKey={yKey} name={yLabel} radius={[0, 4, 4, 0]} fill={getItemColor(yLabel, 0, colors)} barSize={20}>
                {!secondaryKey && chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={getItemColor(chartData[index][xKey], index, colors)} />
                ))}
              </Bar>
            )}
            {secondaryKey && !hasMultipleYKeys && (
              <Bar dataKey={secondaryKey} name={getColumnHeader(secondaryKey)} radius={[0, 4, 4, 0]} fill={getItemColor(getColumnHeader(secondaryKey), 1, colors)} barSize={20} />
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
            {hasMultipleYKeys ? (
              yKeys.map((yk, idx) => (
                <Bar key={yk} dataKey={yk} name={getColumnHeader(yk)} radius={[4, 4, 0, 0]} fill={colors[idx % colors.length]} barSize={20} />
              ))
            ) : (
              <Bar dataKey={yKey} name={yLabel} radius={[4, 4, 0, 0]} fill={getItemColor(yLabel, 0, colors)} barSize={20}>
                {!secondaryKey && chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={getItemColor(chartData[index][xKey], index, colors)} />
                ))}
              </Bar>
            )}
            {secondaryKey && !hasMultipleYKeys && (
              <Bar dataKey={secondaryKey} name={getColumnHeader(secondaryKey)} radius={[4, 4, 0, 0]} fill={getItemColor(getColumnHeader(secondaryKey), 1, colors)} barSize={20} />
            )}
          </BarChart>
        </ResponsiveContainer>
      );

    case "stacked_bar_chart":
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart layout="vertical" {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" vertical horizontal={false} />
            <XAxis type="number" />
            <YAxis dataKey={xKey} type="category" width={150} tick={{ fontSize: 12 }} interval={0} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey={yKey} name={yLabel} stackId="a" fill={getItemColor(yLabel, 0, colors)} barSize={20} />
            {secondaryKey && <Bar dataKey={secondaryKey} name={getColumnHeader(secondaryKey)} stackId="a" fill={getItemColor(getColumnHeader(secondaryKey), 1, colors)} barSize={20} />}
          </BarChart>
        </ResponsiveContainer>
      );

    case "pie_chart":
    case "donut_chart": {
      const isDonut = type === "donut_chart";
      return (
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={chartData} dataKey={yKey} nameKey={xKey}
              cx="50%" cy="50%"
              innerRadius={isDonut ? 40 : 0}
              outerRadius={70}
              fill="#8884d8"
              label={({ name, percent }: any) => `${name || ""} ${((percent || 0) * 100).toFixed(0)}%`}
              labelLine
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getItemColor(entry[xKey], index, colors)} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    case "line_chart":
      return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            {secondaryKey && <Legend />}
            <Line type="monotone" dataKey={yKey} name={yLabel} stroke={getItemColor(yLabel, 0, colors)} strokeWidth={2} activeDot={{ r: 8 }} />
            {secondaryKey && <Line type="monotone" dataKey={secondaryKey} name={getColumnHeader(secondaryKey)} stroke={getItemColor(getColumnHeader(secondaryKey), 1, colors)} strokeWidth={2} activeDot={{ r: 8 }} />}
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
            <Area type="monotone" dataKey={yKey} name={yLabel} stroke={getItemColor(yLabel, 0, colors)} fill={getItemColor(yLabel, 0, colors)} fillOpacity={0.3} />
            {secondaryKey && <Area type="monotone" dataKey={secondaryKey} name={getColumnHeader(secondaryKey)} stroke={getItemColor(getColumnHeader(secondaryKey), 1, colors)} fill={getItemColor(getColumnHeader(secondaryKey), 1, colors)} fillOpacity={0.3} />}
          </AreaChart>
        </ResponsiveContainer>
      );

    case "map_argentina": {
      const getValue = (name: string) => findMatchingValue(name, chartData, xKey, yKey);
      const numericValues = chartData.map((d) => Number(String(d[yKey]).replace(/[^0-9.,%-]/g, "").replace(",", ".").replace("%", ""))).filter((v) => !isNaN(v));
      const colorScale = scaleQuantile<string>().domain(numericValues.length ? numericValues : [0]).range(["#fef2f2", "#fecaca", "#f87171", "#dc2626", "#991b1b"]);

      return (
        <div className="w-full">
          <ResponsiveContainer width="100%" height={500}>
            <ComposableMap projection="geoMercator" projectionConfig={{ scale: 400, center: [-64, -34] }}>
              <ZoomableGroup>
                <Geographies geography={ARGENTINA_PROVINCES_GEOJSON}>
                  {({ geographies }: { geographies: any[] }) =>
                    geographies.map((geo) => {
                      const name = geo.properties?.name || "";
                      const value = getValue(name);
                      const isSantiago = normalizeName(name).includes("santiago");
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={isSantiago ? SANTIAGO_RED : value != null ? colorScale(value) : "#e5e7eb"}
                          stroke="#fff"
                          strokeWidth={0.5}
                          style={{ default: { outline: "none" }, hover: { outline: "none", opacity: 0.8 }, pressed: { outline: "none" } }}
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
          <p className="text-muted-foreground italic mb-2">Visualización "{type}" en desarrollo.</p>
        </div>
      );
  }
};

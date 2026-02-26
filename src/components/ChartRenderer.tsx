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
import { scaleQuantile } from "d3-scale";
import { geoMercator, geoPath } from "d3-geo";

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
// Multicolor: no red — red is reserved for Santiago del Estero
const COLORS_MULTICOLOR = [
  "#2563eb",
  "#16a34a",
  "#ea580c",
  "#9333ea",
  "#0891b2",
  "#ca8a04",
  "#db2777",
  "#0d9488",
  "#b45309",
  "#6d28d9",
];

const SANTIAGO_RED = "#dc2626";
const BLACK = "#000000";

// Province name mappings
const PROVINCE_ALIASES: Record<string, string[]> = {
  "ciudad de buenos aires": [
    "caba",
    "capital federal",
    "ciudad autonoma de buenos aires",
  ],
  "buenos aires": ["buenos aires", "provincia de buenos aires"],
  "santa fe": ["santa fe", "santafe"],
  "santiago del estero": ["santiago del estero", "sde", "santiago"],
  cordoba: ["córdoba", "cordoba"],
  mendoza: ["mendoza"],
  tucuman: ["tucumán", "tucuman"],
  salta: ["salta"],
  chaco: ["chaco"],
  misiones: ["misiones"],
  corrientes: ["corrientes"],
  "entre rios": ["entre ríos", "entre rios"],
  jujuy: ["jujuy"],
  neuquen: ["neuquén", "neuquen"],
  "rio negro": ["río negro", "rio negro"],
  formosa: ["formosa"],
  "la pampa": ["la pampa"],
  "la rioja": ["la rioja"],
  catamarca: ["catamarca"],
  "san juan": ["san juan"],
  "san luis": ["san luis"],
  "tierra del fuego": [
    "tierra del fuego",
    "tierra del fuego, antartida e islas del atlantico sur",
  ],
  chubut: ["chubut"],
  "santa cruz": ["santa cruz"],
  "republica argentina": ["república argentina", "argentina"],
};

const normalizeName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[áéíóúñ]/g, (c) => "aeioun"["áéíóúñ".indexOf(c)] || c)
    .trim();
};

const findMatchingValue = (
  geoName: string,
  chartData: any[],
  xKey: string,
  yKey: string,
): number | null => {
  const normalizedGeo = normalizeName(geoName);

  // console.log(`Looking for match for: ${geoName} (${normalizedGeo})`);

  for (const row of chartData) {
    const xVal = normalizeName(String(row[xKey] || ""));
    // Exact match or contains
    if (
      xVal === normalizedGeo ||
      (xVal.length > 3 && normalizedGeo.includes(xVal)) ||
      (normalizedGeo.length > 3 && xVal.includes(normalizedGeo))
    ) {
      const valStr = String(row[yKey] || "")
        .replace(/[^0-9.,%-]/g, "")
        .replace("%", "")
        .replace(",", ".");
      const val = parseFloat(valStr);
      if (!isNaN(val)) return val;
    }

    // Alias match
    const aliases = PROVINCE_ALIASES[normalizedGeo] || [];
    if (
      aliases.some(
        (alias) =>
          normalizeName(alias) === xVal || xVal.includes(normalizeName(alias)),
      )
    ) {
      const valStr = String(row[yKey] || "")
        .replace(/[^0-9.,%-]/g, "")
        .replace("%", "")
        .replace(",", ".");
      const val = parseFloat(valStr);
      if (!isNaN(val)) return val;
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
  colores?:
    | "default"
    | "vibrant"
    | "slate"
    | "semaphore"
    | "heatmap"
    | "multicolor";
  colors?: string[];
  eje_principal?: string;
  eje_valores?: string;
  eje_secundario?: string;
};

type ChartData = { [key: string]: string | number }[];

const getColors = (palette?: string) => {
  switch (palette) {
    case "slate":
      return COLORS_SLATE;
    case "semaphore":
      return COLORS_SEMAPHORE;
    case "heatmap":
      return COLORS_HEATMAP;
    case "multicolor":
      return COLORS_MULTICOLOR;
    default:
      return COLORS_DEFAULT;
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

const MAP_GRADIENT = [
  "#fef2f2",
  "#fecaca",
  "#f87171",
  "#ef4444",
  "#dc2626",
  "#b91c1c",
  "#991b1b",
];
// Blue gradient for multicolor mode (Santiago stays red, others in blue)
const MAP_GRADIENT_MULTI = [
  "#eff6ff",
  "#bfdbfe",
  "#93c5fd",
  "#60a5fa",
  "#3b82f6",
  "#2563eb",
  "#1d4ed8",
];

// Shared hook for loading GeoJSON
function useGeoData(url: string) {
  const [data, setData] = React.useState<any>(null);
  React.useEffect(() => {
    fetch(url)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, [url]);
  return data;
}

const MapArgentina = ({
  chartData,
  xKey,
  yKey,
  yLabel,
  colors,
}: {
  chartData: any[];
  xKey: string;
  yKey: string;
  yLabel: string;
  colors: string[];
}) => {
  const isMulticolor = colors === COLORS_MULTICOLOR;
  const geoData = useGeoData("/argentina-provinces.json");
  const [tooltip, setTooltip] = React.useState<{
    name: string;
    value: number | null;
    x: number;
    y: number;
  } | null>(null);
  const [hoveredProvince, setHoveredProvince] = React.useState<string | null>(
    null,
  );
  const containerRef = React.useRef<HTMLDivElement>(null);

  const W = 480;
  const H = 680;

  const pathGen = React.useMemo(() => {
    if (!geoData) return null;
    return geoPath(geoMercator().fitSize([W, H], geoData));
  }, [geoData]);

  const getValue = (name: string) =>
    findMatchingValue(name, chartData, xKey, yKey);

  const numericValues = chartData
    .map((d) => {
      const raw = d[yKey];
      if (typeof raw === "number") return raw;
      return parseFloat(
        String(raw)
          .replace(/[^0-9.,%-]/g, "")
          .replace(",", ".")
          .replace("%", ""),
      );
    })
    .filter((v) => !isNaN(v));

  const minVal = numericValues.length ? Math.min(...numericValues) : 0;
  const maxVal = numericValues.length ? Math.max(...numericValues) : 0;

  const colorScale = scaleQuantile<string>()
    .domain(numericValues.length ? numericValues : [0])
    .range(isMulticolor ? MAP_GRADIENT_MULTI : MAP_GRADIENT);

  const matchProvince = (name1: string, name2: string) => {
    if (!name1 || !name2) return false;
    const n1 = normalizeName(name1);
    const n2 = normalizeName(name2);
    if (n1 === n2) return true;
    const aliases1 = PROVINCE_ALIASES[n1] || [];
    if (aliases1.some((a) => normalizeName(a) === n2)) return true;
    const aliases2 = PROVINCE_ALIASES[n2] || [];
    if (aliases2.some((a) => normalizeName(a) === n1)) return true;
    if (n1.length > 3 && n2.length > 3) {
      if (n1.includes(n2) || n2.includes(n1)) return true;
    }
    return false;
  };

  const handleMouseEnter = (
    e: React.MouseEvent,
    name: string,
    value: number | null,
  ) => {
    const rect = containerRef.current?.getBoundingClientRect();
    setTooltip({
      name,
      value,
      x: e.clientX - (rect?.left ?? 0),
      y: e.clientY - (rect?.top ?? 0),
    });
    setHoveredProvince(normalizeName(name));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    setTooltip((prev) =>
      prev
        ? {
            ...prev,
            x: e.clientX - (rect?.left ?? 0),
            y: e.clientY - (rect?.top ?? 0),
          }
        : null,
    );
  };

  const barData = chartData
    .map((d) => {
      const val =
        typeof d[yKey] === "number"
          ? d[yKey]
          : parseFloat(
              String(d[yKey])
                .replace(/[^0-9.,%-]/g, "")
                .replace(",", ".")
                .replace("%", ""),
            );
      const name = String(d[xKey] || "");
      let shortName = name;
      const lowerName = name.toLowerCase();
      if (lowerName.includes("tierra del fuego")) shortName = "T. del Fuego";
      else if (lowerName.includes("santiago del estero"))
        shortName = "S. del Estero";
      else if (
        lowerName.includes("buenos aires") &&
        lowerName.includes("ciudad")
      )
        shortName = "CABA";
      else if (shortName.length > 15)
        shortName = shortName.substring(0, 12) + "...";
      return { ...d, displayValue: val, name, shortName };
    })
    .filter((d) => !isNaN(d.displayValue))
    .sort((a, b) => b.displayValue - a.displayValue);

  if (!geoData || !pathGen) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Cargando mapa...
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
      <div
        ref={containerRef}
        className="relative flex-1 w-full max-w-[500px] mx-auto lg:mx-0"
      >
        {tooltip && (
          <div
            className="pointer-events-none absolute z-10 bg-background border px-3 py-2 rounded shadow-md text-sm"
            style={{ left: tooltip.x + 10, top: tooltip.y - 40 }}
          >
            <p className="font-bold">{tooltip.name}</p>
            {tooltip.value != null ? (
              <p className="text-muted-foreground">
                {yLabel}: {tooltip.value.toLocaleString("es-AR")}
              </p>
            ) : (
              <p className="text-muted-foreground italic">Sin datos</p>
            )}
          </div>
        )}
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: "100%", height: "auto", display: "block" }}
        >
          {geoData.features.map((feature: any, i: number) => {
            const name = feature.properties?.name || "";
            const value = getValue(name);
            const isSantiago = normalizeName(name).includes(
              "santiago del estero",
            );
            const isHovered = hoveredProvince
              ? matchProvince(name, hoveredProvince)
              : false;
            const d = pathGen(feature as any);
            if (!d) return null;
            return (
              <path
                key={i}
                d={d}
                fill={
                  isSantiago
                    ? SANTIAGO_RED
                    : value != null
                      ? colorScale(value)
                      : "#e5e7eb"
                }
                fillOpacity={hoveredProvince ? (isHovered ? 1 : 0.4) : 1}
                stroke={isHovered ? "#333" : "#aaa"}
                strokeWidth={isHovered ? 1.5 : 0.7}
                style={{ cursor: "pointer", outline: "none" }}
                onMouseEnter={(e) => handleMouseEnter(e, name, value)}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => {
                  setTooltip(null);
                  setHoveredProvince(null);
                }}
              />
            );
          })}
        </svg>
        <div className="flex flex-col items-start gap-1 absolute bottom-4 left-0 bg-background/80 p-2 rounded border text-[10px]">
          <span className="font-semibold mb-1">Escala ({yLabel})</span>
          <div className="flex h-3 w-32 rounded overflow-hidden mb-1">
            {(isMulticolor ? MAP_GRADIENT_MULTI : MAP_GRADIENT).map((c) => (
              <div key={c} style={{ background: c, flex: 1 }} />
            ))}
          </div>
          <div className="flex justify-between w-32 text-muted-foreground">
            <span>{minVal.toLocaleString("es-AR")}</span>
            <span>{maxVal.toLocaleString("es-AR")}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full">
        <ResponsiveContainer
          width="100%"
          height={Math.max(barData.length * 22 + 20, 300)}
        >
          <BarChart
            layout="vertical"
            data={barData}
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            onMouseLeave={() => setHoveredProvince(null)}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              strokeOpacity={0.2}
            />
            <XAxis type="number" hide />
            <YAxis
              dataKey="shortName"
              type="category"
              width={80}
              tick={{ fontSize: 10 }}
              interval={0}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "transparent" }}
            />
            <Bar
              dataKey="displayValue"
              name={yLabel}
              radius={[0, 2, 2, 0]}
              barSize={15}
              onMouseEnter={(data) => setHoveredProvince(data.name || null)}
            >
              {barData.map((entry, index) => {
                const isHovered = hoveredProvince
                  ? matchProvince(entry.name, hoveredProvince)
                  : false;
                const isSantiago = normalizeName(entry.name).includes(
                  "santiago del estero",
                );
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      isSantiago
                        ? SANTIAGO_RED
                        : isMulticolor
                          ? COLORS_MULTICOLOR[index % COLORS_MULTICOLOR.length]
                          : colorScale(entry.displayValue)
                    }
                    fillOpacity={hoveredProvince ? (isHovered ? 1 : 0.4) : 1}
                    stroke={isHovered ? "#333" : "none"}
                    strokeWidth={1}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const MapSantiago = ({
  chartData,
  xKey,
  yKey,
  yLabel,
  colors,
}: {
  chartData: any[];
  xKey: string;
  yKey: string;
  yLabel: string;
  colors: string[];
}) => {
  const isMulticolor = colors === COLORS_MULTICOLOR;
  const geoData = useGeoData("/santiago-del-estero-departamentos.json");
  const [tooltip, setTooltip] = React.useState<{
    name: string;
    value: number | null;
    x: number;
    y: number;
  } | null>(null);
  const [hoveredDept, setHoveredDept] = React.useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const W = 480;
  const H = 560;

  const pathGen = React.useMemo(() => {
    if (!geoData) return null;
    return geoPath(geoMercator().fitSize([W, H], geoData));
  }, [geoData]);

  const getValue = (name: string) => {
    const norm = normalizeName(name);
    for (const row of chartData) {
      const xNorm = normalizeName(String(row[xKey] || ""));
      if (
        xNorm === norm ||
        (xNorm.length > 3 && norm.includes(xNorm)) ||
        (norm.length > 3 && xNorm.includes(norm))
      ) {
        const val = parseFloat(
          String(row[yKey] || "")
            .replace(/[^0-9.,%-]/g, "")
            .replace("%", "")
            .replace(",", "."),
        );
        if (!isNaN(val)) return val;
      }
    }
    return null;
  };

  const numericValues = chartData
    .map((d) => {
      const raw = d[yKey];
      if (typeof raw === "number") return raw;
      return parseFloat(
        String(raw)
          .replace(/[^0-9.,%-]/g, "")
          .replace(",", ".")
          .replace("%", ""),
      );
    })
    .filter((v) => !isNaN(v));

  const minVal = numericValues.length ? Math.min(...numericValues) : 0;
  const maxVal = numericValues.length ? Math.max(...numericValues) : 0;

  const colorScale = scaleQuantile<string>()
    .domain(numericValues.length ? numericValues : [0])
    .range(isMulticolor ? MAP_GRADIENT_MULTI : MAP_GRADIENT);

  const handleMouseEnter = (
    e: React.MouseEvent,
    name: string,
    value: number | null,
  ) => {
    const rect = containerRef.current?.getBoundingClientRect();
    setTooltip({
      name,
      value,
      x: e.clientX - (rect?.left ?? 0),
      y: e.clientY - (rect?.top ?? 0),
    });
    setHoveredDept(normalizeName(name));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    setTooltip((prev) =>
      prev
        ? {
            ...prev,
            x: e.clientX - (rect?.left ?? 0),
            y: e.clientY - (rect?.top ?? 0),
          }
        : null,
    );
  };

  const barData = chartData
    .map((d) => {
      const val =
        typeof d[yKey] === "number"
          ? d[yKey]
          : parseFloat(
              String(d[yKey])
                .replace(/[^0-9.,%-]/g, "")
                .replace(",", ".")
                .replace("%", ""),
            );
      const name = String(d[xKey] || "");
      const shortName = name.length > 14 ? name.substring(0, 12) + "…" : name;
      return { ...d, displayValue: val, name, shortName };
    })
    .filter((d) => !isNaN(d.displayValue))
    .sort((a, b) => b.displayValue - a.displayValue);

  if (!geoData || !pathGen) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Cargando mapa...
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
      <div
        ref={containerRef}
        className="relative flex-1 w-full max-w-[500px] mx-auto lg:mx-0"
      >
        {tooltip && (
          <div
            className="pointer-events-none absolute z-10 bg-background border px-3 py-2 rounded shadow-md text-sm"
            style={{ left: tooltip.x + 10, top: tooltip.y - 40 }}
          >
            <p className="font-bold">{tooltip.name}</p>
            {tooltip.value != null ? (
              <p className="text-muted-foreground">
                {yLabel}: {tooltip.value.toLocaleString("es-AR")}
              </p>
            ) : (
              <p className="text-muted-foreground italic">Sin datos</p>
            )}
          </div>
        )}
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: "100%", height: "auto", display: "block" }}
        >
          {geoData.features.map((feature: any, i: number) => {
            const name = feature.properties?.nam || "";
            const value = getValue(name);
            const isHovered = hoveredDept === normalizeName(name);
            const d = pathGen(feature as any);
            if (!d) return null;
            return (
              <path
                key={i}
                d={d}
                fill={value != null ? colorScale(value) : "#e5e7eb"}
                fillOpacity={hoveredDept ? (isHovered ? 1 : 0.5) : 1}
                stroke={isHovered ? "#333" : "#aaa"}
                strokeWidth={isHovered ? 1.5 : 0.5}
                style={{ cursor: "pointer", outline: "none" }}
                onMouseEnter={(e) => handleMouseEnter(e, name, value)}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => {
                  setTooltip(null);
                  setHoveredDept(null);
                }}
              />
            );
          })}
        </svg>
        <div className="flex flex-col items-start gap-1 absolute bottom-4 left-0 bg-background/80 p-2 rounded border text-[10px]">
          <span className="font-semibold mb-1">Escala ({yLabel})</span>
          <div className="flex h-3 w-32 rounded overflow-hidden mb-1">
            {(isMulticolor ? MAP_GRADIENT_MULTI : MAP_GRADIENT).map((c) => (
              <div key={c} style={{ background: c, flex: 1 }} />
            ))}
          </div>
          <div className="flex justify-between w-32 text-muted-foreground">
            <span>{minVal.toLocaleString("es-AR")}</span>
            <span>{maxVal.toLocaleString("es-AR")}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full">
        <ResponsiveContainer
          width="100%"
          height={Math.max(barData.length * 22 + 20, 300)}
        >
          <BarChart
            layout="vertical"
            data={barData}
            margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
            onMouseLeave={() => setHoveredDept(null)}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              strokeOpacity={0.2}
            />
            <XAxis type="number" hide />
            <YAxis
              dataKey="shortName"
              type="category"
              width={90}
              tick={{ fontSize: 10 }}
              interval={0}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "transparent" }}
            />
            <Bar
              dataKey="displayValue"
              name={yLabel}
              radius={[0, 2, 2, 0]}
              barSize={13}
              onMouseEnter={(data) =>
                setHoveredDept(normalizeName(data.name || ""))
              }
            >
              {barData.map((entry, index) => {
                const isHovered = hoveredDept === normalizeName(entry.name);
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      isMulticolor
                        ? COLORS_MULTICOLOR[index % COLORS_MULTICOLOR.length]
                        : colorScale(entry.displayValue)
                    }
                    fillOpacity={hoveredDept ? (isHovered ? 1 : 0.4) : 1}
                    stroke={isHovered ? "#333" : "none"}
                    strokeWidth={1}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
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
  if (
    config?.colors &&
    Array.isArray(config.colors) &&
    config.colors.length > 0
  ) {
    colors = config.colors;
  }

  const yKeyString = config?.eje_valores || "";
  const yKeys = yKeyString.includes(",")
    ? yKeyString
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean)
    : [];
  const hasMultipleYKeys = yKeys.length > 1;

  const xKey = getDataKey(columns, config?.eje_principal) || columns[0]?.id;
  const yKey = hasMultipleYKeys
    ? yKeys[0]
    : getDataKey(columns, config?.eje_valores) || columns[1]?.id;
  const secondaryKey = getDataKey(columns, config?.eje_secundario);

  const getColumnHeader = (colId: string | undefined) => {
    if (!colId) return "Y";
    const col = columns.find((c) => c.id === colId);
    return col?.header || colId;
  };

  const yLabel = getColumnHeader(yKey);

  if (!xKey || !yKey) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Configuración de ejes incompleta
      </div>
    );
  }

  const commonProps = {
    data: chartData,
    margin: { top: 20, right: 30, left: 20, bottom: 5 },
  };

  switch (type) {
    case "bar_chart":
      return (
        <ResponsiveContainer
          width="100%"
          height={Math.max(chartData.length * 25, 300)}
        >
          <BarChart layout="vertical" {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" vertical horizontal={false} />
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
            {hasMultipleYKeys ? (
              yKeys.map((yk, idx) => (
                <Bar
                  key={yk}
                  dataKey={yk}
                  name={getColumnHeader(yk)}
                  radius={[0, 4, 4, 0]}
                  fill={
                    normalizeName(getColumnHeader(yk)).includes(
                      "santiago del estero",
                    )
                      ? SANTIAGO_RED
                      : colors[idx % colors.length]
                  }
                  barSize={15}
                />
              ))
            ) : (
              <Bar
                dataKey={yKey}
                name={yLabel}
                radius={[0, 4, 4, 0]}
                fill={getItemColor(yLabel, 0, colors)}
                barSize={20}
              >
                {!secondaryKey &&
                  chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getItemColor(entry[xKey], index, colors)}
                    />
                  ))}
              </Bar>
            )}
            {secondaryKey && !hasMultipleYKeys && (
              <Bar
                dataKey={secondaryKey}
                name={getColumnHeader(secondaryKey)}
                radius={[0, 4, 4, 0]}
                fill={getItemColor(getColumnHeader(secondaryKey), 1, colors)}
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
            {hasMultipleYKeys ? (
              yKeys.map((yk, idx) => (
                <Bar
                  key={yk}
                  dataKey={yk}
                  name={getColumnHeader(yk)}
                  radius={[4, 4, 0, 0]}
                  fill={
                    normalizeName(getColumnHeader(yk)).includes(
                      "santiago del estero",
                    )
                      ? SANTIAGO_RED
                      : colors[idx % colors.length]
                  }
                  barSize={20}
                />
              ))
            ) : (
              <Bar
                dataKey={yKey}
                name={yLabel}
                radius={[4, 4, 0, 0]}
                fill={getItemColor(yLabel, 0, colors)}
                barSize={20}
              >
                {!secondaryKey &&
                  chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getItemColor(entry[xKey], index, colors)}
                    />
                  ))}
              </Bar>
            )}
            {secondaryKey && !hasMultipleYKeys && (
              <Bar
                dataKey={secondaryKey}
                name={getColumnHeader(secondaryKey)}
                radius={[4, 4, 0, 0]}
                fill={getItemColor(getColumnHeader(secondaryKey), 1, colors)}
                barSize={20}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      );

    case "stacked_bar_chart":
      return (
        <ResponsiveContainer
          width="100%"
          height={Math.max(chartData.length * 25, 300)}
        >
          <BarChart layout="vertical" {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" vertical horizontal={false} />
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
            {hasMultipleYKeys ? (
              yKeys.map((yk, idx) => (
                <Bar
                  key={yk}
                  dataKey={yk}
                  name={getColumnHeader(yk)}
                  stackId="a"
                  fill={
                    normalizeName(getColumnHeader(yk)).includes(
                      "santiago del estero",
                    )
                      ? SANTIAGO_RED
                      : colors[idx % colors.length]
                  }
                  barSize={20}
                />
              ))
            ) : (
              <>
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
                    name={getColumnHeader(secondaryKey)}
                    stackId="a"
                    fill={getItemColor(
                      getColumnHeader(secondaryKey),
                      1,
                      colors,
                    )}
                    barSize={20}
                  />
                )}
              </>
            )}
          </BarChart>
        </ResponsiveContainer>
      );

    case "tornado_chart": {
      const yKey1 = yKey;
      const yKey2 = yKeys[1] || secondaryKey;
      if (!yKey2) {
        return (
          <div className="p-8 text-center bg-muted/20 border-2 border-dashed rounded-lg italic text-muted-foreground">
            El gráfico tornado requiere al menos dos métricas (ej. Santiago y
            Argentina)
          </div>
        );
      }

      const tornadoData = chartData.map((d) => ({
        ...d,
        leftValue: -Math.abs(d[yKey1] || 0),
        rightValue: Math.abs(d[yKey2] || 0),
      }));

      const labelLeft = getColumnHeader(yKey1);
      const labelRight = getColumnHeader(yKey2);

      return (
        <ResponsiveContainer
          width="100%"
          height={Math.max(chartData.length * 30, 400)}
        >
          <BarChart
            data={tornadoData}
            layout="vertical"
            stackOffset="sign"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" hide />
            <YAxis
              dataKey={xKey}
              type="category"
              width={120}
              tick={{ fontSize: 10 }}
            />
            <Tooltip
              content={<CustomTooltip />}
              formatter={(value: any, name: any) => [
                Math.abs(Number(value) || 0),
                name,
              ]}
            />
            <Legend />
            <Bar
              dataKey="leftValue"
              name={labelLeft}
              fill={
                normalizeName(labelLeft).includes("santiago del estero")
                  ? SANTIAGO_RED
                  : colors[0]
              }
              stackId="stack"
            />
            <Bar
              dataKey="rightValue"
              name={labelRight}
              fill={
                normalizeName(labelRight).includes("santiago del estero")
                  ? SANTIAGO_RED
                  : colors[1] || "#2563eb"
              }
              stackId="stack"
            />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    case "pie_chart":
    case "donut_chart": {
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
              innerRadius={isDonut ? 70 : 0}
              outerRadius={100}
              fill="#8884d8"
              label={({ name, percent }: any) =>
                `${name || ""} ${((percent || 0) * 100).toFixed(0)}%`
              }
              labelLine
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getItemColor(entry[xKey], index, colors)}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    case "radar_chart":
      return (
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis
              dataKey={xKey}
              tick={{ fontSize: 10, fill: "#64748b" }}
            />
            <PolarRadiusAxis />
            {hasMultipleYKeys ? (
              yKeys.map((yk, idx) => (
                <Radar
                  key={yk}
                  name={getColumnHeader(yk)}
                  dataKey={yk}
                  stroke={
                    normalizeName(getColumnHeader(yk)).includes(
                      "santiago del estero",
                    )
                      ? SANTIAGO_RED
                      : colors[idx % colors.length]
                  }
                  fill={
                    normalizeName(getColumnHeader(yk)).includes(
                      "santiago del estero",
                    )
                      ? SANTIAGO_RED
                      : colors[idx % colors.length]
                  }
                  fillOpacity={0.4}
                />
              ))
            ) : (
              <Radar
                name={yLabel}
                dataKey={yKey}
                stroke={SANTIAGO_RED}
                fill={SANTIAGO_RED}
                fillOpacity={0.6}
              />
            )}
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      );

    case "treemap_chart":
      return (
        <ResponsiveContainer width="100%" height={400}>
          <Treemap
            data={chartData}
            dataKey={yKey}
            nameKey={xKey}
            stroke="#fff"
            fill={colors[0]}
          >
            <Tooltip />
          </Treemap>
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
            <Legend />
            {hasMultipleYKeys ? (
              yKeys.map((yk, idx) => {
                const label = getColumnHeader(yk);
                const isSantiago = normalizeName(label).includes(
                  "santiago del estero",
                );
                return (
                  <Line
                    key={yk}
                    type={idx === 0 ? "monotone" : "linear"}
                    dataKey={yk}
                    name={label}
                    stroke={
                      isSantiago ? SANTIAGO_RED : colors[idx % colors.length]
                    }
                    strokeWidth={isSantiago ? 3 : 2}
                    activeDot={{ r: 8 }}
                  />
                );
              })
            ) : (
              <Line
                type="monotone"
                dataKey={yKey}
                name={yLabel}
                stroke={getItemColor(yLabel, 0, colors)}
                strokeWidth={2}
                activeDot={{ r: 8 }}
              />
            )}
            {secondaryKey && !hasMultipleYKeys && (
              <Line
                type="linear"
                dataKey={secondaryKey}
                name={getColumnHeader(secondaryKey)}
                stroke={getItemColor(getColumnHeader(secondaryKey), 1, colors)}
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
            <Legend />
            {hasMultipleYKeys ? (
              yKeys.map((yk, idx) => {
                const label = getColumnHeader(yk);
                const isSantiago = normalizeName(label).includes(
                  "santiago del estero",
                );
                return (
                  <Area
                    key={yk}
                    type={idx === 0 ? "monotone" : "linear"}
                    dataKey={yk}
                    name={label}
                    stroke={
                      isSantiago ? SANTIAGO_RED : colors[idx % colors.length]
                    }
                    fill={
                      isSantiago ? SANTIAGO_RED : colors[idx % colors.length]
                    }
                    fillOpacity={0.3}
                  />
                );
              })
            ) : (
              <Area
                type="monotone"
                dataKey={yKey}
                name={yLabel}
                stroke={getItemColor(yLabel, 0, colors)}
                fill={getItemColor(yLabel, 0, colors)}
                fillOpacity={0.3}
              />
            )}
            {secondaryKey && !hasMultipleYKeys && (
              <Area
                type="linear"
                dataKey={secondaryKey}
                name={getColumnHeader(secondaryKey)}
                stroke={getItemColor(getColumnHeader(secondaryKey), 1, colors)}
                fill={getItemColor(getColumnHeader(secondaryKey), 1, colors)}
                fillOpacity={0.3}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      );

    case "choropleth_map": {
      // Auto-detect: if x-column header contains "departamento" or values match
      // known SDE department names → show SDE map; otherwise show Argentina map
      const xCol = columns.find((c: any) => c.id === xKey);
      const xHeaderNorm = normalizeName(xCol?.header || "");
      const SDE_DEPT_ONLY = [
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
      const isDeptos =
        xHeaderNorm.includes("departamento") ||
        chartData.some((d) => {
          const val = normalizeName(String(d[xKey] || ""));
          return SDE_DEPT_ONLY.some((k) => val === k || val.includes(k));
        });
      if (isDeptos) {
        return (
          <MapSantiago
            chartData={chartData}
            xKey={xKey}
            yKey={yKey}
            yLabel={getColumnHeader(yKey)}
            colors={colors}
          />
        );
      }
      return (
        <MapArgentina
          chartData={chartData}
          xKey={xKey}
          yKey={yKey}
          yLabel={getColumnHeader(yKey)}
          colors={colors}
        />
      );
    }

    case "map_argentina":
      return (
        <MapArgentina
          chartData={chartData}
          xKey={xKey}
          yKey={yKey}
          yLabel={getColumnHeader(yKey)}
          colors={colors}
        />
      );

    case "map_santiago":
    case "map_santiago_del_estero":
      return (
        <MapSantiago
          chartData={chartData}
          xKey={xKey}
          yKey={yKey}
          yLabel={getColumnHeader(yKey)}
          colors={colors}
        />
      );

    default:
      return (
        <div className="p-8 text-center bg-muted/20 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground italic mb-2">
            Visualización &quot;{type}&quot; en desarrollo.
          </p>
        </div>
      );
  }
};

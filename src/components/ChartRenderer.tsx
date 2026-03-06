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
  ScatterChart,
  Scatter,
  ZAxis,
  ComposedChart,
  RadialBarChart,
  RadialBar,
} from "recharts";
import { ArrowUpDown, ArrowUp, ArrowDown, Search, X } from "lucide-react";
import { scaleQuantile } from "d3-scale";
import { geoMercator, geoPath } from "d3-geo";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  SortingState,
  ColumnDef,
} from "@tanstack/react-table";
import { useState, useMemo } from "react";
import Plot from "react-plotly.js";

// Color Palettes
const COLORS_DEFAULT = [
  "#c95b4a", // Primary red
  "#4d5f7a", // Slate blue
  "#b08f51", // Muted gold/orange
  "#518765", // Soft pine green
  "#8a597a", // Muted purple/rose
];
const COLORS_SLATE = ["#262624", "#3d3d3a", "#64748b", "#94a3b8", "#cbd5e1"];
const COLORS_SEMAPHORE = ["#16a34a", "#ca8a04", "#c95b4a"];
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

const SANTIAGO_RED = "#c95b4a";
const DEFAULT_BAR = "#64748b"; // Slate 500 for better contrast in both modes

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
  forceColors: boolean = false,
) => {
  const strName = String(name || "").toLowerCase();
  const isSantiago = strName.includes("santiago del estero");

  if (isSantiago) {
    return SANTIAGO_RED;
  }

  if (palette === COLORS_DEFAULT && !forceColors) {
    return DEFAULT_BAR;
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
  fuentes?: string;
  notas?: string;
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

// Advanced Table component (must be a component to use hooks)
const AdvancedTableChart = ({
  chartData,
  columns,
}: {
  chartData: any[];
  columns: any[];
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const tableColumns = useMemo<ColumnDef<any, any>[]>(
    () =>
      columns.map((col: any) => ({
        accessorKey: col.id,
        header: ({ column }: any) => {
          const isSorted = column.getIsSorted();
          return (
            <button
              className="flex items-center gap-1 font-semibold hover:text-primary"
              onClick={() =>
                column.toggleSorting(isSorted === "asc" ? false : true)
              }
            >
              {col.header}
              {isSorted === "asc" ? (
                <ArrowUp className="h-3 w-3" />
              ) : isSorted === "desc" ? (
                <ArrowDown className="h-3 w-3" />
              ) : (
                <ArrowUpDown className="h-3 w-3 opacity-30" />
              )}
            </button>
          );
        },
        cell: ({ getValue }: any) => {
          const val = getValue();
          return typeof val === "number"
            ? val.toLocaleString("es-AR")
            : String(val ?? "");
        },
      })),
    [columns],
  );

  const tableData = useMemo(
    () =>
      chartData.map((row: any) => {
        const newRow: any = {};
        columns.forEach((col: any) => {
          newRow[col.id] = row[col.id];
        });
        return newRow;
      }),
    [chartData, columns],
  );

  const table = useReactTable({
    data: tableData,
    columns: tableColumns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar en la tabla..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full pl-10 pr-10 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {globalFilter && (
          <button
            onClick={() => setGlobalFilter("")}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 text-left">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-muted-foreground text-right">
        {table.getFilteredRowModel().rows.length} filas
      </div>
    </div>
  );
};

// Custom KPI Card component
const KPICard = ({
  value,
  label,
  unit,
}: {
  value: any;
  label: string;
  unit?: string;
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-card border rounded-xl shadow-sm h-full min-h-[250px] animate-in zoom-in duration-500">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 text-center">
        {label}
      </h3>
      <div className="flex items-baseline gap-1">
        <span className="text-6xl font-black tracking-tighter text-primary">
          {typeof value === "number" ? value.toLocaleString("es-AR") : value}
        </span>
        {unit && (
          <span className="text-xl font-bold text-muted-foreground">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
};

// Simplified Waterfall Chart using regular BarChart
const WaterfallChart = ({ data, xKey, yKey, colors }: any) => {
  const waterfallData = data.reduce((acc: any[], d: any) => {
    const val = Number(d[yKey]) || 0;
    const start = acc.length > 0 ? acc[acc.length - 1].end : 0;
    const end = start + val;
    acc.push({
      ...d,
      displayValue: val,
      start,
      end,
      range: [start, end],
    });
    return acc;
  }, []);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={waterfallData}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xKey} />
        <YAxis />
        <Tooltip
          formatter={(value: any, name: any, props: any) => [
            props.payload.displayValue.toLocaleString("es-AR"),
            name,
          ]}
        />
        <Bar dataKey="range" name={yKey} fill={colors[0]} radius={[4, 4, 0, 0]}>
          {waterfallData.map((entry: any, index: number) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.displayValue >= 0 ? "#16a34a" : "#c95b4a"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
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
  "#fdf4f3",
  "#f5c8c3",
  "#e8958d",
  "#db6358",
  "#c95b4a",
  "#a8433a",
  "#862e27",
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
            const isHovered = hoveredProvince
              ? matchProvince(name, hoveredProvince)
              : false;
            const d = pathGen(feature as any);
            if (!d) return null;
            return (
              <path
                key={i}
                d={d}
                fill={value != null ? colorScale(value) : "#e5e7eb"}
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
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      isMulticolor
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

  const renderChart = () => {
    switch (type) {
      case "bar_chart":
        return (
          <ResponsiveContainer
            width="100%"
            height={Math.max(chartData.length * 25, 300)}
          >
            <BarChart layout="vertical" {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
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

      case "column_chart": {
        const manyCategories = chartData.length > 8;
        return (
          <ResponsiveContainer width="100%" height={manyCategories ? 460 : 400}>
            <BarChart
              {...commonProps}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: manyCategories ? 80 : 20,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey={xKey}
                tick={{ fontSize: manyCategories ? 10 : 12 }}
                angle={manyCategories ? -40 : 0}
                textAnchor={manyCategories ? "end" : "middle"}
                interval={0}
              />
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
      }

      case "stacked_bar_chart":
        return (
          <ResponsiveContainer
            width="100%"
            height={Math.max(chartData.length * 25, 300)}
          >
            <BarChart layout="vertical" {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
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
              <XAxis
                type="number"
                tickFormatter={(value) =>
                  Math.abs(value).toLocaleString("es-AR")
                }
              />
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
                    fill={getItemColor(entry[xKey], index, colors, true)}
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
                  stroke={colors[0]}
                  fill={colors[0]}
                  fillOpacity={0.5}
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
                  stroke={getItemColor(
                    getColumnHeader(secondaryKey),
                    1,
                    colors,
                  )}
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
                  stroke={getItemColor(
                    getColumnHeader(secondaryKey),
                    1,
                    colors,
                  )}
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

      case "gauge_chart": {
        const value = Number(chartData[0]?.[yKey]) || 0;
        // Detect if value is a percentage: use 100 as max; otherwise use max from all rows
        const allValues = chartData
          .map((d) => Number(d[yKey]) || 0)
          .filter((v) => !isNaN(v));
        const maxDataVal = allValues.length ? Math.max(...allValues) : 100;
        // If value ≤ 100 and the column name suggests percentage, treat as %
        const isPercent = value <= 100 && maxDataVal <= 100;
        const target = isPercent ? 100 : maxDataVal;
        const displayValue = isPercent
          ? `${value.toLocaleString("es-AR")}%`
          : value.toLocaleString("es-AR");
        const gaugeData = [
          { name: "Value", value: value, fill: colors[0] },
          {
            name: "Remaining",
            value: Math.max(0, target - value),
            fill: "#e2e8f0",
          },
        ];
        return (
          <div className="flex flex-col items-center justify-center h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gaugeData}
                  cx="50%"
                  cy="100%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={0}
                  dataKey="value"
                >
                  {gaugeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: any, name: any) =>
                    name === "Value" ? [displayValue, yLabel] : null
                  }
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="text-4xl font-black -mt-16 text-primary">
              {displayValue}
            </div>
            <div className="text-sm font-medium text-muted-foreground mt-2 uppercase tracking-widest">
              {yLabel}
            </div>
          </div>
        );
      }

      case "kpi_card": {
        // Show up to 5 KPIs — one per row, using the label from xKey and value from yKey
        const kpiRows = chartData.slice(0, 5);
        if (kpiRows.length === 1) {
          return (
            <KPICard
              value={kpiRows[0]?.[yKey]}
              label={xKey ? String(kpiRows[0]?.[xKey] || yLabel) : yLabel}
              unit={""}
            />
          );
        }
        return (
          <div
            className={`grid gap-4 ${kpiRows.length <= 2 ? "grid-cols-2" : kpiRows.length === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"}`}
          >
            {kpiRows.map((row, i) => (
              <KPICard
                key={i}
                value={row?.[yKey]}
                label={xKey ? String(row?.[xKey] || yLabel) : yLabel}
                unit={""}
              />
            ))}
          </div>
        );
      }

      case "waterfall_chart":
        return (
          <WaterfallChart
            data={chartData}
            xKey={xKey}
            yKey={yKey}
            colors={colors}
          />
        );

      case "scatter_chart":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} name={getColumnHeader(xKey)} />
              <YAxis dataKey={yKey} name={yLabel} />
              <ZAxis range={[60, 400]} />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Legend />
              <Scatter
                name={yLabel}
                data={chartData}
                fill={colors[0]}
                line
                shape="circle"
              />
              {secondaryKey && (
                <Scatter
                  name={getColumnHeader(secondaryKey)}
                  data={chartData}
                  fill={colors[1]}
                  shape="triangle"
                />
              )}
            </ScatterChart>
          </ResponsiveContainer>
        );

      case "radial_bar_chart":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="10%"
              outerRadius="80%"
              barSize={20}
              data={chartData}
            >
              <RadialBar
                label={{ position: "insideStart", fill: "#fff", fontSize: 10 }}
                background
                dataKey={yKey}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getItemColor(entry[xKey], index, colors, true)}
                  />
                ))}
              </RadialBar>
              <Legend
                iconSize={10}
                layout="vertical"
                verticalAlign="middle"
                align="right"
              />
              <Tooltip />
            </RadialBarChart>
          </ResponsiveContainer>
        );

      case "composed_chart":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey={xKey} />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                dataKey={yKey}
                name={yLabel}
                fill={colors[0]}
                radius={[4, 4, 0, 0]}
                barSize={40}
              />
              {secondaryKey && (
                <Line
                  type="monotone"
                  dataKey={secondaryKey}
                  name={getColumnHeader(secondaryKey)}
                  stroke={colors[1] || SANTIAGO_RED}
                  strokeWidth={3}
                  dot={{ r: 6 }}
                />
              )}
              {yKeys.slice(2).map((yk, idx) => (
                <Area
                  key={yk}
                  type="monotone"
                  dataKey={yk}
                  name={getColumnHeader(yk)}
                  fill={colors[(idx + 2) % colors.length]}
                  stroke={colors[(idx + 2) % colors.length]}
                  fillOpacity={0.1}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        );

      case "sunburst_chart": {
        const sunburstData = chartData.map((d) => ({
          id: String(d[xKey]),
          value: Number(d[yKey]) || 0,
          color: getItemColor(d[xKey], chartData.indexOf(d), colors, true),
        }));
        return (
          <div className="h-[500px] w-full">
            <Plot
              data={[
                {
                  type: "sunburst",
                  labels: sunburstData.map((d) => d.id),
                  parents: sunburstData.map(() => ""),
                  values: sunburstData.map((d) => d.value),
                  marker: { colors: sunburstData.map((d) => d.color) },
                  textinfo: "label+percent parent",
                  hoverinfo: "label+value+percent",
                },
              ]}
              layout={{
                margin: { t: 20, l: 20, r: 20, b: 20 },
                height: 480,
              }}
              config={{ displayModeBar: false }}
              useResizeHandler={true}
              style={{ width: "100%", height: "100%" }}
            />
          </div>
        );
      }

      case "heatmap_chart": {
        // Build 2D matrix: rows = numeric columns, columns = xKey categories
        const numericHeatCols = columns.filter(
          (c: any) =>
            c.id !== xKey && chartData.some((d) => typeof d[c.id] === "number"),
        );
        const heatCols =
          numericHeatCols.length > 0
            ? numericHeatCols
            : [columns.find((c: any) => c.id === yKey)].filter(Boolean);
        const zMatrix = heatCols.map((col: any) =>
          chartData.map((d) => Number(d[col.id]) || 0),
        );
        const yHeatLabels = heatCols.map((c: any) => c.header || c.id);
        const xHeatLabels = chartData.map((d) => String(d[xKey]));
        const heatHeight = Math.max(300, heatCols.length * 40 + 100);
        return (
          <div className="w-full" style={{ height: heatHeight }}>
            <Plot
              data={[
                {
                  type: "heatmap",
                  z: zMatrix,
                  x: xHeatLabels,
                  y: yHeatLabels,
                  colorscale: "Reds",
                  showscale: true,
                  hoverongaps: false,
                },
              ]}
              layout={{
                margin: { t: 40, l: 120, r: 40, b: 80 },
                height: heatHeight - 20,
                xaxis: { tickangle: -45 },
              }}
              config={{ displayModeBar: false }}
              useResizeHandler={true}
              style={{ width: "100%", height: "100%" }}
            />
          </div>
        );
      }

      case "sankey_chart": {
        // Use xKey as source, secondaryKey (or columns[1]) as target, yKey as value
        const targetKey =
          secondaryKey ||
          columns.find((c: any) => c.id !== xKey && c.id !== yKey)?.id;
        if (!targetKey) {
          return (
            <div className="p-8 text-center bg-muted/20 border-2 border-dashed rounded-lg italic text-muted-foreground">
              Sankey requiere columnas: origen, destino y valor (eje_principal,
              eje_secundario, eje_valores)
            </div>
          );
        }

        // Build unique node list preserving order (sources first, then targets)
        const nodeSet = new Set<string>();
        chartData.forEach((d) => {
          nodeSet.add(String(d[xKey] ?? ""));
          nodeSet.add(String(d[targetKey] ?? ""));
        });
        const nodeList = Array.from(nodeSet).filter(Boolean);

        const sankeySourceIndices: number[] = [];
        const sankeyTargetIndices: number[] = [];
        const sankeyValues: number[] = [];

        chartData.forEach((d) => {
          const src = String(d[xKey] ?? "");
          const tgt = String(d[targetKey] ?? "");
          const val = Number(d[yKey]) || 0;
          const srcIdx = nodeList.indexOf(src);
          const tgtIdx = nodeList.indexOf(tgt);
          if (srcIdx !== -1 && tgtIdx !== -1 && val > 0 && srcIdx !== tgtIdx) {
            sankeySourceIndices.push(srcIdx);
            sankeyTargetIndices.push(tgtIdx);
            sankeyValues.push(val);
          }
        });

        if (sankeyValues.length === 0) {
          return (
            <div className="p-8 text-center bg-muted/20 border-2 border-dashed rounded-lg italic text-muted-foreground">
              No hay flujos válidos para el gráfico Sankey
            </div>
          );
        }

        return (
          <div className="h-[500px] w-full">
            <Plot
              data={[
                {
                  type: "sankey",
                  orientation: "h",
                  node: {
                    pad: 15,
                    thickness: 20,
                    label: nodeList,
                    color: nodeList.map((_, i) => colors[i % colors.length]),
                  },
                  link: {
                    source: sankeySourceIndices,
                    target: sankeyTargetIndices,
                    value: sankeyValues,
                  },
                },
              ]}
              layout={{
                margin: { t: 20, l: 20, r: 20, b: 20 },
                height: 480,
                font: { size: 10 },
              }}
              config={{ displayModeBar: false }}
            />
          </div>
        );
      }

      case "bubble_plotly": {
        // x: use numeric value if available, else use row index (for categorical xKey)
        const xNumeric = chartData.every((d) => typeof d[xKey] === "number");
        const bubbleX = xNumeric
          ? chartData.map((d) => Number(d[xKey]) || 0)
          : chartData.map((_, i) => i);
        const bubbleXLabels = chartData.map((d) => String(d[xKey]));
        const bubbleY = chartData.map((d) => Number(d[yKey]) || 0);
        // Scale bubble sizes relative to the data range to avoid extreme sizes
        const rawSizes = chartData.map((d) =>
          secondaryKey ? Number(d[secondaryKey]) || 1 : 1,
        );
        const maxRawSize = Math.max(...rawSizes.map(Math.abs), 1);
        const bubbleSize = rawSizes.map((s) =>
          Math.max(8, (Math.abs(s) / maxRawSize) * 60 + 8),
        );
        return (
          <div className="h-[450px] w-full">
            <Plot
              data={[
                {
                  type: "scatter",
                  mode: "markers",
                  x: bubbleX,
                  y: bubbleY,
                  marker: {
                    size: bubbleSize,
                    color: colors.map((c, i) => colors[i % colors.length]),
                    sizemode: "diameter",
                  },
                  text: bubbleXLabels,
                  hovertemplate:
                    "<b>%{text}</b><br>" + yLabel + ": %{y}<extra></extra>",
                },
              ]}
              layout={{
                margin: { t: 40, l: 60, r: 40, b: 60 },
                height: 430,
                xaxis: xNumeric
                  ? { title: getColumnHeader(xKey) }
                  : {
                      tickvals: bubbleX,
                      ticktext: bubbleXLabels,
                      title: getColumnHeader(xKey),
                    },
                yaxis: { title: yLabel },
              }}
              config={{ displayModeBar: false }}
            />
          </div>
        );
      }

      case "treemap_plotly": {
        const treemapLabels = chartData.map((d) => String(d[xKey]));
        const treemapValues = chartData.map((d) => Number(d[yKey]) || 0);
        return (
          <div className="h-[450px] w-full">
            <Plot
              data={[
                {
                  type: "treemap",
                  labels: treemapLabels,
                  parents: treemapLabels.map(() => ""),
                  values: treemapValues,
                  textinfo: "label+value+percent parent",
                  marker: {
                    colors: treemapValues,
                    colorscale: "Reds",
                    showscale: false,
                  },
                },
              ]}
              layout={{
                margin: { t: 20, l: 20, r: 20, b: 20 },
                height: 430,
              }}
              config={{ displayModeBar: false }}
            />
          </div>
        );
      }

      case "funnel_chart": {
        return (
          <div className="h-[450px] w-full">
            <Plot
              data={[
                {
                  type: "funnel",
                  y: chartData.map((d) => String(d[xKey])),
                  x: chartData.map((d) => Number(d[yKey]) || 0),
                  textinfo: "value+percent initial",
                  marker: { color: colors[0] },
                },
              ]}
              layout={{
                margin: { t: 40, l: 120, r: 40, b: 40 },
                height: 430,
              }}
              config={{ displayModeBar: false }}
            />
          </div>
        );
      }

      case "polar_chart": {
        return (
          <div className="h-[450px] w-full">
            <Plot
              data={[
                {
                  type: "barpolar",
                  r: chartData.map((d) => Number(d[yKey]) || 0),
                  theta: chartData.map((d) => String(d[xKey])),
                  marker: {
                    color: chartData.map((_, i) => colors[i % colors.length]),
                  },
                },
              ]}
              layout={{
                margin: { t: 40, l: 40, r: 40, b: 40 },
                height: 430,
                polar: { bgcolor: "white" },
              }}
              config={{ displayModeBar: false }}
            />
          </div>
        );
      }

      case "box_plot": {
        return (
          <div className="h-[450px] w-full">
            <Plot
              data={[
                {
                  type: "box",
                  y: chartData.map((d) => Number(d[yKey]) || 0),
                  name: yLabel,
                  marker: { color: colors[0] },
                  boxpoints: "all",
                  jitter: 0.3,
                  pointpos: -1.8,
                },
              ]}
              layout={{
                margin: { t: 40, l: 60, r: 40, b: 60 },
                height: 430,
                showlegend: false,
              }}
              config={{ displayModeBar: false }}
              useResizeHandler={true}
              style={{ width: "100%", height: "100%" }}
            />
          </div>
        );
      }

      case "advanced_table":
        return <AdvancedTableChart chartData={chartData} columns={columns} />;

      case "sparkline": {
        const sparkData = chartData.slice(-10).map((d) => Number(d[yKey]) || 0);
        return (
          <div className="h-[100px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={sparkData.map((v, i) => ({ value: v, index: i }))}
              >
                <defs>
                  <linearGradient
                    id="sparkGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor={colors[0]} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={colors[0]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={colors[0]}
                  fill="url(#sparkGradient)"
                  strokeWidth={2}
                />
                <Tooltip content={<CustomTooltip />} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );
      }

      case "candlestick_chart": {
        // Use yKey as close; if secondaryKey exists use as open; derive high/low from open/close
        const ohlcData = chartData.slice(0, 20).map((d, i) => {
          const close = Number(d[yKey]) || 0;
          const open = secondaryKey
            ? Number(d[secondaryKey]) || close
            : i > 0
              ? Number(chartData[i - 1]?.[yKey]) || close
              : close;
          return {
            date: String(d[xKey]) || `Período ${i + 1}`,
            open,
            high: Math.max(open, close),
            low: Math.min(open, close),
            close,
          };
        });
        return (
          <div className="h-[450px] w-full">
            <Plot
              data={[
                {
                  type: "candlestick",
                  x: ohlcData.map((d) => d.date),
                  open: ohlcData.map((d) => d.open),
                  high: ohlcData.map((d) => d.high),
                  low: ohlcData.map((d) => d.low),
                  close: ohlcData.map((d) => d.close),
                  increasing: { line: { color: colors[0] } },
                  decreasing: { line: { color: "#ef4444" } },
                },
              ]}
              layout={{
                margin: { t: 40, l: 60, r: 40, b: 80 },
                height: 430,
                xaxis: { tickangle: -45 },
              }}
              config={{ displayModeBar: false }}
            />
          </div>
        );
      }
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

  return (
    <div className="space-y-4">
      <div className="w-full">{renderChart()}</div>

      {(config?.notas || config?.fuentes) && (
        <div className="mt-4 pt-4 border-t border-border/50 text-xs space-y-2">
          {config?.notas && (
            <div className="text-muted-foreground italic leading-relaxed">
              <span className="font-semibold text-foreground/70 not-italic mr-1.5">
                Notas:
              </span>
              {config.notas}
            </div>
          )}
          {config?.fuentes && (
            <div className="text-muted-foreground leading-relaxed flex items-start gap-1.5">
              <span className="font-semibold text-foreground/70 shrink-0">
                Fuente:
              </span>
              <span>{config.fuentes}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

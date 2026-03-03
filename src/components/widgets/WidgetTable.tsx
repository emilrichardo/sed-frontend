"use client";

import React, { useMemo } from "react";
import { Table2 } from "lucide-react";

interface WidgetTableProps {
  data: Record<string, unknown>;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (typeof value === "number") return String(value);

  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
      return new Date(value).toLocaleDateString("es-AR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
    return value;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    return value
      .map((item) => {
        if (typeof item === "string" || typeof item === "number") return item;
        if (typeof item === "object" && item !== null) {
          const o = item as Record<string, unknown>;
          return o.nombre ?? o.titulo ?? o.name ?? o.id ?? "";
        }
        return "";
      })
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    const label = o.nombre ?? o.titulo ?? o.name ?? o.label;
    if (label !== undefined) return String(label);
    // For objects like autor: join nombre + apellido if present
    if (o.nombre && o.apellido) return `${o.nombre} ${o.apellido}`;
    return JSON.stringify(value);
  }

  return String(value);
}

export default function WidgetTable({ data }: WidgetTableProps) {
  const titulo = (data.titulo as string) ?? "Tabla";
  const collectionName = (data.coleccion as string) ?? null;

  // Entries come pre-filtered by Payload with only the configured fields
  const entries = useMemo(() => {
    const raw = data.entradas;
    if (!Array.isArray(raw)) return [];
    return raw.filter(
      (item): item is Record<string, unknown> =>
        item !== null && typeof item === "object" && !Array.isArray(item),
    );
  }, [data]);

  // Columns = campos_{coleccion} if configured, otherwise all entry keys minus "id"
  const columns = useMemo(() => {
    if (collectionName) {
      const configured = data[`campos_${collectionName}`];
      if (Array.isArray(configured) && configured.length > 0) {
        return configured.filter((c): c is string => typeof c === "string");
      }
    }
    // Fallback: all keys from entries except id
    const seen = new Set<string>();
    for (const entry of entries) {
      for (const key of Object.keys(entry)) {
        if (key !== "id") seen.add(key);
      }
    }
    return Array.from(seen);
  }, [data, collectionName, entries]);

  if (entries.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl overflow-hidden h-full flex flex-col">
        <Header titulo={titulo} collectionName={collectionName} count={0} />
        <div className="flex-1 flex items-center justify-center p-8">
          <p className="text-sm text-muted-foreground italic">
            No hay entradas en esta colección.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden h-full flex flex-col">
      <Header titulo={titulo} collectionName={collectionName} count={entries.length} />

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm border-collapse min-w-max">
          <thead>
            <tr className="bg-muted/40 border-b border-border sticky top-0">
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap border-r border-border/50 last:border-r-0"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => (
              <tr
                key={(entry.id as string | number) ?? i}
                className="border-b border-border/50 hover:bg-muted/30 transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={col}
                    className="px-4 py-2 text-xs text-foreground/80 whitespace-nowrap border-r border-border/50 last:border-r-0 max-w-[260px] truncate"
                    title={formatValue(entry[col])}
                  >
                    {formatValue(entry[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-2 border-t border-border bg-muted/20 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          {entries.length} entrada{entries.length !== 1 ? "s" : ""}
          {" · "}
          {columns.length} columna{columns.length !== 1 ? "s" : ""}
        </span>
        {collectionName && (
          <span className="text-[10px] font-mono text-muted-foreground">
            /{collectionName}
          </span>
        )}
      </div>
    </div>
  );
}

function Header({
  titulo,
  collectionName,
  count,
}: {
  titulo: string;
  collectionName: string | null;
  count: number;
}) {
  return (
    <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-3">
      <Table2 className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold leading-tight truncate">{titulo}</p>
        {collectionName && (
          <p className="text-[10px] font-mono text-muted-foreground">
            {collectionName}
          </p>
        )}
      </div>
      {count > 0 && (
        <span className="shrink-0 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold tabular-nums">
          {count}
        </span>
      )}
    </div>
  );
}

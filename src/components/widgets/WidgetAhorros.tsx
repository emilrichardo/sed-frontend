"use client";

import React from "react";
import { ArrowUp, ArrowDown, PiggyBank } from "lucide-react";

interface AhorroEntry {
  mes: string;
  anio: number;
  plazosFijos: number;
  variacionMensual: number;
  porcentajeCaida: number;
}

function fmtARS(n: number): string {
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(
    Math.abs(n),
  );
}

function fmtPct(n: number): string {
  return (
    new Intl.NumberFormat("es-AR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(Math.abs(n)) + "%"
  );
}

function colors(isPositive: boolean) {
  return {
    Arrow: isPositive ? ArrowUp : ArrowDown,
    text: isPositive
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-red-500 dark:text-red-400",
    chip: isPositive
      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800"
      : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800",
    borderL: isPositive ? "border-l-emerald-500" : "border-l-red-500",
  };
}

// ── XS — fila compacta ───────────────────────────────────────────────────────

function VariantXS({ entry }: { entry: AhorroEntry }) {
  const isPositive = entry.variacionMensual >= 0;
  const { Arrow, text, chip, borderL } = colors(isPositive);
  const sign = isPositive ? "+" : "−";

  return (
    <div
      className={`bg-card border border-border border-l-4 ${borderL} rounded-xl flex items-center gap-4 px-4 py-3`}
    >
      <div className="shrink-0 min-w-[80px]">
        <p className="text-sm font-bold leading-tight">{entry.mes}</p>
        <p className="text-[10px] text-muted-foreground">{entry.anio}</p>
      </div>

      <div className="w-px h-8 bg-border shrink-0" />

      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wider">
          Monto acumulado
        </p>
        <p className="text-sm font-mono font-bold tabular-nums truncate">
          $ {fmtARS(entry.plazosFijos)}
        </p>
      </div>

      <div className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${chip}`}>
        <Arrow className={`h-3.5 w-3.5 ${text} shrink-0`} />
        <span className={`text-xs font-bold font-mono tabular-nums ${text}`}>
          {sign} {fmtARS(entry.variacionMensual)}
        </span>
        <span className={`text-xs font-semibold ${text} opacity-80`}>
          ({sign}{fmtPct(entry.porcentajeCaida)})
        </span>
      </div>
    </div>
  );
}

// ── MD — tarjeta expandida ───────────────────────────────────────────────────

function VariantMD({ entry, titulo }: { entry: AhorroEntry; titulo: string }) {
  const isPositive = entry.variacionMensual >= 0;
  const { Arrow, text, chip } = colors(isPositive);
  const sign = isPositive ? "+" : "−";

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
      <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            {titulo}
          </p>
          <p className="text-base font-bold mt-0.5">
            {entry.mes}{" "}
            <span className="text-muted-foreground font-normal">{entry.anio}</span>
          </p>
        </div>
        <PiggyBank className="h-5 w-5 text-muted-foreground/40 shrink-0 mt-0.5" />
      </div>

      <div className="px-5 py-5 text-center border-y border-border/50 bg-muted/10">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">
          Monto acumulado
        </p>
        <p className="text-3xl font-bold font-mono tabular-nums tracking-tight">
          $ {fmtARS(entry.plazosFijos)}
        </p>
      </div>

      <div className="px-5 py-4">
        <div className={`flex items-center justify-between rounded-xl border px-4 py-3 ${chip}`}>
          <div className="flex items-center gap-2">
            <Arrow className={`h-5 w-5 ${text} shrink-0`} />
            <span className={`text-base font-bold font-mono tabular-nums ${text}`}>
              {sign} {fmtARS(entry.variacionMensual)}
            </span>
          </div>
          <span className={`text-xl font-bold tabular-nums ${text}`}>
            {sign}{fmtPct(entry.porcentajeCaida)}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-2 uppercase tracking-wider">
          Variación mensual
        </p>
      </div>
    </div>
  );
}

// ── Export — variant via data._variant ("xs" | "md", default "md") ───────────

export default function WidgetAhorros({ data }: { data: Record<string, unknown> }) {
  const variant = ((data._variant as string) ?? "md").toLowerCase();
  const titulo = (data.titulo as string) ?? "Ahorros Provinciales";
  const entries = Array.isArray(data.entradas) ? (data.entradas as AhorroEntry[]) : [];
  const entry = entries[0];

  if (!entry) {
    return (
      <div className="bg-card border border-border rounded-xl px-4 py-3 text-sm text-muted-foreground italic">
        Sin datos disponibles.
      </div>
    );
  }

  if (variant === "xs") return <VariantXS entry={entry} />;
  return <VariantMD entry={entry} titulo={titulo} />;
}

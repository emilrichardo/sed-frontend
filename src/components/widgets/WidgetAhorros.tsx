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

function palette(isPositive: boolean) {
  return {
    Arrow: isPositive ? ArrowUp : ArrowDown,
    text: isPositive
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-red-500 dark:text-red-400",
    chip: isPositive
      ? "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800"
      : "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800",
  };
}

// ── XS — línea inline ─────────────────────────────────────────────────────────

function VariantXS({ entry }: { entry: AhorroEntry }) {
  const isPositive = entry.variacionMensual >= 0;
  const { Arrow, text } = palette(isPositive);
  const sign = isPositive ? "+" : "−";

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card text-xs">
      <span className="font-semibold">
        {entry.mes} {entry.anio}
      </span>
      <span className="text-muted-foreground">·</span>
      <span className="font-mono font-bold tabular-nums">
        $ {fmtARS(entry.plazosFijos)}
      </span>
      <span className="text-muted-foreground">·</span>
      <span
        className={`flex items-center gap-1 font-bold tabular-nums ${text}`}
      >
        <Arrow className="h-3 w-3 shrink-0" />
        {sign}
        {fmtARS(entry.variacionMensual)}
      </span>
      <span className={`font-semibold tabular-nums ${text} opacity-80`}>
        ({sign}
        {fmtPct(entry.porcentajeCaida)})
      </span>
    </div>
  );
}

// ── SM — fila compacta en tarjeta ─────────────────────────────────────────────

function VariantSM({ entry }: { entry: AhorroEntry }) {
  const isPositive = entry.variacionMensual >= 0;
  const { Arrow, text, chip } = palette(isPositive);
  const sign = isPositive ? "+" : "−";

  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between gap-4">
      {/* Mes */}
      <div className="shrink-0">
        <p className="text-sm font-bold">{entry.mes}</p>
        <p className="text-[10px] text-muted-foreground tabular-nums">
          {entry.anio}
        </p>
      </div>

      {/* Monto */}
      <div className="flex-1 text-right">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
          Monto
        </p>
        <p className="text-sm font-mono font-bold tabular-nums">
          $ {fmtARS(entry.plazosFijos)}
        </p>
      </div>

      {/* Chip variación */}
      <div
        className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${chip}`}
      >
        <Arrow className={`h-3.5 w-3.5 shrink-0 ${text}`} />
        <span className={`text-xs font-bold font-mono tabular-nums ${text}`}>
          {sign}
          {fmtPct(entry.porcentajeCaida)}
        </span>
      </div>
    </div>
  );
}

// ── MD — tarjeta con tres secciones ──────────────────────────────────────────

function VariantMD({ entry, titulo }: { entry: AhorroEntry; titulo: string }) {
  const isPositive = entry.variacionMensual >= 0;
  const { Arrow, text, chip } = palette(isPositive);
  const sign = isPositive ? "+" : "−";

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-border/50">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            {titulo}
          </p>
          <p className="text-sm font-bold mt-0.5">
            {entry.mes}{" "}
            <span className="text-muted-foreground font-normal">
              {entry.anio}
            </span>
          </p>
        </div>
        <PiggyBank className="h-4 w-4 text-muted-foreground/40 shrink-0" />
      </div>

      {/* Monto */}
      <div className="flex justify-between items-center">
        <div className="px-4 py-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            Monto acumulado
          </p>
          <p className="text-xl md:text-2xl font-bold font-mono tabular-nums">
            $ {fmtARS(entry.plazosFijos)}
          </p>
        </div>

        {/* Variación */}
        <div className="px-4 pb-4">
          <div
            className={`flex items-center justify-between rounded-lg px-2 md:px-3 py-2.5 ${chip}`}
          >
            <div className="flex items-center gap-2">
              <Arrow className={`h-4 w-4 shrink-0 ${text}`} />
              <span
                className={`hidden  text-xs md:text-sm font-bold font-mono tabular-nums ${text}`}
              >
                {sign} {fmtARS(entry.variacionMensual)}
              </span>
            </div>
            <span
              className={`text-xs md:text-base font-bold tabular-nums ${text}`}
            >
              {sign}
              {fmtPct(entry.porcentajeCaida)}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 uppercase tracking-wider">
            Variación mensual
          </p>
        </div>
      </div>
    </div>
  );
}

// ── LG — tarjeta con monto destacado ─────────────────────────────────────────

function VariantLG({ entry, titulo }: { entry: AhorroEntry; titulo: string }) {
  const isPositive = entry.variacionMensual >= 0;
  const { Arrow, text, chip } = palette(isPositive);
  const sign = isPositive ? "+" : "−";

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            {titulo}
          </p>
          <p className="text-base font-bold mt-0.5">
            {entry.mes}{" "}
            <span className="text-muted-foreground font-normal">
              {entry.anio}
            </span>
          </p>
        </div>
        <PiggyBank className="h-5 w-5 text-muted-foreground/40 shrink-0 mt-0.5" />
      </div>

      {/* Monto grande */}
      <div className="px-5 py-6 border-y border-border/50 bg-muted/10 text-center">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2">
          Monto acumulado en plazos fijos
        </p>
        <p className="text-4xl font-bold font-mono tabular-nums tracking-tight">
          $ {fmtARS(entry.plazosFijos)}
        </p>
      </div>

      {/* Variación */}
      <div className="px-5 py-4 space-y-1.5">
        <div
          className={`flex items-center justify-between rounded-xl px-4 py-3 ${chip}`}
        >
          <div className="flex items-center gap-2.5">
            <Arrow className={`h-5 w-5 shrink-0 ${text}`} />
            <span
              className={`text-base font-bold font-mono tabular-nums ${text}`}
            >
              {sign} {fmtARS(entry.variacionMensual)}
            </span>
          </div>
          <span className={`text-xl font-bold tabular-nums ${text}`}>
            {sign}
            {fmtPct(entry.porcentajeCaida)}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground text-center uppercase tracking-wider">
          Variación mensual
        </p>
      </div>
    </div>
  );
}

// ── XL — tarjeta completa con contexto ────────────────────────────────────────

function VariantXL({ entry, titulo }: { entry: AhorroEntry; titulo: string }) {
  const isPositive = entry.variacionMensual >= 0;
  const { Arrow, text, chip } = palette(isPositive);
  const sign = isPositive ? "+" : "−";

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            {titulo}
          </p>
          <p className="text-xl font-bold mt-1">
            {entry.mes}{" "}
            <span className="text-muted-foreground text-base font-normal">
              {entry.anio}
            </span>
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Plazos fijos · Provincia de Santiago del Estero
          </p>
        </div>
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-muted shrink-0">
          <PiggyBank className="h-5 w-5 text-muted-foreground/60" />
        </div>
      </div>

      {/* Monto */}
      <div className="mx-6 mb-4 rounded-xl bg-muted/30 border border-border/50 px-5 py-5 text-center">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
          Monto acumulado
        </p>
        <p className="text-5xl font-bold font-mono tabular-nums tracking-tight">
          $ {fmtARS(entry.plazosFijos)}
        </p>
      </div>

      {/* Variación */}
      <div className="mx-6 mb-5">
        <div
          className={`flex items-center justify-between rounded-xl px-5 py-4 ${chip}`}
        >
          <div className="flex items-center gap-3">
            <Arrow className={`h-6 w-6 shrink-0 ${text}`} />
            <div>
              <p className={`text-lg font-bold font-mono tabular-nums ${text}`}>
                {sign} {fmtARS(entry.variacionMensual)}
              </p>
              <p
                className={`text-[11px] uppercase tracking-wider ${text} opacity-70`}
              >
                vs. mes anterior
              </p>
            </div>
          </div>
          <p className={`text-3xl font-bold tabular-nums ${text}`}>
            {sign}
            {fmtPct(entry.porcentajeCaida)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Export — variant via data._variant ───────────────────────────────────────

export default function WidgetAhorros({
  data,
  variant,
}: {
  data: Record<string, unknown>;
  variant?: "xs" | "sm" | "md" | "lg" | "xl";
}) {
  const finalVariant = (
    variant ??
    (data._variant as string) ??
    "md"
  ).toLowerCase();
  const titulo = (data.titulo as string) ?? "Ahorros Provinciales";
  const entries = Array.isArray(data.entradas)
    ? (data.entradas as AhorroEntry[])
    : [];
  const entry = entries[0];

  if (!entry) {
    return (
      <div className="bg-card border border-border rounded-xl px-4 py-3 text-sm text-muted-foreground italic">
        Sin datos disponibles.
      </div>
    );
  }

  if (finalVariant === "xs") return <VariantXS entry={entry} />;
  if (finalVariant === "sm") return <VariantSM entry={entry} />;
  if (finalVariant === "lg") return <VariantLG entry={entry} titulo={titulo} />;
  if (finalVariant === "xl") return <VariantXL entry={entry} titulo={titulo} />;
  return <VariantMD entry={entry} titulo={titulo} />;
}

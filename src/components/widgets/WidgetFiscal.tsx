"use client";

import React, { useEffect, useState } from "react";
import {
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Landmark,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface MonthData {
  mes: string;
  nombre: string;
  coparticipacion: number; // millions ARS
  ingresos: number; // millions ARS
}

interface FiscalData {
  month: MonthData;
  yearLabel: string;
  year: MonthData;
  months: MonthData[]; // all months desc
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function fmtM(val: number): string {
  return (
    "$ " +
    new Intl.NumberFormat("es-AR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(val)) +
    " M"
  );
}

function fmtMShort(val: number): string {
  if (val >= 1_000) {
    return (
      new Intl.NumberFormat("es-AR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format(val / 1_000) + " B"
    );
  }
  return (
    new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(
      Math.round(val),
    ) + " M"
  );
}

function copaPct(copa: number, ing: number): number {
  const total = copa + ing;
  if (total === 0) return 0;
  return (copa / total) * 100;
}

// ── Competition bar ───────────────────────────────────────────────────────────
// Left = Coparticipación (primary), Right = Ingresos propios (muted)

function CompBar({ pct, small = false }: { pct: number; small?: boolean }) {
  const ingPct = 100 - pct;
  const h = small ? "h-1.5" : "h-2.5";
  const txtSize = small ? "text-[9px] w-5" : "text-[10px] w-6";
  return (
    <div className="flex items-center gap-1.5 w-full">
      <span
        className={`tabular-nums font-bold text-primary shrink-0 text-right ${txtSize}`}
      >
        {pct.toFixed(0)}%
      </span>
      <div className={`flex-1 flex ${h} rounded-full overflow-hidden bg-muted`}>
        <div
          className="bg-primary transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
        <div
          className="bg-foreground/15 transition-all duration-700 ease-out"
          style={{ width: `${ingPct}%` }}
        />
      </div>
      <span
        className={`tabular-nums text-muted-foreground shrink-0 ${txtSize}`}
      >
        {ingPct.toFixed(0)}%
      </span>
    </div>
  );
}

// ── Data hook ─────────────────────────────────────────────────────────────────

function useFiscalData() {
  const [data, setData] = useState<FiscalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear().toString();
    const currentMes = (now.getMonth() + 1).toString();

    Promise.all([
      fetch(
        `/api-proxy/coparticipacion?limit=2000&where[anio][equals]=${year}`,
      ).then((r) => r.json()),
      fetch(
        `/api-proxy/ingresos?limit=200&where[anio][equals]=${year}&where[categoria][equals]=total`,
      ).then((r) => r.json()),
    ])
      .then(([copaData, ingData]) => {
        // Group coparticipación: sum daily totals per month (already in millions)
        const copaByMonth = new Map<string, number>();
        (copaData.docs || []).forEach((r: { mes: string; total?: number }) => {
          copaByMonth.set(
            r.mes,
            (copaByMonth.get(r.mes) || 0) + (r.total || 0),
          );
        });

        // Ingresos: already in millions, one record per month (categoria=total)
        const ingByMonth = new Map<string, number>();
        (ingData.docs || []).forEach((r: { mes: string; monto?: number }) => {
          ingByMonth.set(r.mes, r.monto || 0);
        });

        const allMeses = Array.from(
          new Set([...copaByMonth.keys(), ...ingByMonth.keys()]),
        ).sort((a, b) => parseInt(b) - parseInt(a));

        const months: MonthData[] = allMeses.map((mes) => ({
          mes,
          nombre: MONTH_NAMES[parseInt(mes) - 1] || `Mes ${mes}`,
          coparticipacion: copaByMonth.get(mes) || 0,
          ingresos: ingByMonth.get(mes) || 0,
        }));

        const yearCopa = months.reduce((s, m) => s + m.coparticipacion, 0);
        const yearIng = months.reduce((s, m) => s + m.ingresos, 0);

        let currentMonth = months.find((m) => m.mes === currentMes);

        // If current calendar month has zero data for both, pick the latest month that has ANY data
        if (
          !currentMonth ||
          (currentMonth.coparticipacion === 0 && currentMonth.ingresos === 0)
        ) {
          currentMonth = months.find(
            (m) => m.coparticipacion > 0 || m.ingresos > 0,
          );
        }

        if (!currentMonth) {
          currentMonth = {
            mes: currentMes,
            nombre: MONTH_NAMES[parseInt(currentMes) - 1],
            coparticipacion: 0,
            ingresos: 0,
          };
        }

        setData({
          month: currentMonth,
          yearLabel: year,
          year: {
            mes: "0",
            nombre: `Año ${year}`,
            coparticipacion: yearCopa,
            ingresos: yearIng,
          },
          months,
        });
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  return { data, loading, error };
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Pulse({ w, h = "h-3" }: { w: string; h?: string }) {
  return <div className={`${h} ${w} bg-muted rounded animate-pulse`} />;
}

// ── Shared header ─────────────────────────────────────────────────────────────

function Header({ titulo }: { titulo: string }) {
  return (
    <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center gap-2.5">
      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 shrink-0">
        <Landmark className="h-3.5 w-3.5 text-primary" />
      </div>
      <p className="text-xs font-bold leading-tight truncate flex-1">
        {titulo}
      </p>
    </div>
  );
}

// ── Legend chip ───────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="flex items-center gap-3 px-4 py-2 border-t border-border bg-muted/10">
      <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <span className="inline-block w-2.5 h-2.5 rounded-sm bg-primary shrink-0" />
        Coparticipación
      </span>
      <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <span className="inline-block w-2.5 h-2.5 rounded-sm bg-foreground/15 shrink-0" />
        Recaudación propia
      </span>
    </div>
  );
}

// ── Month row (shared table row) ──────────────────────────────────────────────

function MonthRow({
  data,
  compact = false,
  isYear = false,
}: {
  data: MonthData;
  compact?: boolean;
  isYear?: boolean;
}) {
  const pendingIngresos =
    !isYear && data.coparticipacion > 0 && data.ingresos === 0;
  const pct = pendingIngresos
    ? 100
    : copaPct(data.coparticipacion, data.ingresos);

  return (
    <div
      className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 ${compact ? "px-4 py-2.5" : "px-5 py-3.5"} border-b border-border/50 last:border-b-0 ${pendingIngresos ? "opacity-70" : ""}`}
    >
      <span
        className={`${compact ? "text-xs" : "text-sm"} font-semibold shrink-0 min-w-[60px]`}
      >
        {data.nombre}
      </span>
      {pendingIngresos ? (
        <div className="flex-1 flex items-center justify-center bg-muted/40 rounded-full h-4">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground/80 font-semibold px-2 truncate">
            Esperando ingresos
          </span>
        </div>
      ) : (
        <CompBar pct={pct} small={compact} />
      )}
      <div
        className={`text-right shrink-0 ${compact ? "min-w-[80px]" : "min-w-[110px]"}`}
      >
        <p
          className={`font-bold font-mono tabular-nums text-primary ${compact ? "text-[10px]" : "text-xs"}`}
        >
          {compact
            ? fmtMShort(data.coparticipacion)
            : fmtM(data.coparticipacion)}
        </p>
        <p
          className={`text-muted-foreground font-mono tabular-nums ${compact ? "text-[9px]" : "text-[10px]"}`}
        >
          {pendingIngresos
            ? "Pendiente"
            : compact
              ? fmtMShort(data.ingresos)
              : fmtM(data.ingresos)}
        </p>
      </div>
    </div>
  );
}

// ── XS ────────────────────────────────────────────────────────────────────────

function VariantXS({ data, titulo }: { data: FiscalData; titulo: string }) {
  const pendingIngresos =
    data.month.coparticipacion > 0 && data.month.ingresos === 0;
  const pct = pendingIngresos
    ? 100
    : copaPct(data.month.coparticipacion, data.month.ingresos);

  return (
    <div
      className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs ${pendingIngresos ? "opacity-75" : ""}`}
    >
      <Landmark className="h-3 w-3 text-primary shrink-0" />
      <span className="font-semibold shrink-0">{titulo}</span>
      <span className="text-muted-foreground shrink-0">
        {data.month.nombre}
      </span>
      <div className="w-28 flex">
        {pendingIngresos ? (
          <span className="text-[9px] text-muted-foreground uppercase tracking-widest bg-muted/50 px-2 py-0.5 rounded-full w-full text-center">
            Pendiente
          </span>
        ) : (
          <CompBar pct={pct} small />
        )}
      </div>
    </div>
  );
}

// ── SM ────────────────────────────────────────────────────────────────────────

function VariantSM({ data, titulo }: { data: FiscalData; titulo: string }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <Header titulo={titulo} />
      <MonthRow data={data.month} compact />
      <Legend />
    </div>
  );
}

// ── MD ────────────────────────────────────────────────────────────────────────

function VariantMD({ data, titulo }: { data: FiscalData; titulo: string }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <Header titulo={titulo} />

      {/* Column headers */}
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-2 bg-muted/10 border-b border-border">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground min-w-[60px]">
          Período
        </span>
        <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          <span className="text-primary">Copa.</span>
          <span>Rec.</span>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground text-right min-w-[110px]">
          Monto
        </span>
      </div>

      <MonthRow data={data.month} />
      <MonthRow data={data.year} isYear />
      <Legend />
    </div>
  );
}

// ── LG ────────────────────────────────────────────────────────────────────────

function VariantLG({ data, titulo }: { data: FiscalData; titulo: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <Header titulo={titulo} />

      {/* Column headers */}
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-2 bg-muted/10 border-b border-border">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground min-w-[60px]">
          Período
        </span>
        <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          <span className="text-primary">Coparticipación</span>
          <span>Rec. propia</span>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground text-right min-w-[110px]">
          Monto
        </span>
      </div>

      <MonthRow data={data.month} />
      <MonthRow data={data.year} isYear />

      {/* Expandable months */}
      {expanded &&
        data.months.map((m) => <MonthRow key={m.mes} data={m} compact />)}

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors border-t border-border"
      >
        {expanded ? (
          <>
            <ChevronUp className="h-3.5 w-3.5" />
            Ocultar desglose mensual
          </>
        ) : (
          <>
            <ChevronDown className="h-3.5 w-3.5" />
            Ver desglose mensual ({data.months.length} meses)
          </>
        )}
      </button>

      <Legend />
    </div>
  );
}

// ── XL ────────────────────────────────────────────────────────────────────────

function VariantXL({ data, titulo }: { data: FiscalData; titulo: string }) {
  const [expanded, setExpanded] = useState(true);

  const copaTotal = data.year.coparticipacion;
  const ingTotal = data.year.ingresos;
  const pct = copaPct(copaTotal, ingTotal);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Hero header */}
      <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-3 border-b border-border">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            Finanzas Provinciales
          </p>
          <p className="text-xl font-bold mt-0.5">{titulo}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {data.yearLabel}
          </p>
        </div>
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 shrink-0">
          <Landmark className="h-5 w-5 text-primary" />
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
        <div className="px-5 py-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            Coparticipación
          </p>
          <p className="text-lg font-bold font-mono tabular-nums text-primary">
            {fmtM(copaTotal)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            acumulado {data.yearLabel}
          </p>
        </div>
        <div className="px-5 py-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            Recaudación propia
          </p>
          <p className="text-lg font-bold font-mono tabular-nums">
            {fmtM(ingTotal)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            acumulado {data.yearLabel}
          </p>
        </div>
      </div>

      {/* Annual bar */}
      <div className="px-6 py-4 border-b border-border">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
          Distribución anual
        </p>
        <CompBar pct={pct} />
      </div>

      {/* Month column headers */}
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-2 bg-muted/10 border-b border-border">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground min-w-[70px]">
          Mes
        </span>
        <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          <span className="text-primary">Coparticipación</span>
          <span>Rec. propia</span>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground text-right min-w-[110px]">
          Monto
        </span>
      </div>

      {/* Current month always visible */}
      <MonthRow data={data.month} />

      {/* Expandable all months */}
      {expanded &&
        data.months
          .filter((m) => m.mes !== data.month.mes)
          .map((m) => <MonthRow key={m.mes} data={m} compact />)}

      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors border-t border-border"
      >
        {expanded ? (
          <>
            <ChevronUp className="h-3.5 w-3.5" />
            Ocultar otros meses
          </>
        ) : (
          <>
            <ChevronDown className="h-3.5 w-3.5" />
            Ver todos los meses ({data.months.length})
          </>
        )}
      </button>

      <Legend />
    </div>
  );
}

// ── Loading / Error shells ────────────────────────────────────────────────────

function LoadingShell({ titulo }: { titulo: string }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <Header titulo={titulo} />
      <div className="p-5 space-y-3">
        <Pulse w="w-full" h="h-4" />
        <Pulse w="w-3/4" h="h-4" />
      </div>
    </div>
  );
}

function ErrorShell({ titulo }: { titulo: string }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <Header titulo={titulo} />
      <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
        <AlertCircle className="h-6 w-6 text-destructive/60" />
        <p className="text-xs text-muted-foreground">
          No se pudieron cargar los datos fiscales.
        </p>
      </div>
    </div>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────

export default function WidgetFiscal({
  data,
}: {
  data: Record<string, unknown>;
}) {
  const variant = ((data._variant as string) ?? "md").toLowerCase();
  const titulo = (data.titulo as string) ?? "Finanzas Provinciales";

  const { data: fiscal, loading, error } = useFiscalData();

  if (loading) return <LoadingShell titulo={titulo} />;
  if (error || !fiscal) return <ErrorShell titulo={titulo} />;

  if (variant === "xs") return <VariantXS data={fiscal} titulo={titulo} />;
  if (variant === "sm") return <VariantSM data={fiscal} titulo={titulo} />;
  if (variant === "lg") return <VariantLG data={fiscal} titulo={titulo} />;
  if (variant === "xl") return <VariantXL data={fiscal} titulo={titulo} />;
  return <VariantMD data={fiscal} titulo={titulo} />;
}

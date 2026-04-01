"use client";

import React, { useEffect, useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import {
  Loader2,
  AlertCircle,
  ChevronDown,
  PiggyBank,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { API_URL } from "@/lib/api";

// ── Types ────────────────────────────────────────────────────────────────────

interface AhorroEntry {
  id: string;
  mes: string;
  anio: number;
  plazosFijos: number;
  variacionMensual: number;
  porcentajeCaida: number;
}

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

// ── Month Block (collapsible) ────────────────────────────────────────────────

function MonthBlock({
  entry,
  defaultOpen,
}: {
  entry: AhorroEntry;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const isPositive = entry.variacionMensual >= 0;
  const { Arrow, text, chip } = palette(isPositive);
  const sign = isPositive ? "+" : "−";
  const monthName = MONTH_NAMES[parseInt(entry.mes) - 1] || entry.mes;

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-heading font-bold">
            {monthName}
          </h3>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold font-mono hidden sm:inline">
            $ {fmtARS(entry.plazosFijos)} M
          </span>
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {open && (
        <div className="border-t border-border px-5 py-5 space-y-4">
          {/* Monto */}
          <div>
            <span className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">
              Monto acumulado en plazos fijos
            </span>
            <span className="text-2xl font-bold font-mono tabular-nums">
              $ {fmtARS(entry.plazosFijos)}
              <span className="text-sm font-normal text-muted-foreground ml-1.5">
                millones
              </span>
            </span>
          </div>

          {/* Variación */}
          <div
            className={`inline-flex items-center justify-between gap-6 rounded-xl px-4 py-3 ${chip}`}
          >
            <div className="flex items-center gap-2.5">
              <Arrow className={`h-5 w-5 shrink-0 ${text}`} />
              <div>
                <p className={`text-base font-bold font-mono tabular-nums ${text}`}>
                  {sign} {fmtARS(entry.variacionMensual)}
                  <span className="text-xs font-normal ml-1">M</span>
                </p>
                <p className={`text-[11px] uppercase tracking-wider ${text} opacity-70`}>
                  vs. mes anterior
                </p>
              </div>
            </div>
            <p className={`text-xl font-bold tabular-nums ${text}`}>
              {sign}
              {fmtPct(entry.porcentajeCaida)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Year Section ─────────────────────────────────────────────────────────────

function YearSection({
  year,
  entries,
  isFirstYear,
}: {
  year: number;
  entries: AhorroEntry[];
  isFirstYear: boolean;
}) {
  const sortedEntries = [...entries].sort(
    (a, b) => parseInt(b.mes) - parseInt(a.mes),
  );

  const yearTotal = sortedEntries.reduce((acc, e) => acc + (e.plazosFijos || 0), 0);

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between border-b border-border pb-3">
        <h2 className="text-2xl font-heading font-bold">{year}</h2>
        <span className="text-sm text-muted-foreground font-mono">
          Promedio anual: $ {fmtARS(yearTotal / sortedEntries.length)} M
        </span>
      </div>
      <div className="space-y-3">
        {sortedEntries.map((entry, i) => (
          <MonthBlock
            key={`${year}-${entry.mes}`}
            entry={entry}
            defaultOpen={isFirstYear && i === 0}
          />
        ))}
      </div>
    </section>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function AhorrosPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<AhorroEntry[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/ahorros?limit=2000&sort=-anio,-mes`)
      .then((r) => {
        if (!r.ok) throw new Error("Error al obtener datos de ahorros");
        return r.json();
      })
      .then((data) => {
        setEntries(data.docs || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const groupedByYear = useMemo(() => {
    const map = new Map<number, AhorroEntry[]>();
    entries.forEach((e) => {
      if (!map.has(e.anio)) map.set(e.anio, []);
      map.get(e.anio)!.push(e);
    });
    return map;
  }, [entries]);

  const sortedYears = useMemo(
    () => Array.from(groupedByYear.keys()).sort((a, b) => b - a),
    [groupedByYear],
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Cargando datos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 px-4 text-center">
        <AlertCircle className="w-10 h-10 text-destructive" />
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 md:py-12 space-y-8">
      <PageHeader
        title='El "Ahorro" de la Provincia'
        description="Histórico del dinero que mantiene el gobierno provincial depositado en plazos fijos."
        icon={PiggyBank}
      />

      <div className="max-w-4xl mx-auto">
        <div className="bg-muted/30 border border-border rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-heading font-bold">
            ¿Qué representan estos números?
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Este indicador muestra el monto acumulado en <strong>plazos fijos</strong> del gobierno provincial. 
            Se trata de fondos que la provincia tiene disponibles pero decide no gastar, 
            manteniéndolos en el sistema financiero. La variación mensual refleja cuánto 
            creció o decreció ese ahorro respecto al mes anterior.
          </p>
        </div>
      </div>

      {sortedYears.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          No hay datos disponibles.
        </p>
      ) : (
        <div className="space-y-12 max-w-4xl mx-auto">
          {sortedYears.map((year, idx) => (
            <YearSection
              key={year}
              year={year}
              entries={groupedByYear.get(year)!}
              isFirstYear={idx === 0}
            />
          ))}
        </div>
      )}
    </main>
  );
}

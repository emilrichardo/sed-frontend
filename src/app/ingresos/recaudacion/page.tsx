"use client";

import React, { useEffect, useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Loader2, AlertCircle, ChevronDown, TrendingUp } from "lucide-react";
import { API_URL } from "@/lib/api";

// ── Types ────────────────────────────────────────────────────────────────────

interface IngresoRecord {
  id: number;
  label: string;
  anio: string;
  mes: string;
  categoria: string;
  monto: number;
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

const CATEGORIA_LABELS: Record<string, string> = {
  total: "Total",
  automotor: "Impuestos Automotor",
  otros: "Otros Impuestos",
};

function fmt(val: number) {
  return (
    "$ " +
    new Intl.NumberFormat("es-AR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(val) +
    " M"
  );
}

// ── Month Block ───────────────────────────────────────────────────────────────

function MonthBlock({
  month,
  year,
  records,
  defaultOpen,
}: {
  month: string;
  year: string;
  records: IngresoRecord[];
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const monthName = MONTH_NAMES[parseInt(month) - 1] || month;
  const total = records.find((r) => r.categoria === "total");
  const categories = records
    .filter((r) => r.categoria !== "total")
    .sort((a, b) => b.monto - a.monto);

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors text-left"
      >
        <h3 className="text-lg font-heading font-bold">
          {monthName} {year}
        </h3>
        <div className="flex items-center gap-4">
          {total && (
            <span className="text-sm font-bold font-mono hidden sm:inline text-primary">
              {fmt(total.monto)}
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {open && (
        <div className="border-t border-border">
          {/* Total highlighted */}
          {total && (
            <div className="flex items-center justify-between px-5 py-3.5 bg-muted/30 border-b border-border">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-sm font-bold font-mono text-primary">
                {fmt(total.monto)}
              </span>
            </div>
          )}
          {/* Category breakdown */}
          {categories.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between px-5 py-3 border-b border-border/50 last:border-b-0 hover:bg-muted/20 transition-colors"
            >
              <span className="text-sm text-muted-foreground">
                {CATEGORIA_LABELS[r.categoria] ??
                  r.label?.replace(/^.*? - /, "") ?? r.categoria ?? ""}
              </span>
              <span className="text-sm font-mono tabular-nums">
                {fmt(r.monto)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Year Section ──────────────────────────────────────────────────────────────

function YearSection({
  year,
  monthsMap,
  isFirstYear,
}: {
  year: string;
  monthsMap: Map<string, IngresoRecord[]>;
  isFirstYear: boolean;
}) {
  const sortedMonths = Array.from(monthsMap.entries()).sort(
    (a, b) => parseInt(b[0]) - parseInt(a[0]),
  );

  const yearTotal = sortedMonths.reduce((acc, [, recs]) => {
    const t = recs.find((r) => r.categoria === "total");
    return acc + (t?.monto || 0);
  }, 0);

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between border-b border-border pb-3">
        <h2 className="text-2xl font-heading font-bold">{year}</h2>
        <span className="text-sm text-muted-foreground font-mono">
          Total acumulado: {fmt(yearTotal)}
        </span>
      </div>
      <div className="space-y-3">
        {sortedMonths.map(([month, records], i) => (
          <MonthBlock
            key={`${year}-${month}`}
            month={month}
            year={year}
            records={records}
            defaultOpen={isFirstYear && i === 0}
          />
        ))}
      </div>
    </section>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RecaudacionPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<IngresoRecord[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/ingresos?limit=2000&sort=-anio,-mes`)
      .then((r) => {
        if (!r.ok) throw new Error("Error al obtener datos de ingresos");
        return r.json();
      })
      .then((data) => {
        setRecords(data.docs || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const groupedByYear = useMemo(() => {
    const map = new Map<string, Map<string, IngresoRecord[]>>();
    records.forEach((r) => {
      if (!r.anio || !r.mes) return;
      if (!map.has(r.anio)) map.set(r.anio, new Map());
      const yearMap = map.get(r.anio)!;
      if (!yearMap.has(r.mes)) yearMap.set(r.mes, []);
      yearMap.get(r.mes)!.push(r);
    });
    return map;
  }, [records]);

  const sortedYears = useMemo(
    () =>
      Array.from(groupedByYear.keys()).sort(
        (a, b) => parseInt(b) - parseInt(a),
      ),
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
        title="Recaudación"
        description="Recaudación mensual por categoría de ingresos de la Provincia de Santiago del Estero."
        icon={TrendingUp}
      />

      <p className="text-xs text-muted-foreground border border-border rounded-lg px-4 py-2.5 bg-muted/20 inline-block">
        Los montos están expresados en millones de pesos argentinos (M$).
      </p>

      {sortedYears.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          No hay datos disponibles.
        </p>
      ) : (
        <div className="space-y-12">
          {sortedYears.map((year, idx) => (
            <YearSection
              key={year}
              year={year}
              monthsMap={groupedByYear.get(year)!}
              isFirstYear={idx === 0}
            />
          ))}
        </div>
      )}
    </main>
  );
}

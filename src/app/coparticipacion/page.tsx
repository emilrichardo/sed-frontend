"use client";

import React, { useEffect, useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Loader2, AlertCircle, ChevronDown, Landmark } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface CRecord {
  id: number;
  label: string;
  anio: string;
  mes: string;
  dia: string;
  recursos_nacional: number;
  compensacion_consenso_fiscal: number;
  total: number;
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

function fmt(val: number) {
  return (
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(val) + " M"
  );
}

// ── Month Block (collapsible) ────────────────────────────────────────────────

function MonthBlock({
  month,
  year,
  records,
  defaultOpen,
}: {
  month: string;
  year: string;
  records: CRecord[];
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const sorted = [...records].sort((a, b) => parseInt(a.dia) - parseInt(b.dia));

  const sumNacional = records.reduce(
    (a, r) => a + (r.recursos_nacional || 0),
    0,
  );
  const sumConsenso = records.reduce(
    (a, r) => a + (r.compensacion_consenso_fiscal || 0),
    0,
  );
  const sumTotal = records.reduce((a, r) => a + (r.total || 0), 0);

  const monthName = MONTH_NAMES[parseInt(month) - 1] || month;

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-heading font-bold">
            {monthName} {year}
          </h3>
          <span className="text-xs text-muted-foreground font-mono">
            {records.length} días
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold font-mono hidden sm:inline">
            {fmt(sumTotal)}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {open && (
        <div className="border-t border-border">
          {/* Summary row */}
          <div className="grid grid-cols-3 gap-4 px-5 py-4 bg-muted/30 text-sm">
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">
                Rec. Nacionales
              </span>
              <span className="font-bold font-mono">{fmt(sumNacional)}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">
                Consenso Fiscal
              </span>
              <span className="font-bold font-mono">{fmt(sumConsenso)}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">
                Total
              </span>
              <span className="font-bold font-mono text-primary">
                {fmt(sumTotal)}
              </span>
            </div>
          </div>

          {/* Day-by-day table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/20 text-xs uppercase tracking-wider text-muted-foreground border-y border-border">
                <tr>
                  <th className="px-5 py-3 text-left font-bold">Fecha</th>
                  <th className="px-5 py-3 text-right font-bold">
                    Rec. Nacionales
                  </th>
                  <th className="px-5 py-3 text-right font-bold">
                    Consenso Fiscal
                  </th>
                  <th className="px-5 py-3 text-right font-bold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sorted.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-5 py-3 font-medium whitespace-nowrap">
                      {r.label}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-muted-foreground">
                      {fmt(r.recursos_nacional || 0)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-muted-foreground">
                      {fmt(r.compensacion_consenso_fiscal || 0)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-bold">
                      {fmt(r.total || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Year Section ─────────────────────────────────────────────────────────────

function YearSection({
  year,
  monthsMap,
  isFirstYear,
}: {
  year: string;
  monthsMap: Map<string, CRecord[]>;
  isFirstYear: boolean;
}) {
  const sortedMonths = Array.from(monthsMap.entries()).sort(
    (a, b) => parseInt(b[0]) - parseInt(a[0]),
  );

  // Calculate year total
  const yearTotal = sortedMonths.reduce(
    (acc, [, recs]) => acc + recs.reduce((a, r) => a + (r.total || 0), 0),
    0,
  );

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between border-b border-border pb-3">
        <h2 className="text-2xl font-heading font-bold">{year}</h2>
        <span className="text-sm text-muted-foreground font-mono">
          Total: {fmt(yearTotal)}
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

// ── Main Page ────────────────────────────────────────────────────────────────

export default function CoparticipacionPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<CRecord[]>([]);

  useEffect(() => {
    fetch("/api-proxy/coparticipacion?limit=2000&sort=-createdAt")
      .then((r) => {
        if (!r.ok) throw new Error("Error al obtener datos de coparticipación");
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

  // Group by year → month
  const groupedByYear = useMemo(() => {
    const map = new Map<string, Map<string, CRecord[]>>();
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
        title="Coparticipación"
        description="Distribución diaria de recursos de origen nacional y compensación del Consenso Fiscal."
        icon={Landmark}
      />

      <div className="flex">
        <p className="text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md inline-flex border border-border/50 shadow-sm">
          Los montos están expresados en millones de pesos argentinos (M$).
        </p>
      </div>

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

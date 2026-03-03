"use client";

import React, { useEffect, useState } from "react";
import { DollarSign, TrendingUp } from "lucide-react";

interface DollarRate {
  casa: string;
  nombre: string;
  compra: number;
  venta: number;
  fechaActualizacion: string;
}

const CASAS_ORDER = ["oficial", "blue", "bolsa", "contadoconliqui", "cripto", "mayorista"];

const NOMBRES: Record<string, string> = {
  oficial: "Oficial",
  blue: "Blue",
  bolsa: "MEP",
  contadoconliqui: "CCL",
  cripto: "Cripto",
  mayorista: "Mayorista",
};

function fmtARS(n: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

function useDolar() {
  const [rates, setRates] = useState<DollarRate[]>([]);
  const [error, setError] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    fetch("https://dolarapi.com/v1/dolares")
      .then((r) => r.json())
      .then((data: DollarRate[]) => {
        const ordered = CASAS_ORDER.map((casa) =>
          data.find((r) => r.casa === casa),
        ).filter(Boolean) as DollarRate[];
        setRates(ordered);
        if (ordered[0]?.fechaActualizacion) {
          const d = new Date(ordered[0].fechaActualizacion);
          setUpdatedAt(
            d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
          );
        }
      })
      .catch(() => setError(true));
  }, []);

  return { rates, error, updatedAt };
}

function Pulse({ w, h = "h-3" }: { w: string; h?: string }) {
  return <div className={`${h} ${w} bg-muted rounded animate-pulse`} />;
}

// ── XS — un solo tipo en pill ─────────────────────────────────────────────────

function VariantXS() {
  const { rates, error } = useDolar();
  if (error) return null;
  const rate = rates[0];

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-card text-xs">
      <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
        USD
      </span>
      {rate ? (
        <>
          <span className="text-muted-foreground">Oficial</span>
          <span className="font-bold tabular-nums">{fmtARS(rate.venta)}</span>
        </>
      ) : (
        <Pulse w="w-16" />
      )}
    </div>
  );
}

// ── SM — tres tipos inline ────────────────────────────────────────────────────

function VariantSM() {
  const { rates, error } = useDolar();
  if (error) return null;
  const top3 = rates.slice(0, 3);

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card text-xs">
      <span className="font-bold uppercase tracking-wider text-muted-foreground text-[10px] shrink-0">
        USD
      </span>
      {top3.length === 0 ? (
        <>
          {[1, 2, 3].map((i) => <Pulse key={i} w="w-16" />)}
        </>
      ) : (
        top3.map((rate, i) => (
          <span key={rate.casa} className="flex items-center gap-1.5 shrink-0">
            {i > 0 && <span className="text-muted-foreground/50">·</span>}
            <span className="text-muted-foreground capitalize">
              {NOMBRES[rate.casa] ?? rate.nombre}
            </span>
            <span className="font-bold tabular-nums">{fmtARS(rate.venta)}</span>
          </span>
        ))
      )}
    </div>
  );
}

// ── MD — tarjeta con tres tipos ───────────────────────────────────────────────

function VariantMD() {
  const { rates, error } = useDolar();
  if (error) return null;
  const top3 = rates.slice(0, 3);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border/50 bg-muted/20 flex items-center gap-2">
        <DollarSign className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Cotización USD
        </p>
      </div>
      <div className="divide-y divide-border/50">
        {top3.length === 0
          ? [1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <Pulse w="w-16" />
                <Pulse w="w-20" />
              </div>
            ))
          : top3.map((rate) => (
              <div key={rate.casa} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-medium">
                  {NOMBRES[rate.casa] ?? rate.nombre}
                </span>
                <span className="text-sm font-bold tabular-nums">
                  {fmtARS(rate.venta)}
                </span>
              </div>
            ))}
      </div>
    </div>
  );
}

// ── LG — tarjeta con compra/venta ─────────────────────────────────────────────

function VariantLG() {
  const { rates, error } = useDolar();
  if (error) return null;
  const top4 = rates.slice(0, 4);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border/50 bg-muted/20 flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
        <p className="text-sm font-bold">Cotización USD</p>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/50">
            <th className="text-left px-5 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Tipo
            </th>
            <th className="text-right px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Compra
            </th>
            <th className="text-right px-5 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Venta
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {top4.length === 0
            ? [1, 2, 3, 4].map((i) => (
                <tr key={i}>
                  <td className="px-5 py-3"><Pulse w="w-16" /></td>
                  <td className="px-4 py-3 text-right"><Pulse w="w-16" /></td>
                  <td className="px-5 py-3 text-right"><Pulse w="w-16" /></td>
                </tr>
              ))
            : top4.map((rate) => (
                <tr key={rate.casa} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 font-medium">
                    {NOMBRES[rate.casa] ?? rate.nombre}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                    {fmtARS(rate.compra)}
                  </td>
                  <td className="px-5 py-3 text-right font-bold tabular-nums">
                    {fmtARS(rate.venta)}
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}

// ── XL — tarjeta completa ─────────────────────────────────────────────────────

function VariantXL() {
  const { rates, error, updatedAt } = useDolar();
  if (error) return null;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            Tipo de cambio
          </p>
          <p className="text-lg font-bold mt-0.5">Cotización del Dólar</p>
          {updatedAt && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Actualizado a las {updatedAt}
            </p>
          )}
        </div>
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 shrink-0">
          <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
      </div>

      <table className="w-full text-sm border-t border-border/50">
        <thead>
          <tr className="bg-muted/30">
            <th className="text-left px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Tipo
            </th>
            <th className="text-right px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Compra
            </th>
            <th className="text-right px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Venta
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {rates.length === 0
            ? [1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  <td className="px-5 py-3"><Pulse w="w-20" /></td>
                  <td className="px-4 py-3 text-right"><Pulse w="w-16" /></td>
                  <td className="px-5 py-3 text-right"><Pulse w="w-16" /></td>
                </tr>
              ))
            : rates.map((rate) => (
                <tr key={rate.casa} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 font-medium">
                    {NOMBRES[rate.casa] ?? rate.nombre}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                    {fmtARS(rate.compra)}
                  </td>
                  <td className="px-5 py-3 text-right font-bold tabular-nums">
                    {fmtARS(rate.venta)}
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Export — variant via data._variant ("xs"|"sm"|"md"|"lg"|"xl") ─────────────

export default function WidgetDolar({ data }: { data: Record<string, unknown> }) {
  const variant = ((data._variant as string) ?? "md").toLowerCase();

  if (variant === "xs") return <VariantXS />;
  if (variant === "sm") return <VariantSM />;
  if (variant === "lg") return <VariantLG />;
  if (variant === "xl") return <VariantXL />;
  return <VariantMD />;
}

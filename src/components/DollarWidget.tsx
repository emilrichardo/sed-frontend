"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface DollarRate {
  casa: string;
  nombre: string;
  compra: number;
  venta: number;
  fechaActualizacion: string;
}

const CASAS_ORDER = ["oficial", "blue", "bolsa", "contadoconliqui"];

function formatPrice(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

export function DollarWidget() {
  const [rates, setRates] = useState<DollarRate[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("https://dolarapi.com/v1/dolares")
      .then((r) => r.json())
      .then((data: DollarRate[]) => {
        const filtered = CASAS_ORDER.map((casa) =>
          data.find((r) => r.casa === casa)
        ).filter(Boolean) as DollarRate[];
        setRates(filtered.slice(0, 3));
      })
      .catch(() => setError(true));
  }, []);

  if (error) return null;

  return (
    <div className="p-3 rounded-lg border bg-card shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
        Dólar · Argentina
      </p>
      {rates.length === 0 ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="h-3 w-14 bg-muted rounded animate-pulse" />
              <div className="h-3 w-20 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-1.5">
          {rates.map((rate) => (
            <div key={rate.casa} className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-muted-foreground capitalize truncate">
                {rate.nombre}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-xs text-muted-foreground">{formatPrice(rate.compra)}</span>
                <span className="text-[10px] text-muted-foreground">/</span>
                <span className="text-xs font-bold">{formatPrice(rate.venta)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

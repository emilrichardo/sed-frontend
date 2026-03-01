"use client";

import { useEffect, useState } from "react";

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
    <div className="flex items-center gap-2 px-2 py-1 rounded border bg-card text-[10px] min-w-0 overflow-hidden">
      <span className="font-bold uppercase tracking-wider text-muted-foreground shrink-0">USD</span>
      {rates.length === 0 ? (
        <>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-2.5 w-14 bg-muted rounded animate-pulse" />
          ))}
        </>
      ) : (
        <>
          {rates.map((rate, idx) => (
            <span key={rate.casa} className="flex items-center gap-1 shrink-0">
              {idx > 0 && <span className="text-muted-foreground">·</span>}
              <span className="text-muted-foreground capitalize">{rate.nombre}</span>
              <span className="font-bold">{formatPrice(rate.venta)}</span>
            </span>
          ))}
        </>
      )}
    </div>
  );
}

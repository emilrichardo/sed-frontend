"use client";

import React, { useEffect, useState } from "react";
import WidgetFiscal from "@/components/widgets/WidgetFiscal";
import WidgetAhorros from "@/components/widgets/WidgetAhorros";
import WidgetBoletin from "@/components/widgets/WidgetBoletin";

export function HomeWidgetGroup() {
  const [ahorrosData, setAhorrosData] = useState<Record<string, unknown>>({
    titulo: 'El "Ahorro" Provincial',
    entradas: [],
    _variant: "md",
  });

  useEffect(() => {
    fetch("/api-proxy/ahorros?limit=1&sort=-createdAt&depth=1")
      .then((r) => r.json())
      .then((data) => {
        const doc = data.docs?.[0];
        if (doc) {
          setAhorrosData({
            titulo: 'El "Ahorro" Provincial',
            entradas: [doc],
            _variant: "md",
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="">
      <div className="grid grid-cols-1 gap-3">
        {/* Último Boletín */}
        <WidgetBoletin variant="md" />

        {/* El Ahorro Provincial */}
        <WidgetAhorros data={ahorrosData} variant="md" />

        {/* Finanzas Provinciales */}
        <WidgetFiscal data={{ titulo: "Finanzas Provinciales" }} variant="md" />
      </div>
    </section>
  );
}

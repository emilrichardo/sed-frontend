"use client";

import React, { useEffect, useState } from "react";
import WidgetFiscal from "@/components/widgets/WidgetFiscal";
import WidgetAhorros from "@/components/widgets/WidgetAhorros";
import WidgetClima from "@/components/widgets/WidgetClima";
import WidgetDolar from "@/components/widgets/WidgetDolar";
import WidgetBoletin from "@/components/widgets/WidgetBoletin";

export function HomeWidgetGroup() {
  const [ahorrosData, setAhorrosData] = useState<Record<string, unknown>>({
    titulo: "El Ahorro Provincial",
    entradas: [],
    _variant: "md",
  });

  useEffect(() => {
    fetch(
      "/api-proxy/widgets?where[nombre_widget][equals]=WidgetAhorros&limit=1&depth=3&sort=-updatedAt",
    )
      .then((r) => r.json())
      .then((data) => {
        const doc = data.docs?.[0];
        if (doc) {
          // Pass the full widget doc — WidgetAhorros reads data.entradas
          // which Payload populates with resolved AhorroEntry records
          setAhorrosData({ ...doc, _variant: "md" });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="">
      <div className="grid grid-cols-1 gap-3">
        {/* Clima + Dólar stacked */}
        <div className="grid grid-cols-2 gap-3">
          <WidgetClima data={{}} variant="sm" />
          <WidgetDolar data={{}} variant="sm" />
        </div>
        {/* El Ahorro Provincial */}
        <WidgetAhorros data={ahorrosData} variant="sm" />

        {/* Finanzas Provinciales */}
        <WidgetFiscal data={{ titulo: "Finanzas Provinciales" }} variant="md" />

        {/* Último Boletín */}
        <WidgetBoletin variant="md" />
      </div>
    </section>
  );
}

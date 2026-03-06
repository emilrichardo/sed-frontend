"use client";

import React, { useEffect, useState } from "react";
import WidgetFiscal from "@/components/widgets/WidgetFiscal";
import WidgetAhorros from "@/components/widgets/WidgetAhorros";
import WidgetClima from "@/components/widgets/WidgetClima";
import WidgetDolar from "@/components/widgets/WidgetDolar";
import { Landmark } from "lucide-react";

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
    <section className="py-3 md:-mx-8 ">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* El Ahorro Provincial */}
        <WidgetAhorros data={ahorrosData} variant="sm" />

        {/* Finanzas Provinciales */}
        <WidgetFiscal data={{ titulo: "Finanzas Provinciales" }} variant="sm" />

        {/* Clima + Dólar stacked */}
        <div className="flex flex-col gap-3">
          <WidgetClima data={{}} variant="md" />
          <WidgetDolar data={{}} variant="sm" />
        </div>
      </div>
    </section>
  );
}

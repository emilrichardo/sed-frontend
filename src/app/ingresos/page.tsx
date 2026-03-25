"use client";

import React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { TrendingUp, Banknote, ArrowUpRight } from "lucide-react";

export default function IngresosPage() {
  return (
    <main className="container mx-auto px-4 py-8 md:py-12 space-y-8">
      <PageHeader
        title="Ingresos de la Provincia"
        description="Información sobre los ingresos de la Provincia de Santiago del Estero."
        icon={TrendingUp}
      />

      {/* Texto introductorio */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-muted/30 border border-border rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-heading font-bold">
            ¿De dónde provienen los fondos de Santiago del Estero?
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            El presupuesto provincial se financia principalmente con dos fuentes. 
            En nuestra provincia, la dependencia del nivel nacional es determinante: 
            aproximadamente el <strong>90%</strong> de los fondos provienen de la Nación 
            y solo el <strong>10%</strong> se genera por recaudación propia.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Caja Coparticipación */}
        <Link
          href="/coparticipacion"
          className="group relative bg-card border border-border rounded-xl p-6 hover:border-primary/50 hover:shadow-lg transition-all flex flex-col h-full"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Banknote className="w-6 h-6 text-primary" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <h2 className="text-xl font-heading font-bold mb-2">Coparticipación</h2>
          <div className="space-y-3 text-sm text-muted-foreground flex-1">
            <p>
              No es dinero que la Nación &quot;entrega&quot; discrecionalmente, sino recursos 
              que legalmente le pertenecen a la provincia (provenientes de la recaudación 
              de impuestos nacionales como IVA o Ganancias).
            </p>
            <p>
              Llegan mediante un <strong>&quot;goteo&quot; diario y automático</strong>. Al operar 
              solo en días hábiles, los fondos de feriados y fines de semana se transfieren 
              acumulados el primer día hábil siguiente. Este sistema asegura previsibilidad 
              y evita recortes arbitrarios.
            </p>
          </div>
        </Link>

        {/* Caja Recaudación */}
        <Link
          href="/recaudacion"
          className="group relative bg-card border border-border rounded-xl p-6 hover:border-primary/50 hover:shadow-lg transition-all flex flex-col h-full"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <h2 className="text-xl font-heading font-bold mb-2">Recaudación Propia</h2>
          <div className="space-y-3 text-sm text-muted-foreground flex-1">
            <p>
              Es el dinero que la provincia genera a través de la recaudación de sus 
              propios impuestos. Esta fuente depende casi exclusivamente de{" "}
              <strong>Ingresos Brutos (77%)</strong>, que grava la actividad económica local.
            </p>
            <p>
              El resto se completa con Sellos (11%), Inmobiliario (7%) y Automotor (5%).
            </p>
            <p className="pt-2 border-t border-border/50 mt-3">
              <strong>¿Por qué importa?</strong> Al depender en un 90% del goteo diario, 
              cualquier alteración nacional impacta de inmediato en el pago de sueldos 
              y servicios básicos.
            </p>
          </div>
        </Link>
      </div>
    </main>
  );
}

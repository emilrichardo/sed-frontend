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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Caja Recaudación */}
        <Link
          href="/recaudacion"
          className="group relative bg-card border border-border rounded-xl p-6 hover:border-primary/50 hover:shadow-lg transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <h2 className="text-xl font-heading font-bold mb-2">Recaudación</h2>
          <p className="text-sm text-muted-foreground">
            Recaudación mensual por categoría de impuestos provinciales.
          </p>
        </Link>

        {/* Caja Coparticipación */}
        <Link
          href="/coparticipacion"
          className="group relative bg-card border border-border rounded-xl p-6 hover:border-primary/50 hover:shadow-lg transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Banknote className="w-6 h-6 text-primary" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <h2 className="text-xl font-heading font-bold mb-2">Coparticipación</h2>
          <p className="text-sm text-muted-foreground">
            Datos de coparticipación federal a la provincia de Santiago del Estero.
          </p>
        </Link>
      </div>
    </main>
  );
}

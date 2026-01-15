"use client";

import React, { useState, useEffect } from "react";
import { Seccion, TipoActo, Organismo, getTaxonomy } from "@/lib/api";
import { Filter, X } from "lucide-react";

interface BulletinFiltersProps {
  onFilterChange: (filters: any) => void;
}

export default function BulletinFilters({
  onFilterChange,
}: BulletinFiltersProps) {
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [tiposActo, setTiposActo] = useState<TipoActo[]>([]);
  const [organismos, setOrganismos] = useState<Organismo[]>([]);

  const [selectedSeccion, setSelectedSeccion] = useState("");
  const [selectedTipoActo, setSelectedTipoActo] = useState("");
  const [selectedOrganismo, setSelectedOrganismo] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    async function loadTaxonomies() {
      try {
        const [s, t, o] = await Promise.all([
          getTaxonomy<Seccion>("secciones"),
          getTaxonomy<TipoActo>("tipos-de-acto"),
          getTaxonomy<Organismo>("organismos"),
        ]);
        setSecciones(s);
        setTiposActo(t);
        setOrganismos(o);
      } catch (error) {
        console.error("Error loading taxonomies:", error);
      }
    }
    loadTaxonomies();
  }, []);

  const handleApplyFilters = () => {
    onFilterChange({
      seccion: selectedSeccion,
      tipo_acto: selectedTipoActo,
      jurisdiccion: selectedOrganismo,
      fecha_desde: dateFrom,
      fecha_hasta: dateTo,
    });
  };

  const handleClearFilters = () => {
    setSelectedSeccion("");
    setSelectedTipoActo("");
    setSelectedOrganismo("");
    setDateFrom("");
    setDateTo("");
    onFilterChange({});
  };

  return (
    <div className="p-4 border rounded-lg bg-card space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold">
          <Filter className="h-4 w-4" />
          <span>Filtros Avanzados</span>
        </div>
        <button
          onClick={handleClearFilters}
          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
        >
          <X className="h-3 w-3" />
          Limpiar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Sección
          </label>
          <select
            value={selectedSeccion}
            onChange={(e) => setSelectedSeccion(e.target.value)}
            className="w-full p-2 border rounded-md bg-background text-sm"
          >
            <option value="">Todas</option>
            {secciones.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Tipo de Acto
          </label>
          <select
            value={selectedTipoActo}
            onChange={(e) => setSelectedTipoActo(e.target.value)}
            className="w-full p-2 border rounded-md bg-background text-sm"
          >
            <option value="">Todos</option>
            {tiposActo.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Jurisdicción
          </label>
          <select
            value={selectedOrganismo}
            onChange={(e) => setSelectedOrganismo(e.target.value)}
            className="w-full p-2 border rounded-md bg-background text-sm"
          >
            <option value="">Todas</option>
            {organismos.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Desde
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full p-2 border rounded-md bg-background text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Hasta
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full p-2 border rounded-md bg-background text-sm"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleApplyFilters}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Aplicar Filtros
        </button>
      </div>
    </div>
  );
}

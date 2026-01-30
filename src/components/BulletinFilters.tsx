"use client";

import React, { useState, useEffect } from "react";
import { Seccion, TipoActo, Organismo, getTaxonomy } from "@/lib/api";
import { Search, X } from "lucide-react";

interface BulletinFiltersProps {
  onFilterChange: (
    filters:
      | Record<string, unknown>
      | ((prev: Record<string, unknown>) => Record<string, unknown>),
  ) => void;
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
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function loadTaxonomies() {
      const endpoints = [
        { key: "secciones", url: "secciones", setter: setSecciones },
        { key: "tipos-de-acto", url: "tipos-de-acto", setter: setTiposActo },
        { key: "organismos", url: "organismos", setter: setOrganismos },
      ];

      const results = await Promise.allSettled(
        endpoints.map((endpoint) =>
          getTaxonomy<any>(endpoint.url).then((data) => ({
            key: endpoint.key,
            data,
            setter: endpoint.setter,
          })),
        ),
      );

      results.forEach((result) => {
        if (result.status === "fulfilled") {
          result.value.setter(result.value.data);
        } else {
          console.warn(`Failed to load taxonomy:`, result.reason);
        }
      });
    }
    loadTaxonomies();
  }, []);

  // Reactive updates for select and date filters
  useEffect(() => {
    onFilterChange({
      seccion: selectedSeccion,
      tipo_acto: selectedTipoActo,
      search: searchTerm,
    });
  }, [
    selectedSeccion,
    selectedTipoActo,
    selectedOrganismo,
    dateFrom,
    dateTo,
    onFilterChange,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ]);

  // Debounced update for search term
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange((prev: Record<string, unknown>) => ({
        ...prev,
        search: searchTerm,
      }));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, onFilterChange]);

  const handleClearFilters = () => {
    setSelectedSeccion("");
    setSelectedTipoActo("");
    setSelectedOrganismo("");
    setDateFrom("");
    setDateTo("");
    setSearchTerm("");
  };

  return (
    <div className="flex flex-col xl:flex-row gap-4 items-end w-full">
      {/* Search Input - Primary Filter */}
      <div className="flex-1 w-full xl:w-auto min-w-[200px]">
        <label className="text-[10px] font-bold uppercase tracking-normal text-muted-foreground mb-1 block">
          Buscar
        </label>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Número, referencia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 p-2 h-10 border border-black bg-background text-sm focus:outline-none focus:ring-0 font-mono"
          />
        </div>
      </div>

      {/* Date Filters Group */}
      <div className="flex gap-2 w-full xl:w-auto shrink-0">
        <div className="space-y-1 w-1/2 xl:w-32">
          <label className="text-[10px] font-bold uppercase tracking-normal text-muted-foreground mb-1 block">
            Desde
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full p-2 h-10 border border-black bg-background text-xs focus:outline-none focus:ring-0 font-mono"
          />
        </div>

        <div className="space-y-1 w-1/2 xl:w-32">
          <label className="text-[10px] font-bold uppercase tracking-normal text-muted-foreground mb-1 block">
            Hasta
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full p-2 h-10 border border-black bg-background text-xs focus:outline-none focus:ring-0 font-mono"
          />
        </div>
      </div>

      {/* Select Filters Group */}
      <div className="flex gap-2 w-full xl:w-auto shrink-0 overflow-x-auto pb-1 xl:pb-0">
        <div className="space-y-1 min-w-[120px]">
          <label className="text-[10px] font-bold uppercase tracking-normal text-muted-foreground mb-1 block">
            Sección
          </label>
          <select
            value={selectedSeccion}
            onChange={(e) => setSelectedSeccion(e.target.value)}
            className="w-full p-2 h-10 border border-black bg-background text-xs focus:outline-none focus:ring-0 font-mono truncate"
          >
            <option value="">Todas</option>
            {secciones.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1 min-w-[120px]">
          <label className="text-[10px] font-bold uppercase tracking-normal text-muted-foreground mb-1 block">
            Tipo Acto
          </label>
          <select
            value={selectedTipoActo}
            onChange={(e) => setSelectedTipoActo(e.target.value)}
            className="w-full p-2 h-10 border border-black bg-background text-xs focus:outline-none focus:ring-0 font-mono truncate"
          >
            <option value="">Todos</option>
            {tiposActo.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1 min-w-[120px]">
          <label className="text-[10px] font-bold uppercase tracking-normal text-muted-foreground mb-1 block">
            Jurisdicción
          </label>
          <select
            value={selectedOrganismo}
            onChange={(e) => setSelectedOrganismo(e.target.value)}
            className="w-full p-2 h-10 border border-black bg-background text-xs focus:outline-none focus:ring-0 font-mono truncate"
          >
            <option value="">Todas</option>
            {organismos.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nombre}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleClearFilters}
          className="h-10 px-3 border border-black bg-white hover:bg-black hover:text-white transition-colors flex items-center justify-center shrink-0 mt-auto"
          title="Limpiar filtros"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

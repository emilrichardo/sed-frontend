"use client";

import React, { useState, useEffect } from "react";
import { Seccion, TipoActo, Organismo, getTaxonomy } from "@/lib/api";
import { Filter, X, Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [searchTerm, setSearchTerm] = useState("");

  const [isExpanded, setIsExpanded] = useState(false);

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
      jurisdiccion: selectedOrganismo,
      fecha_desde: dateFrom,
      fecha_hasta: dateTo,
      search: searchTerm,
    });
  }, [
    selectedSeccion,
    selectedTipoActo,
    selectedOrganismo,
    dateFrom,
    dateTo,
    onFilterChange,
  ]);

  // Debounced update for search term
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange((prev: any) => ({
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
    <div className="border rounded-lg bg-card overflow-hidden">
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 font-semibold">
          <Filter className="h-4 w-4" />
          <span>Filtros Avanzados</span>
          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full ml-2">
            Beta: Reactivo
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClearFilters();
            }}
            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            Limpiar
          </button>
          <div
            className={cn(
              "p-1 rounded-md hover:bg-accent transition-transform duration-200",
              isExpanded && "rotate-180",
            )}
          >
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          isExpanded
            ? "grid-rows-[1fr] opacity-100 p-4 pt-0"
            : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden space-y-4">
          <div className="h-px bg-border mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="space-y-1.5 lg:col-span-1">
              <label className="text-xs font-medium text-muted-foreground">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Nº de acto, referencia..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 p-2 border rounded-md bg-background text-sm"
                />
              </div>
            </div>

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
        </div>
      </div>
    </div>
  );
}

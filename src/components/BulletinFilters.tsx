"use client";

import React, { useState, useEffect } from "react";
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
  // Removed unused state for sections, act types, and organisms
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Removed taxonomy loading logic

  // Reactive updates for select and date filters
  useEffect(() => {
    onFilterChange({
      fecha_desde: dateFrom,
      fecha_hasta: dateTo,
      search: searchTerm,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo, onFilterChange]);

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
            className="w-full pl-9 p-2 h-10 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 ring-primary/20 font-sans"
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
            className="w-full p-2 h-10 border rounded-md bg-background text-xs focus:outline-none focus:ring-2 ring-primary/20 font-sans"
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
            className="w-full p-2 h-10 border rounded-md bg-background text-xs focus:outline-none focus:ring-2 ring-primary/20 font-sans"
          />
        </div>
      </div>

      <div className="flex gap-2 w-full xl:w-auto shrink-0 overflow-x-auto pb-1 xl:pb-0">
        <button
          onClick={handleClearFilters}
          className="h-10 px-3 border rounded-md bg-background hover:bg-muted transition-colors flex items-center justify-center shrink-0 mt-auto shadow-sm"
          title="Limpiar filtros"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

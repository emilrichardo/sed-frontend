"use client";

import React, { useState } from "react";
import {
  Search,
  Filter,
  List as ListIcon,
  Play,
  X,
  Loader2,
  Table as TableIcon,
} from "lucide-react";

interface Action {
  label: string;
  icon: React.ElementType;
  onClick: (item: Record<string, any>) => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
}

interface Column {
  header: string;
  key: string;
  render?: (item: Record<string, any>) => React.ReactNode;
}

interface EntriesTableProps {
  title: string;
  data: Record<string, any>[];
  columns: Column[];
  actions?: Action[];
  globalActions?: React.ReactNode;
  onProcessAll?: () => void;
  isLoading?: boolean;
  maxHeight?: string;
}

export function EntriesTable({
  title,
  data,
  columns,
  actions = [],
  globalActions,
  onProcessAll,
  isLoading = false,
  maxHeight = "500px",
}: EntriesTableProps) {
  const [viewMode, setViewMode] = useState<"table" | "list">("table");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = data.filter((item) => {
    // Basic search across all string values in item
    const searchStr = searchQuery.toLowerCase();
    return Object.values(item as Record<string, unknown>).some(
      (val) => typeof val === "string" && val.toLowerCase().includes(searchStr),
    );
  });

  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-neutral-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-neutral-900 tracking-tight">{title}</h3>
          <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 text-[10px] font-bold uppercase">
            {data.length} TOTAL
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex bg-neutral-100 p-1 rounded-lg border border-neutral-200">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === "table"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
              title="Vista de tabla"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === "list"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
              title="Vista de lista"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-6 bg-neutral-200 mx-1 hidden sm:block" />

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                showFilters
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                  : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50"
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              Filtros
            </button>

            {onProcessAll && (
              <button
                onClick={onProcessAll}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Procesar todo
              </button>
            )}

            {globalActions}
          </div>
        </div>
      </div>

      {/* Filters (Expandable) */}
      {showFilters && (
        <div className="px-6 py-4 bg-neutral-50 border-b border-neutral-100 animate-in slide-in-from-top-2 duration-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Buscar por cualquier campo..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content Container */}
      <div className="overflow-auto relative bg-white" style={{ maxHeight }}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-neutral-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-indigo-500" />
            <span className="text-sm font-medium">Buscando datos...</span>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <p className="text-sm text-neutral-500 font-medium">
              No se encontraron resultados
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="mt-2 text-xs text-indigo-600 hover:underline font-bold"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : viewMode === "table" ? (
          /* Table View */
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="sticky top-0 bg-neutral-300/98 backdrop-blur-sm z-10 border-b border-neutral-100 shadow-sm">
              <tr className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                {columns.map((col, idx) => (
                  <th key={idx} className="px-6 py-3">
                    {col.header}
                  </th>
                ))}
                {actions.length > 0 && (
                  <th className="px-6 py-3 text-right">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {filteredData.map((item, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="group hover:bg-neutral-50/50 transition-colors"
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      className="px-6 py-3 text-sm text-neutral-700"
                    >
                      {col.render ? col.render(item) : item[col.key]}
                    </td>
                  ))}
                  {actions.length > 0 && (
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {actions.map((action, actionIdx) => (
                          <button
                            key={actionIdx}
                            onClick={() => action.onClick(item)}
                            title={action.label}
                            className={`p-1.5 rounded-md transition-all ${
                              action.variant === "danger"
                                ? "text-red-600 hover:bg-red-50"
                                : action.variant === "primary"
                                  ? "text-indigo-600 hover:bg-indigo-50"
                                  : "text-neutral-500 hover:bg-neutral-100"
                            }`}
                          >
                            <action.icon className="w-4 h-4" />
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          /* List View (Compact) */
          <div className="divide-y divide-neutral-100">
            {filteredData.map((item, idx) => (
              <div
                key={idx}
                className="group px-6 py-3 flex items-center justify-between hover:bg-neutral-50/50 transition-colors"
              >
                <div className="flex flex-col gap-0.5">
                  <div className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                    {/* Assume first column is the "primary" title */}
                    {columns[0].render
                      ? columns[0].render(item)
                      : item[columns[0].key]}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-neutral-500">
                    {columns.slice(1).map((col, cIdx) => (
                      <span key={cIdx} className="flex items-center">
                        {cIdx > 0 && <span className="mx-1.5">•</span>}
                        <strong className="mr-1 inline-block uppercase opacity-60 text-[9px] tracking-tighter">
                          {col.header}:
                        </strong>
                        {col.render ? col.render(item) : item[col.key]}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {actions.map((action, actionIdx) => (
                    <button
                      key={actionIdx}
                      onClick={() => action.onClick(item)}
                      title={action.label}
                      className={`p-1.5 rounded-lg transition-all border border-transparent ${
                        action.variant === "danger"
                          ? "text-red-500 hover:bg-red-50 hover:border-red-100"
                          : action.variant === "primary"
                            ? "text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100"
                            : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 hover:border-neutral-200"
                      }`}
                    >
                      <action.icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-6 py-2 bg-neutral-50 border-top border-neutral-100 flex items-center justify-between text-[10px] text-neutral-400 font-bold uppercase tracking-widest">
        <div>
          {searchQuery
            ? `Resultados: ${filteredData.length}`
            : `Items en total: ${data.length}`}
        </div>
        <div>Santiago en Datos • v2.0</div>
      </div>
    </div>
  );
}

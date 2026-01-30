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
  ChevronDown,
} from "lucide-react";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import * as Separator from "@radix-ui/react-separator";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Action {
  label: string;
  icon: React.ElementType;
  onClick: (item: Record<string, unknown>) => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
}

interface Column {
  header: string;
  key: string;
  render?: (item: Record<string, unknown>) => React.ReactNode;
}

interface EntriesTableProps {
  title: string;
  data: Record<string, unknown>[];
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
    const searchStr = searchQuery.toLowerCase();
    return Object.values(item as Record<string, unknown>).some(
      (val) => typeof val === "string" && val.toLowerCase().includes(searchStr),
    );
  });

  return (
    <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col h-full ring-0">
      {/* Header */}
      <div className="px-6 py-4 border-b-2 border-black bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-neutral-900 tracking-tight">{title}</h3>
          <span className="px-3 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-wider border-2 border-black">
            {data.length} TOTAL
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Radix ToggleGroup for View Mode */}
          <ToggleGroup.Root
            type="single"
            value={viewMode}
            onValueChange={(value) => {
              if (value) setViewMode(value as "table" | "list");
            }}
            className="flex bg-white p-1 border-2 border-black"
            aria-label="Modo de visualización"
          >
            <ToggleGroup.Item
              value="table"
              className={cn(
                "p-1.5 transition-all outline-none focus:ring-0",
                viewMode === "table"
                  ? "bg-black text-white"
                  : "text-neutral-500 hover:text-black hover:bg-neutral-100",
              )}
              title="Vista de tabla"
            >
              <TableIcon className="w-4 h-4" />
            </ToggleGroup.Item>
            <ToggleGroup.Item
              value="list"
              className={cn(
                "p-1.5 transition-all outline-none focus:ring-0",
                viewMode === "list"
                  ? "bg-black text-white"
                  : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100",
              )}
              title="Vista de lista"
            >
              <ListIcon className="w-4 h-4" />
            </ToggleGroup.Item>
          </ToggleGroup.Root>

          <Separator.Root
            orientation="vertical"
            className="w-0.5 h-6 bg-black mx-2 hidden sm:block"
          />

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant={showFilters ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "gap-2 font-bold h-8",
                showFilters && "bg-black text-white hover:bg-black/90",
              )}
            >
              <Filter className="w-3.5 h-3.5" />
              Filtros
            </Button>

            {onProcessAll && (
              <Button
                size="sm"
                onClick={onProcessAll}
                className="gap-2 font-bold bg-primary hover:bg-primary/90 h-8 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[1px]"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Procesar todo
              </Button>
            )}

            {globalActions}
          </div>
        </div>
      </div>

      {/* Filters (Expandable) */}
      {showFilters && (
        <div className="px-6 py-4 bg-neutral-50 border-b-2 border-black animate-in slide-in-from-top-2 duration-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input
              type="text"
              placeholder="Buscar por cualquier campo..."
              className="pl-10 pr-10 py-2 h-9 border-2 border-black focus-visible:ring-0 shadow-none bg-white font-mono"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Radix ScrollArea for Content */}
      <ScrollArea.Root
        className="flex-1 overflow-hidden bg-white"
        style={{ height: maxHeight }}
      >
        <ScrollArea.Viewport className="h-full w-full rounded-none">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-neutral-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-indigo-500" />
              <span className="text-sm font-medium">Buscando datos...</span>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <p className="text-sm text-neutral-500 font-medium opacity-60">
                No se encontraron resultados
              </p>
              {searchQuery && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="mt-1 text-indigo-600 font-bold"
                >
                  Limpiar búsqueda
                </Button>
              )}
            </div>
          ) : viewMode === "table" ? (
            /* Table View */
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead className="sticky top-0 bg-white z-10 border-b-2 border-black shadow-none">
                <tr className="text-[12px] font-bold text-black uppercase tracking-widest border-b-2 border-black">
                  {columns.map((col, idx) => (
                    <th key={idx} className="px-6 py-3.5">
                      {col.header}
                    </th>
                  ))}
                  {actions.length > 0 && (
                    <th className="px-6 py-3.5 text-right">Acciones</th>
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
                        {col.render
                          ? col.render(item)
                          : (item[col.key] as React.ReactNode)}
                      </td>
                    ))}
                    {actions.length > 0 && (
                      <td className="px-6 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-10 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          {actions.map((action, actionIdx) => (
                            <Button
                              key={actionIdx}
                              variant="ghost"
                              size="icon"
                              onClick={() => action.onClick(item)}
                              title={action.label}
                              className={cn(
                                "h-8 w-8",
                                action.variant === "danger"
                                  ? "text-red-600 hover:bg-red-50 hover:text-red-700"
                                  : action.variant === "primary"
                                    ? "text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                                    : "text-neutral-500 hover:bg-neutral-100",
                              )}
                            >
                              <action.icon className="w-4 h-4" />
                            </Button>
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
                  className="group px-6 py-3.5 flex items-center justify-between hover:bg-neutral-50/50 transition-colors"
                >
                  <div className="flex flex-col gap-1">
                    <div className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                      {columns[0].render
                        ? columns[0].render(item)
                        : (item[columns[0].key] as React.ReactNode)}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-neutral-500">
                      {columns.slice(1).map((col, cIdx) => (
                        <span
                          key={cIdx}
                          className="flex items-center bg-neutral-50 px-1.5 py-0.5 rounded border border-neutral-100 shadow-sm"
                        >
                          <strong className="mr-1.5 inline-block uppercase text-[9px] font-extrabold text-neutral-400">
                            {col.header}
                          </strong>
                          <span className="text-neutral-600">
                            {col.render
                              ? col.render(item)
                              : (item[col.key] as React.ReactNode)}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-10 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Radix DropdownMenu for Actions on small space */}
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-neutral-400"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content className="z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white p-1 text-neutral-900 shadow-md animate-in fade-in-80 zoom-in-95 data-[side=bottom]:slide-in-from-top-2">
                          {actions.map((action, aIdx) => (
                            <DropdownMenu.Item
                              key={aIdx}
                              onClick={() => action.onClick(item)}
                              className={cn(
                                "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-xs font-bold outline-none transition-colors focus:bg-neutral-100 focus:text-neutral-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                                action.variant === "danger" &&
                                  "text-red-600 focus:bg-red-50 focus:text-red-700",
                              )}
                            >
                              <action.icon className="mr-2 h-3.5 w-3.5" />
                              {action.label}
                            </DropdownMenu.Item>
                          ))}
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar
          className="flex select-none touch-none p-0.5 bg-neutral-100 transition-colors duration-[160ms] ease-out hover:bg-neutral-200 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2.5"
          orientation="vertical"
        >
          <ScrollArea.Thumb className="flex-1 bg-neutral-300 rounded-[10px] relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]" />
        </ScrollArea.Scrollbar>
        <ScrollArea.Corner className="bg-neutral-200" />
      </ScrollArea.Root>

      {/* Footer Info */}
      <div className="px-6 py-2.5 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest shadow-inner">
        <div className="flex items-center gap-2">
          {searchQuery ? (
            <span className="text-indigo-600">
              Resultados: {filteredData.length}
            </span>
          ) : (
            <span>Items en total: {data.length}</span>
          )}
        </div>
        <div className="opacity-50 hover:opacity-100 transition-opacity underline decoration-dotted underline-offset-2">
          Santiago en Datos • v2.0
        </div>
      </div>
    </div>
  );
}

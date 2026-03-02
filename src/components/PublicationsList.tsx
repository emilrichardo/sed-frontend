"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  X,
  ChevronRight,
  Grid2X2,
  LayoutList,
  BarChart2,
  FileText,
  Newspaper,
  TrendingUp,
  BookOpen,
  SlidersHorizontal,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { WideCard } from "@/components/WideCard";

function getTipoIcon(tp: ReportItem["tipo_publicacion"]): {
  Icon: LucideIcon;
  label: string;
} {
  const obj = tp && typeof tp === "object" ? tp : null;
  const text = (obj?.slug ?? obj?.nombre ?? "").toLowerCase();
  if (text.includes("estadistica") || text.includes("estadística"))
    return { Icon: BarChart2, label: obj!.nombre };
  if (text.includes("boletin") || text.includes("boletín"))
    return { Icon: Newspaper, label: obj!.nombre };
  if (text.includes("analisis") || text.includes("análisis"))
    return { Icon: TrendingUp, label: obj!.nombre };
  if (text.includes("informe")) return { Icon: FileText, label: obj!.nombre };
  if (obj?.nombre) return { Icon: BookOpen, label: obj.nombre };
  return { Icon: BookOpen, label: "Publicación" };
}
import type { ReportItem } from "@/lib/api";
import { PublicationTableSlider } from "@/components/PublicationTableSlider";
import { extractAllTablaBlocks, shouldShowChart } from "@/utils/publicacion";

export interface FlatPublication extends ReportItem {
  parentTitle?: string;
  parentSlug?: string;
  parentId?: number;
}

type ViewMode = "grid" | "wide" | "agrupado";

type TaxItem = { id: string | number; nombre: string; slug?: string };

interface Props {
  items: FlatPublication[];
  allCategories: TaxItem[];
}

function getDescription(item: ReportItem): string {
  const contenido = item.contenido as {
    root?: {
      children?: Array<{
        children?: Array<{ text?: string }>;
      }>;
    };
  };
  if (contenido?.root?.children) {
    const firstParagraph = contenido.root.children.find(
      (child) =>
        child.children && child.children.length > 0 && child.children[0]?.text,
    );
    if (firstParagraph) return firstParagraph.children![0].text || "";
  }
  return "";
}

function getItemTags(item: ReportItem): TaxItem[] {
  return [
    ...((item.categorias as TaxItem[]) || []),
    ...((item.tags as TaxItem[]) || []),
    ...((item.taxonomias as TaxItem[]) || []),
  ];
}

function getImg(item: ReportItem) {
  const img = item.imagen_destacada as
    | { url?: string; alt?: string }
    | undefined;
  return img?.url ? img : null;
}

// ── Grid card ─────────────────────────────────────────────────────────────────

function GridCard({ item }: { item: FlatPublication }) {
  const date = item.publishedDate || item.createdAt;
  const img = getImg(item);
  const tags = getItemTags(item);

  const useChart = shouldShowChart(item);
  const tablaBlocks = useChart ? extractAllTablaBlocks(item.contenido) : [];
  const hasTables = tablaBlocks.length > 0;

  return (
    <div className="group flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-all h-full">
      {/* Image / Chart preview */}
      <div
        className={`relative ${hasTables ? "h-[500px]" : "aspect-[16/9]"} shrink-0 bg-background overflow-hidden border-b border-border`}
      >
        {!useChart && img ? (
          <Link
            href={`/publicaciones/${item.slug}`}
            className="block w-full h-full relative"
          >
            <Image
              src={img.url!}
              alt={img.alt || item.titulo}
              fill
              unoptimized
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 50vw"
            />
          </Link>
        ) : hasTables ? (
          <div className="absolute inset-0">
            <PublicationTableSlider blocks={tablaBlocks} />
          </div>
        ) : (
          (() => {
            const { Icon, label } = getTipoIcon(item.tipo_publicacion);
            return (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted/40">
                <Icon
                  className="h-14 w-14 text-muted-foreground/25"
                  strokeWidth={1}
                />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">
                  {label}
                </span>
              </div>
            );
          })()
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        {item.parentTitle && (
          <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-0.5">
            <span className="truncate">{item.parentTitle}</span>
            <ChevronRight className="h-3 w-3 shrink-0" />
          </p>
        )}

        <h3 className="font-semibold text-base leading-snug group-hover:text-primary transition-colors line-clamp-2">
          <Link
            href={`/publicaciones/${item.slug}`}
            className="hover:underline"
          >
            {item.titulo}
          </Link>
        </h3>

        <div className="mt-3 flex items-end justify-between gap-2">
          <div className="flex gap-1 flex-wrap">
            {tags.slice(0, 2).map((t) => (
              <span
                key={t.id}
                className="px-1.5 py-0.5 bg-muted rounded text-[10px] text-muted-foreground"
              >
                {t.nombre}
              </span>
            ))}
          </div>
          {date && (
            <span className="text-[10px] text-muted-foreground shrink-0">
              {new Date(date).toLocaleDateString("es-AR", {
                year: "numeric",
                month: "short",
              })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Grouped card ──────────────────────────────────────────────────────────────

interface GroupedNode extends FlatPublication {
  children: FlatPublication[];
}

function GroupedCard({ node }: { node: GroupedNode }) {
  const date = node.publishedDate || node.createdAt;
  const img = getImg(node);
  const tags = getItemTags(node);

  const useChart = shouldShowChart(node);
  const tablaBlocks = useChart ? extractAllTablaBlocks(node.contenido) : [];
  const hasTables = tablaBlocks.length > 0;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className={`flex ${hasTables ? "flex-col" : "items-stretch"}`}>
        {/* Image / Chart preview */}
        {!hasTables ? (
          <Link
            href={`/publicaciones/${node.slug}`}
            className="relative w-48 shrink-0 bg-background block group overflow-hidden border-r border-border"
          >
            {img ? (
              <Image
                src={img.url!}
                alt={img.alt || node.titulo}
                fill
                unoptimized
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="192px"
              />
            ) : (
              (() => {
                const { Icon, label } = getTipoIcon(node.tipo_publicacion);
                return (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/40">
                    <Icon
                      className="h-10 w-10 text-muted-foreground/25"
                      strokeWidth={1}
                    />
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">
                      {label}
                    </span>
                  </div>
                );
              })()
            )}
          </Link>
        ) : (
          <div className="relative h-[500px] w-full shrink-0 border-b border-border bg-background">
            <PublicationTableSlider blocks={tablaBlocks} />
          </div>
        )}

        {/* Meta */}
        <div className="flex-1 min-w-0 p-5">
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/publicaciones/${node.slug}`}
              className="font-semibold text-base leading-snug hover:text-primary transition-colors"
            >
              {node.titulo}
            </Link>
            {date && (
              <span className="text-xs text-muted-foreground shrink-0">
                {new Date(date).toLocaleDateString("es-AR", {
                  year: "numeric",
                  month: "short",
                })}
              </span>
            )}
          </div>

          <div className="mt-2 flex gap-1.5 flex-wrap">
            {tags.map((t) => (
              <span
                key={t.id}
                className="px-2 py-0.5 bg-muted rounded-full text-xs text-muted-foreground"
              >
                {t.nombre}
              </span>
            ))}
          </div>
        </div>
      </div>

      {node.children.length > 0 && (
        <ul className="border-t px-5 py-3 space-y-1">
          {node.children.map((child) => (
            <li key={child.id}>
              <Link
                href={`/publicaciones/${child.slug}`}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors py-0.5"
              >
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-primary" />
                {child.titulo}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function PublicationsList({ items, allCategories }: Props) {
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<
    Set<string | number>
  >(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>("wide");
  const [filterOpen, setFilterOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const matchesFilters = (item: FlatPublication) => {
    if (search && !item.titulo.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (selectedCategories.size > 0) {
      const ids = getItemTags(item).map((t) => t.id);
      if (!ids.some((id) => selectedCategories.has(id))) return false;
    }
    return true;
  };

  const filteredGrid = useMemo(
    () => items.filter(matchesFilters),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, search, selectedCategories],
  );

  const filteredGrouped = useMemo<GroupedNode[]>(() => {
    const roots = items.filter((i) => !i.parentId);
    return roots
      .map((root) => {
        const children = items.filter((i) => i.parentId === root.id);
        const rootMatches = matchesFilters(root);
        const matchingChildren = children.filter(matchesFilters);
        if (!rootMatches && matchingChildren.length === 0) return null;
        return {
          ...root,
          children: rootMatches ? children : matchingChildren,
        } as GroupedNode;
      })
      .filter(Boolean) as GroupedNode[];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, search, selectedCategories]);

  const toggleCategory = (id: string | number) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const hasActiveFilters = !!search || selectedCategories.size > 0;
  const clearAll = () => {
    setSearch("");
    setSelectedCategories(new Set());
  };
  const resultCount =
    viewMode === "grid" ? filteredGrid.length : filteredGrouped.length;

  return (
    <div className="space-y-4">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter button */}
        <div className="relative shrink-0" ref={filterRef}>
          <button
            onClick={() => { setFilterOpen((o) => !o); setMoreOpen(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              selectedCategories.size > 0
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtros
            {selectedCategories.size > 0 && (
              <span className="ml-0.5 bg-primary-foreground/20 rounded-full px-1.5 text-[10px] font-bold">
                {selectedCategories.size}
              </span>
            )}
          </button>
          {filterOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-background shadow-lg z-50 p-2 space-y-1">
              {allCategories.length === 0 ? (
                <p className="text-xs text-muted-foreground px-2 py-1">Sin categorías</p>
              ) : (
                allCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedCategories.has(cat.id)
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    {cat.nombre}
                  </button>
                ))
              )}
              {selectedCategories.size > 0 && (
                <>
                  <div className="my-1 border-t border-border" />
                  <button
                    onClick={() => { setSelectedCategories(new Set()); setFilterOpen(false); }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-destructive hover:bg-destructive/10 transition-all"
                  >
                    Limpiar filtros
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* 3-dot menu */}
        <div className="relative shrink-0" ref={moreRef}>
          <button
            onClick={() => { setMoreOpen((o) => !o); setFilterOpen(false); }}
            className="p-1.5 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground transition-colors"
            title="Más opciones"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {moreOpen && (
            <div className="absolute right-0 mt-2 w-44 rounded-xl border border-border bg-background shadow-lg z-50 p-2 space-y-1">
              <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Vista</p>
              {([
                { mode: "wide" as ViewMode, Icon: LayoutList, label: "Amplio" },
                { mode: "grid" as ViewMode, Icon: Grid2X2, label: "Grid" },
                { mode: "agrupado" as ViewMode, Icon: ChevronRight, label: "Agrupado" },
              ] as const).map(({ mode, Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => { setViewMode(mode); setMoreOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    viewMode === mode
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
              {hasActiveFilters && (
                <>
                  <div className="my-1 border-t border-border" />
                  <button
                    onClick={() => { clearAll(); setMoreOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-destructive hover:bg-destructive/10 transition-all"
                  >
                    <X className="h-3.5 w-3.5" />
                    Limpiar todo
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Results bar ── */}
      <div className="flex items-center justify-between text-xs text-muted-foreground border-b pb-3">
        <span>
          <span className="font-medium text-foreground">{resultCount}</span>{" "}
          {viewMode === "grid"
            ? `publicación${resultCount !== 1 ? "es" : ""}`
            : `grupo${resultCount !== 1 ? "s" : ""}`}
          {hasActiveFilters && " encontrados"}
        </span>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-primary hover:underline"
          >
            <X className="h-3 w-3" />
            Limpiar filtros
          </button>
        )}
      </div>

      {/* ── Results ── */}
      {resultCount === 0 ? (
        <div className="text-center py-20 border rounded-xl border-dashed">
          <p className="text-muted-foreground italic text-sm">
            No hay publicaciones que coincidan con los filtros.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {filteredGrid.map((item) => (
            <GridCard key={item.id} item={item} />
          ))}
        </div>
      ) : viewMode === "wide" ? (
        <div className="space-y-6">
          {filteredGrid.map((item) => (
            <WideCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGrouped.map((node) => (
            <GroupedCard key={node.id} node={node} />
          ))}
        </div>
      )}
    </div>
  );
}

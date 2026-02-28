"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { ArrowUpRight, Search, X, ChevronLeft } from "lucide-react";
import type { Category } from "@/lib/api";

export interface CategoryWithChildren extends Category {
  children: Category[];
}

interface Publication {
  id: string | number;
  titulo: string;
  slug: string;
  tipo_publicacion?:
    | { id: string | number; nombre: string; slug?: string }
    | number
    | null;
}

interface TipoFilter {
  id: string | number;
  nombre: string;
}

interface CategoryBrowserProps {
  /** Full category tree (roots with children) */
  categories: CategoryWithChildren[];
  /** If provided, browser opens directly on this category's detail panel */
  initialCategory?: CategoryWithChildren | null;
  /** Called when the overlay should close */
  onClose: () => void;
}

export function CategoryBrowser({
  categories,
  initialCategory,
  onClose,
}: CategoryBrowserProps) {
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<CategoryWithChildren | null>(
    initialCategory ?? null,
  );
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState<string | number | null>(
    null,
  );

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Fetch publications when a category is selected
  useEffect(() => {
    if (!selectedCat) {
      setPublications([]);
      return;
    }
    setLoading(true);
    setPublications([]);
    setSelectedTipo(null);
    fetch(
      `/api-proxy/publicaciones?where[categorias][in][0]=${selectedCat.id}&limit=20&sort=-createdAt&depth=1`,
    )
      .then((r) => r.json())
      .then((data) => {
        setPublications(data.docs || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedCat]);

  // Filter categories by search query
  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.children?.some((ch) => ch.nombre.toLowerCase().includes(q)),
    );
  }, [categories, search]);

  // Unique publication tipos
  const tipos = useMemo<TipoFilter[]>(() => {
    const map = new Map<string | number, TipoFilter>();
    publications.forEach((pub) => {
      const tp = pub.tipo_publicacion;
      if (tp && typeof tp === "object" && "id" in tp && !map.has(tp.id)) {
        map.set(tp.id, { id: tp.id, nombre: tp.nombre });
      }
    });
    return Array.from(map.values());
  }, [publications]);

  // Publications filtered by selected tipo
  const visiblePubs = useMemo(() => {
    if (!selectedTipo) return publications;
    return publications.filter((pub) => {
      const tp = pub.tipo_publicacion;
      return (
        tp && typeof tp === "object" && "id" in tp && tp.id === selectedTipo
      );
    });
  }, [publications, selectedTipo]);

  const handleNavigate = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <div className="md:hidden fixed inset-0 z-[60] bg-background flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-4 border-b border-border shrink-0 h-14">
        {selectedCat ? (
          <button
            onClick={() => setSelectedCat(null)}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors shrink-0"
            aria-label="Volver a categorías"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        ) : null}

        <h2 className="flex-1 text-base font-heading font-bold truncate">
          {selectedCat ? selectedCat.nombre : "Categorías"}
        </h2>

        {selectedCat && (
          <Link
            href={`/categorias/${selectedCat.slug}`}
            onClick={handleNavigate}
            className="flex items-center gap-1 text-xs text-primary font-medium shrink-0 mr-1 hover:underline"
          >
            Ver todo
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        )}

        <button
          onClick={onClose}
          className="p-2 border border-border rounded-full hover:bg-muted transition-colors shrink-0"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ── Search (only on main list) ── */}
      {!selectedCat && (
        <div className="px-4 py-3 border-b border-border shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Buscar categorías o publicaciones..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-muted/50 rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 border border-border"
              autoFocus
            />
          </div>
        </div>
      )}

      {/* ── Sliding panels ── */}
      <div className="flex-1 overflow-hidden relative">
        {/* Panel 1: Categories list */}
        <div
          className={`absolute inset-0 transition-transform duration-300 ease-in-out overflow-y-auto pb-24 ${
            selectedCat ? "-translate-x-full" : "translate-x-0"
          }`}
        >
          <div className="flex flex-col">
            {filteredCategories.length === 0 && (
              <p className="px-4 py-12 text-sm text-muted-foreground text-center">
                No se encontraron categorías.
              </p>
            )}
            {filteredCategories.map((cat) => (
              <div key={cat.id} className="border-b border-border flex items-stretch">
                {/* Text area → opens detail panel */}
                <button
                  onClick={() => setSelectedCat(cat)}
                  className="flex-1 flex items-center px-4 py-5 hover:bg-muted/50 transition-colors group text-left min-w-0"
                >
                  <span className="text-2xl font-heading font-bold tracking-tight group-hover:text-primary transition-colors">
                    {cat.nombre}
                  </span>
                </button>
                {/* Arrow → navigates to category page */}
                <Link
                  href={`/categorias/${cat.slug}`}
                  onClick={handleNavigate}
                  className="flex items-center justify-center px-5 border-l border-border hover:bg-muted/50 transition-colors shrink-0 group"
                  title={`Ir a ${cat.nombre}`}
                >
                  <ArrowUpRight className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Panel 2: Category detail */}
        <div
          className={`absolute inset-0 transition-transform duration-300 ease-in-out overflow-y-auto pb-24 ${
            selectedCat ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {selectedCat && (
            <>
              {/* ── Subcategories ── */}
              {(selectedCat.children?.length ?? 0) > 0 && (
                <div>
                  <p className="px-4 pt-5 pb-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    Subcategorías
                  </p>
                  {selectedCat.children.map((sub) => (
                    <Link
                      key={sub.id}
                      href={`/categorias/${sub.slug}`}
                      onClick={handleNavigate}
                      className="flex items-center justify-between w-full px-4 py-5 border-b border-border hover:bg-muted/50 transition-colors group"
                    >
                      <span className="text-2xl font-heading font-bold tracking-tight group-hover:text-primary transition-colors">
                        {sub.nombre}
                      </span>
                      <ArrowUpRight className="h-6 w-6 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                    </Link>
                  ))}
                </div>
              )}

              {/* ── Publications ── */}
              <div>
                <div className="flex items-baseline gap-2 px-4 pt-5 pb-2">
                  <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    Publicaciones
                  </p>
                  {!loading && publications.length > 0 && (
                    <span className="text-xs font-mono text-foreground">
                      {publications.length}
                    </span>
                  )}
                </div>

                {/* Type filters */}
                {!loading && tipos.length > 1 && (
                  <div className="px-4 pb-3 flex gap-2 flex-wrap">
                    <button
                      onClick={() => setSelectedTipo(null)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        selectedTipo === null
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-background text-muted-foreground border-border hover:text-foreground"
                      }`}
                    >
                      Todos
                      <span className="ml-1.5 opacity-60 tabular-nums">
                        {publications.length}
                      </span>
                    </button>
                    {tipos.map((tp) => {
                      const count = publications.filter((p) => {
                        const t = p.tipo_publicacion;
                        return (
                          t &&
                          typeof t === "object" &&
                          "id" in t &&
                          t.id === tp.id
                        );
                      }).length;
                      return (
                        <button
                          key={tp.id}
                          onClick={() =>
                            setSelectedTipo(
                              selectedTipo === tp.id ? null : tp.id,
                            )
                          }
                          className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                            selectedTipo === tp.id
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "bg-background text-muted-foreground border-border hover:text-foreground"
                          }`}
                        >
                          {tp.nombre}
                          <span className="ml-1.5 opacity-60 tabular-nums">
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {loading ? (
                  <div className="px-4 py-8 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : visiblePubs.length > 0 ? (
                  <>
                    {visiblePubs.map((pub) => (
                      <Link
                        key={pub.id}
                        href={`/publicaciones/${pub.slug}`}
                        onClick={handleNavigate}
                        className="flex items-center justify-between w-full px-4 py-4 border-b border-border hover:bg-muted/50 transition-colors group"
                      >
                        <span className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2 pr-4 leading-snug">
                          {pub.titulo}
                        </span>
                        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                      </Link>
                    ))}
                    <Link
                      href={`/categorias/${selectedCat.slug}`}
                      onClick={handleNavigate}
                      className="flex items-center justify-center gap-2 w-full px-4 py-5 text-sm text-primary font-medium hover:bg-muted/50 transition-colors"
                    >
                      Ver todas las publicaciones
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </>
                ) : (
                  <p className="px-4 py-4 text-sm text-muted-foreground">
                    No hay publicaciones en esta categoría.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

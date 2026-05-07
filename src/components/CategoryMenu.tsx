"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { Search, ChevronLeft, ArrowUpRight, X } from "lucide-react";
import { API_URL } from "@/lib/api";

// ── Types ────────────────────────────────────────────────────────────────────

interface Category {
  id: string | number;
  nombre: string;
  slug: string;
}

export interface CategoryWithChildren extends Category {
  children: Category[];
}

interface Publication {
  id: number | string;
  titulo: string;
  slug: string;
  tipo_publicacion?: { id?: string | number; nombre: string } | string | null;
}

type TipoFilter = { id: string | number; nombre: string };

export interface CategoryMenuProps {
  categories: CategoryWithChildren[];
  /** When true, renders as a full-screen drawer with close button */
  isDrawer?: boolean;
  onClose?: () => void;
}

// ── Detail panel content (subcategories + publications) ───────────────────────

interface DetailPanelProps {
  category: CategoryWithChildren;
  onNavigate: () => void;
}

export function CategoryDetailPanel({
  category,
  onNavigate,
}: DetailPanelProps) {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState<string | number | null>(
    null,
  );

  useEffect(() => {
    setLoading(true);
    setPublications([]);
    setSelectedTipo(null);
    fetch(
      `${API_URL}/publicaciones?where[categorias][in][0]=${category.id}&limit=30&sort=orden,-createdAt&depth=1`,
    )
      .then((r) => r.json())
      .then((data) => {
        setPublications(data.docs || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [category.id]);

  // Extract unique tipos
  const tipos = useMemo<TipoFilter[]>(() => {
    const map = new Map<string | number, TipoFilter>();
    publications.forEach((pub) => {
      const tp = pub.tipo_publicacion;
      if (tp && typeof tp === "object" && tp.id && !map.has(tp.id)) {
        map.set(tp.id, { id: tp.id, nombre: tp.nombre });
      }
    });
    return Array.from(map.values());
  }, [publications]);

  const visiblePubs = useMemo(
    () =>
      selectedTipo === null
        ? publications
        : publications.filter((pub) => {
            const tp = pub.tipo_publicacion;
            return tp && typeof tp === "object" && tp.id === selectedTipo;
          }),
    [publications, selectedTipo],
  );

  return (
    <div className="overflow-y-auto h-full pb-4">
      {/* Subcategories */}
      {(category.children.length > 0 ||
        category.slug === "finanzas-provinciales") && (
        <div>
          <p className="px-4 pt-5 pb-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Subcategorías
          </p>
          {category.slug === "finanzas-provinciales" && (
            <>
              <Link
                href="/ingresos"
                onClick={onNavigate}
                className="flex items-center justify-between w-full px-4 py-5 border-b border-border hover:bg-muted/50 transition-colors group"
              >
                <span className="text-2xl font-heading font-bold tracking-tight group-hover:text-primary transition-colors">
                  Ingresos de la Provincia
                </span>
                <ArrowUpRight className="h-6 w-6 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
              <Link
                href="/ahorros"
                onClick={onNavigate}
                className="flex items-center justify-between w-full px-4 py-5 border-b border-border hover:bg-muted/50 transition-colors group"
              >
                <span className="text-2xl font-heading font-bold tracking-tight group-hover:text-primary transition-colors">
                  Ahorros de la Provincia
                </span>
                <ArrowUpRight className="h-6 w-6 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            </>
          )}
          {category.children
            .filter(
              (sub) =>
                sub.slug !== "ingresos-de-la-provincia" &&
                sub.slug !== "ahorros-de-la-provincia",
            )
            .map((sub) => (
            <Link
              key={sub.id}
              href={`/categorias/${sub.slug}`}
              onClick={onNavigate}
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

      {/* Publications — only shown when there are no subcategories */}
      {(category.children.length > 0 || category.slug === "finanzas-provinciales") ? null : <div>
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

        {/* Type filter pills */}
        {!loading && tipos.length > 1 && (
          <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
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
              const count = publications.filter((pub) => {
                const t = pub.tipo_publicacion;
                return t && typeof t === "object" && t.id === tp.id;
              }).length;
              return (
                <button
                  key={tp.id}
                  onClick={() =>
                    setSelectedTipo(selectedTipo === tp.id ? null : tp.id)
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
                onClick={onNavigate}
                className="flex items-center justify-between w-full px-4 py-4 border-b border-border hover:bg-muted/50 transition-colors group"
              >
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 pr-4 leading-snug">
                  {pub.titulo}
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            ))}
            <Link
              href={`/categorias/${category.slug}`}
              onClick={onNavigate}
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
      </div>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function CategoryMenu({
  categories,
  isDrawer = false,
  onClose,
}: CategoryMenuProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryWithChildren | null>(null);
  const [searchValue, setSearchValue] = useState("");

  // Real-time search: publications from API
  const [searchPubs, setSearchPubs] = useState<Publication[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // For home-page inline mode: overlay state
  const [overlayCategory, setOverlayCategory] =
    useState<CategoryWithChildren | null>(null);

  const handleBack = () => {
    setSelectedCategory(null);
    setSearchValue("");
    setSearchPubs([]);
  };

  const handleClose = () => {
    setSelectedCategory(null);
    setSearchValue("");
    setSearchPubs([]);
    onClose?.();
  };

  const handleNavigate = () => {
    handleClose();
    setOverlayCategory(null);
  };

  // Filter categories by search (local)
  const filteredCategories = searchValue
    ? categories.filter((cat) =>
        cat.nombre.toLowerCase().includes(searchValue.toLowerCase()),
      )
    : categories;

  // Debounced real-time search for publications
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchValue.trim() || searchValue.trim().length < 2) {
      setSearchPubs([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    debounceRef.current = setTimeout(() => {
      fetch(
        `${API_URL}/publicaciones?where[titulo][like]=${encodeURIComponent(searchValue.trim())}&limit=10&depth=0`,
      )
        .then((r) => r.json())
        .then((data) => {
          setSearchPubs(data.docs || []);
          setSearchLoading(false);
        })
        .catch(() => setSearchLoading(false));
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchValue]);

  const isSearching = searchValue.trim().length >= 2;

  // ── HOME PAGE inline mode (with overlay on click) ───────────────────────────
  if (!isDrawer) {
    return (
      <>
        <nav aria-label="Categorías principales">
          {categories.map((cat, idx) => (
            <div
              key={cat.id}
              className="border-t border-border flex items-stretch"
            >
              {/* Text → opens overlay */}
              <button
                onClick={() => setOverlayCategory(cat)}
                className="flex-1 flex items-center gap-4 px-4 md:px-8 py-5 hover:bg-muted/50 transition-colors group text-left min-w-0"
              >
                <span className="text-xs font-mono text-muted-foreground shrink-0 tabular-nums w-5 text-right">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span className="text-2xl md:text-3xl font-heading font-bold tracking-tight group-hover:text-primary transition-colors">
                  {cat.nombre}
                </span>
              </button>
              {/* Arrow → navigates to category page */}
              <Link
                href={`/categorias/${cat.slug}`}
                className="flex items-center justify-center px-5 md:px-8 hover:bg-muted/50 transition-colors shrink-0 group"
                title={`Ir a ${cat.nombre}`}
              >
                <ArrowUpRight className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            </div>
          ))}
        </nav>

        {/* Full-screen overlay when a category is selected from home page */}
        {overlayCategory && (
          <div
            className="md:hidden fixed top-0 left-0 right-0 z-[55] bg-background flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300"
            style={{
              bottom:
                "calc(4rem + var(--mobile-browser-bottom-inset, 0px))",
            }}
          >
            {/* Overlay header */}
            <div className="flex items-center gap-2 px-4 border-b border-border shrink-0 h-14">
              <h2 className="flex-1 text-base font-heading font-bold truncate">
                {overlayCategory.nombre}
              </h2>
              <Link
                href={`/categorias/${overlayCategory.slug}`}
                onClick={() => setOverlayCategory(null)}
                className="flex items-center gap-1 text-xs text-primary font-medium shrink-0 mr-1 hover:underline"
              >
                Ver todo
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
              <button
                onClick={() => setOverlayCategory(null)}
                className="p-2 border border-border rounded-full hover:bg-muted transition-colors shrink-0"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Overlay content */}
            <div className="flex-1 overflow-hidden">
              <CategoryDetailPanel
                category={overlayCategory}
                onNavigate={() => setOverlayCategory(null)}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  // ── MOBILE DRAWER mode (full-screen from bottom nav) ────────────────────────

  return (
    <div
      className="md:hidden fixed top-0 left-0 right-0 z-[55] bg-background animate-in fade-in slide-in-from-bottom-4 duration-300 flex flex-col"
      style={{
        bottom: "calc(4rem + var(--mobile-browser-bottom-inset, 0px))",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 border-b border-border shrink-0 h-14">
        {selectedCategory ? (
          <button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors shrink-0"
            aria-label="Volver"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        ) : null}

        <h2 className="flex-1 text-base font-heading font-bold truncate">
          {selectedCategory ? selectedCategory.nombre : "Categorías"}
        </h2>

        {selectedCategory && (
          <Link
            href={`/categorias/${selectedCategory.slug}`}
            onClick={handleNavigate}
            className="flex items-center gap-1 text-xs text-primary font-medium shrink-0 mr-1 hover:underline"
          >
            Ver todo
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        )}

        <button
          onClick={handleClose}
          className="p-2 border border-border rounded-full hover:bg-muted shrink-0 transition-colors"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Sliding panels */}
      <div className="flex-1 overflow-hidden relative">
        {/* Panel 1: Category list */}
        <div
          className={`absolute inset-0 transition-transform duration-300 ease-in-out flex flex-col ${
            selectedCategory ? "-translate-x-full" : "translate-x-0"
          }`}
        >
          {/* Search bar */}
          <div className="px-4 py-3 border-b border-border shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="search"
                placeholder="Buscar categorías y publicaciones..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {searchValue && (
                <button
                  onClick={() => setSearchValue("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Categories + real-time publication results */}
          <div className="flex-1 overflow-y-auto pb-4">
            {isSearching ? (
              <>
                {/* Matching categories */}
                {filteredCategories.length > 0 && (
                  <>
                    <p className="px-4 pt-4 pb-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
                      Categorías
                    </p>
                    {filteredCategories.map((cat, idx) => (
                      <div
                        key={cat.id}
                        className="border-b border-border flex items-stretch"
                      >
                        <button
                          onClick={() => setSelectedCategory(cat)}
                          className="flex-1 flex items-center gap-4 px-4 py-4 hover:bg-muted/50 transition-colors group text-left min-w-0"
                        >
                          <span className="text-xs font-mono text-muted-foreground shrink-0 tabular-nums w-5 text-right">
                            {String(idx + 1).padStart(2, "0")}
                          </span>
                          <span className="text-xl font-heading font-bold tracking-tight group-hover:text-primary transition-colors">
                            {cat.nombre}
                          </span>
                        </button>
                        <Link
                          href={`/categorias/${cat.slug}`}
                          onClick={handleNavigate}
                          className="flex items-center justify-center px-5 hover:bg-muted/50 transition-colors shrink-0 group"
                          title={`Ir a ${cat.nombre}`}
                        >
                          <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </Link>
                      </div>
                    ))}
                  </>
                )}

                {/* Matching publications */}
                <p className="px-4 pt-4 pb-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  Publicaciones
                  {!searchLoading && searchPubs.length > 0 && (
                    <span className="ml-2 text-foreground">
                      {searchPubs.length}
                    </span>
                  )}
                </p>
                {searchLoading ? (
                  <div className="px-4 py-8 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : searchPubs.length > 0 ? (
                  searchPubs.map((pub) => (
                    <Link
                      key={pub.id}
                      href={`/publicaciones/${pub.slug}`}
                      onClick={handleNavigate}
                      className="flex items-center justify-between w-full px-4 py-3.5 border-b border-border hover:bg-muted/50 transition-colors group"
                    >
                      <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 pr-4 leading-snug">
                        {pub.titulo}
                      </span>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                    </Link>
                  ))
                ) : (
                  <p className="px-4 py-4 text-sm text-muted-foreground">
                    No se encontraron publicaciones.
                  </p>
                )}

                {filteredCategories.length === 0 &&
                  searchPubs.length === 0 &&
                  !searchLoading && (
                    <p className="px-4 pt-4 text-sm text-muted-foreground text-center">
                      No se encontraron resultados.
                    </p>
                  )}
              </>
            ) : (
              <>
                {filteredCategories.map((cat, idx) => (
                  <div
                    key={cat.id}
                    className="border-b border-border flex items-stretch"
                  >
                    {/* Text → slides to detail */}
                    <button
                      onClick={() => setSelectedCategory(cat)}
                      className="flex-1 flex items-center gap-4 px-4 py-5 hover:bg-muted/50 transition-colors group text-left min-w-0"
                    >
                      <span className="text-xs font-mono text-muted-foreground shrink-0 tabular-nums w-5 text-right">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span className="text-2xl font-heading font-bold tracking-tight group-hover:text-primary transition-colors">
                        {cat.nombre}
                      </span>
                    </button>
                    {/* Arrow → navigates to category page */}
                    <Link
                      href={`/categorias/${cat.slug}`}
                      onClick={handleNavigate}
                      className="flex items-center justify-center px-5 hover:bg-muted/50 transition-colors shrink-0 group"
                      title={`Ir a ${cat.nombre}`}
                    >
                      <ArrowUpRight className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    </Link>
                  </div>
                ))}
                {filteredCategories.length === 0 && (
                  <p className="px-4 py-12 text-sm text-muted-foreground text-center">
                    No se encontraron categorías.
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Panel 2: Selected category detail */}
        <div
          className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
            selectedCategory ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {selectedCategory && (
            <CategoryDetailPanel
              category={selectedCategory}
              onNavigate={handleNavigate}
            />
          )}
        </div>
      </div>
    </div>
  );
}

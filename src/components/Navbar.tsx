"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Menu,
  X,
  LogOut,
  User,
  Edit3,
  LayoutDashboard,
  Sun,
  Moon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Home,
  FileText,
  Newspaper,
  Search,
} from "lucide-react";
import type { Category } from "@/lib/api";

interface CategoryWithChildren extends Category {
  children: Category[];
}

interface Publication {
  id: number | string;
  titulo: string;
  slug: string;
  tipo_publicacion?: { nombre: string } | string | null;
}

const navLinks = [
  { name: "Inicio", href: "/" },
  { name: "Boletines", href: "/boletines" },
  { name: "Publicaciones", href: "/publicaciones" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [categoryTree, setCategoryTree] = useState<CategoryWithChildren[]>([]);
  const [mobileCategOpen, setMobileCategOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // Animated category drawer state
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryWithChildren | null>(null);
  const [categoryPublications, setCategoryPublications] = useState<
    Publication[]
  >([]);
  const [loadingPubs, setLoadingPubs] = useState(false);

  const megaMenuTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();
  const { user, logout, isEditing, toggleEditMode, layoutMode, setLayoutMode } =
    useAuth();

  // Theme
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const dark =
      saved === "dark" ||
      (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
    const timer = setTimeout(() => setIsDark(dark), 0);
    return () => clearTimeout(timer);
  }, []);

  // Fetch category tree
  useEffect(() => {
    fetch(
      "/api-proxy/taxonomias?limit=100&depth=1&where[tipo][equals]=categoria&sort=nombre",
    )
      .then((r) => r.json())
      .then((data) => {
        const all: Category[] = data.docs || [];
        const roots = all.filter((c) => !c.parent);
        const childrenList = all.filter((c) => c.parent);
        const tree: CategoryWithChildren[] = roots.map((root) => ({
          ...root,
          children: childrenList.filter((c) => {
            const pid =
              typeof c.parent === "object"
                ? (c.parent as Category)?.id
                : c.parent;
            return String(pid) === String(root.id);
          }),
        }));
        setCategoryTree(tree);
      })
      .catch(() => {});
  }, []);

  // Click outside to close user menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (userMenuOpen && !target.closest(".user-menu")) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [userMenuOpen]);

  // Reset category selection when drawer closes
  useEffect(() => {
    if (!mobileSearchOpen) {
      setSelectedCategory(null);
      setCategoryPublications([]);
    }
  }, [mobileSearchOpen]);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    document.documentElement.classList.toggle("dark", newDark);
    localStorage.setItem("theme", newDark ? "dark" : "light");
  };

  const openMega = () => {
    if (megaMenuTimeout.current) clearTimeout(megaMenuTimeout.current);
    setMegaMenuOpen(true);
  };

  const closeMega = () => {
    megaMenuTimeout.current = setTimeout(() => setMegaMenuOpen(false), 120);
  };

  const handleCategorySelect = (cat: CategoryWithChildren) => {
    setSelectedCategory(cat);
    setLoadingPubs(true);
    setCategoryPublications([]);
    fetch(
      `/api-proxy/publicaciones?where[categorias][in][0]=${cat.id}&limit=10&sort=-createdAt&depth=1`,
    )
      .then((r) => r.json())
      .then((data) => {
        setCategoryPublications(data.docs || []);
        setLoadingPubs(false);
      })
      .catch(() => setLoadingPubs(false));
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setCategoryPublications([]);
  };

  return (
    <>
      <nav className="hidden md:block sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-2xl font-extrabold tracking-tight font-heading">
                  Santiago en Datos
                </span>
              </Link>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-6">
              <div className="flex items-center gap-6 mr-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      pathname === link.href
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}

                {/* Categorías mega menu trigger */}
                {categoryTree.length > 0 && (
                  <div
                    className="relative"
                    onMouseEnter={openMega}
                    onMouseLeave={closeMega}
                  >
                    <button
                      className={`flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary ${
                        megaMenuOpen ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      Categorías
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform duration-200 ${megaMenuOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                  </div>
                )}
              </div>

              {/* User menu */}
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="user-menu flex items-center gap-2 px-3 py-2 rounded-md border border-input bg-background hover:bg-muted transition-colors"
                    >
                      <User className="h-4 w-4 text-muted-foreground" />
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 rounded-md border border-border bg-background shadow-lg z-50">
                        <div className="px-4 py-3 border-b border-border">
                          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-bold">
                            Usuario
                          </p>
                          <p className="text-sm font-medium truncate">
                            {user.email}
                          </p>
                        </div>
                        <div className="py-1">
                          <button
                            onClick={() => {
                              toggleEditMode();
                              setUserMenuOpen(false);
                            }}
                            className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                              isEditing
                                ? "text-primary bg-primary/5 font-semibold"
                                : "text-foreground hover:bg-muted"
                            }`}
                          >
                            <Edit3 className="h-4 w-4" />
                            Modo Edición:{" "}
                            {isEditing ? "Activado" : "Desactivado"}
                          </button>
                          <button
                            onClick={() => {
                              setLayoutMode(
                                layoutMode === "dashboard"
                                  ? "web"
                                  : "dashboard",
                              );
                              setUserMenuOpen(false);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                          >
                            <LayoutDashboard className="h-4 w-4" />
                            {layoutMode === "dashboard"
                              ? "Cambiar a Vista Web"
                              : "Cambiar a Vista Panel"}
                          </button>
                          <button
                            onClick={() => {
                              toggleTheme();
                              setUserMenuOpen(false);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                          >
                            {isDark ? (
                              <>
                                <Sun className="h-4 w-4" />
                                Modo Claro
                              </>
                            ) : (
                              <>
                                <Moon className="h-4 w-4" />
                                Modo Oscuro
                              </>
                            )}
                          </button>
                          <div className="my-1 border-t border-border" />
                          <button
                            onClick={() => {
                              logout();
                              setUserMenuOpen(false);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <LogOut className="h-4 w-4" />
                            Cerrar Sesión
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-muted p-2 rounded-full transition-colors"
                  title="Iniciar Sesión"
                >
                  <User className="h-5 w-5" />
                </Link>
              )}
            </div>

            {/* Mobile hamburger */}
            <div className="md:hidden flex items-center gap-4">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-muted-foreground hover:text-primary transition-colors"
                aria-label="Toggle menu"
              >
                {isOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mega menu panel ── */}
        {megaMenuOpen && categoryTree.length > 0 && (
          <div
            className="absolute left-0 right-0 top-full border-b border-border bg-background shadow-xl z-40"
            onMouseEnter={openMega}
            onMouseLeave={closeMega}
          >
            <div className="container mx-auto px-4 md:px-8 py-8">
              <div
                className="grid gap-x-8 gap-y-6"
                style={{
                  gridTemplateColumns: `repeat(${Math.min(categoryTree.length, 4)}, 1fr)`,
                }}
              >
                {categoryTree.map((cat) => (
                  <div key={cat.id}>
                    {/* Category header */}
                    <Link
                      href={`/categorias/${cat.slug}`}
                      onClick={() => setMegaMenuOpen(false)}
                      className="group flex items-center justify-between mb-3 pb-3 border-b border-border"
                    >
                      <span className="text-lg font-heading font-bold group-hover:text-primary transition-colors">
                        {cat.nombre}
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </Link>

                    {/* Subcategories */}
                    {cat.children.length > 0 ? (
                      <ul className="space-y-1">
                        {cat.children.map((sub) => (
                          <li key={sub.id}>
                            <Link
                              href={`/categorias/${sub.slug}`}
                              onClick={() => setMegaMenuOpen(false)}
                              className="flex items-center gap-2 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                            >
                              <span className="w-1 h-1 rounded-full bg-border group-hover:bg-primary transition-colors shrink-0" />
                              {sub.nombre}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground/50 italic"></p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Mobile menu ── */}
        {isOpen && (
          <div className="md:hidden absolute left-0 right-0 top-16 h-[calc(100vh-4rem)] overflow-y-auto border-t border-border bg-background shadow-lg animate-in slide-in-from-top-2 duration-200">
            <div className="container mx-auto px-4 py-4 space-y-4 pb-20">
              <div className="space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`block px-4 py-2 text-sm font-medium transition-colors rounded-md ${
                      pathname === link.href
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}

                {/* Mobile: Categorías collapsible */}
                {categoryTree.length > 0 && (
                  <div>
                    <button
                      onClick={() => setMobileCategOpen(!mobileCategOpen)}
                      className="flex w-full items-center justify-between px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors"
                    >
                      Categorías
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${mobileCategOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {mobileCategOpen && (
                      <div className="mt-1 ml-4 space-y-3 pb-2">
                        {categoryTree.map((cat) => (
                          <div key={cat.id}>
                            <Link
                              href={`/categorias/${cat.slug}`}
                              onClick={() => {
                                setIsOpen(false);
                                setMobileCategOpen(false);
                              }}
                              className="block px-4 py-1.5 text-sm font-heading font-bold hover:text-primary transition-colors"
                            >
                              {cat.nombre}
                            </Link>
                            {cat.children.map((sub) => (
                              <Link
                                key={sub.id}
                                href={`/categorias/${sub.slug}`}
                                onClick={() => {
                                  setIsOpen(false);
                                  setMobileCategOpen(false);
                                }}
                                className="block px-6 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {sub.nombre}
                              </Link>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-border">
                {user ? (
                  <div className="space-y-4 px-4">
                    <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                      <User className="h-5 w-5" />
                      <span>{user.email}</span>
                    </div>
                    <button
                      onClick={() => {
                        toggleEditMode();
                        setIsOpen(false);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2 text-sm font-medium hover:bg-muted rounded-md transition-colors"
                    >
                      <Edit3 className="h-5 w-5" />
                      Modo Edición: {isEditing ? "ON" : "OFF"}
                    </button>
                    <button
                      onClick={() => {
                        setLayoutMode(
                          layoutMode === "dashboard" ? "web" : "dashboard",
                        );
                        setIsOpen(false);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2 text-sm font-medium hover:bg-muted rounded-md transition-colors"
                    >
                      <LayoutDashboard className="h-5 w-5" />
                      {layoutMode === "dashboard" ? "Vista Web" : "Vista Panel"}
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        setIsOpen(false);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                    >
                      <LogOut className="h-5 w-5" />
                      Cerrar Sesión
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors"
                  >
                    <User className="h-5 w-5" />
                    Iniciar Sesión
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ── Mobile Bottom Navigation ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-border bg-background flex items-center justify-around z-50 px-2 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <Link
          href="/"
          className="flex flex-col items-center gap-1 text-muted-foreground transition-colors p-2 hover:text-primary"
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px] font-medium leading-none">Inicio</span>
        </Link>
        <Link
          href="/publicaciones"
          className="flex flex-col items-center gap-1 text-muted-foreground transition-colors p-2 hover:text-primary"
        >
          <FileText className="h-5 w-5" />
          <span className="text-[10px] font-medium leading-none">Informes</span>
        </Link>
        <Link
          href="/boletines"
          className="flex flex-col items-center gap-1 text-muted-foreground transition-colors p-2 hover:text-primary"
        >
          <Newspaper className="h-5 w-5" />
          <span className="text-[10px] font-medium leading-none">
            Boletines
          </span>
        </Link>
        <button
          onClick={() => setMobileSearchOpen(true)}
          className="flex flex-col items-center gap-1 text-muted-foreground transition-colors p-2 hover:text-primary"
        >
          <Search className="h-5 w-5" />
          <span className="text-[10px] font-medium leading-none">
            Categorías
          </span>
        </button>
      </div>

      {/* ── Mobile Categories Drawer ── */}
      {mobileSearchOpen && (
        <div className="md:hidden fixed inset-0 z-[60] bg-background animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex flex-col h-full">
            {/* Header — changes based on selected category */}
            <div className="flex items-center gap-2 px-4 py-4 border-b shrink-0">
              {selectedCategory ? (
                <button
                  onClick={handleBackToCategories}
                  className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors shrink-0"
                  aria-label="Volver"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              ) : null}

              <h2 className="flex-1 text-xl font-heading font-bold truncate">
                {selectedCategory ? selectedCategory.nombre : "Categorías"}
              </h2>

              {selectedCategory && (
                <Link
                  href={`/categorias/${selectedCategory.slug}`}
                  onClick={() => setMobileSearchOpen(false)}
                  className="flex items-center gap-1 text-xs text-primary font-medium shrink-0"
                >
                  Ver todo
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              )}

              <button
                onClick={() => setMobileSearchOpen(false)}
                className="p-2 border rounded-full hover:bg-muted shrink-0 ml-1"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content — two panels with slide animation */}
            <div className="flex-1 overflow-hidden relative">
              {/* Panel 1: Category list */}
              <div
                className={`absolute inset-0 transition-transform duration-300 ease-in-out overflow-y-auto pb-24 ${
                  selectedCategory ? "-translate-x-full" : "translate-x-0"
                }`}
              >
                <div className="flex flex-col">
                  {categoryTree.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategorySelect(cat)}
                      className="flex items-center justify-between w-full px-4 py-5 border-b border-border hover:bg-muted/50 transition-colors group text-left"
                    >
                      <span className="text-2xl font-heading font-bold tracking-tight group-hover:text-primary transition-colors">
                        {cat.nombre}
                      </span>
                      <ChevronRight className="h-6 w-6 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Panel 2: Selected category detail */}
              <div
                className={`absolute inset-0 transition-transform duration-300 ease-in-out overflow-y-auto pb-24 ${
                  selectedCategory ? "translate-x-0" : "translate-x-full"
                }`}
              >
                {selectedCategory && (
                  <>
                    {/* Subcategories */}
                    {selectedCategory.children.length > 0 && (
                      <div>
                        <p className="px-4 pt-5 pb-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
                          Subcategorías
                        </p>
                        {selectedCategory.children.map((sub) => (
                          <Link
                            key={sub.id}
                            href={`/categorias/${sub.slug}`}
                            onClick={() => setMobileSearchOpen(false)}
                            className="flex items-center justify-between w-full px-4 py-4 border-b border-border hover:bg-muted/50 transition-colors group"
                          >
                            <span className="text-base font-medium group-hover:text-primary transition-colors">
                              {sub.nombre}
                            </span>
                            <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Publications */}
                    <div>
                      <p className="px-4 pt-5 pb-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
                        Publicaciones
                      </p>

                      {loadingPubs ? (
                        <div className="px-4 py-8 flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : categoryPublications.length > 0 ? (
                        <>
                          {categoryPublications.map((pub) => (
                            <Link
                              key={pub.id}
                              href={`/publicaciones/${pub.slug}`}
                              onClick={() => setMobileSearchOpen(false)}
                              className="flex items-center justify-between w-full px-4 py-4 border-b border-border hover:bg-muted/50 transition-colors group"
                            >
                              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 pr-4">
                                {pub.titulo}
                              </span>
                              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                            </Link>
                          ))}
                          <Link
                            href={`/categorias/${selectedCategory.slug}`}
                            onClick={() => setMobileSearchOpen(false)}
                            className="flex items-center justify-center gap-2 w-full px-4 py-4 text-sm text-primary font-medium hover:bg-muted/50 transition-colors"
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
        </div>
      )}
    </>
  );
}

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LogOut,
  User,
  Edit3,
  Sun,
  Moon,
  Home,
  FileText,
  Newspaper,
  LayoutList,
  Heart,
  LogIn,
  Share2,
  LayoutGrid,
  ChevronDown,
  ChevronLeft,
  ArrowUpRight,
  Banknote,
  TrendingUp,
  Settings,
} from "lucide-react";
import type { Category } from "@/lib/api";
import { CategoryMenu } from "@/components/CategoryMenu";
import { Isologotipo } from "@/components/brand/Isologotipo";
import { Isotipo } from "@/components/brand/Isotipo";

interface CategoryWithChildren extends Category {
  children: Category[];
}

const navLinks = [
  { name: "Inicio", href: "/" },
  { name: "Publicaciones", href: "/publicaciones" },
];

// ── Desktop boletín dropdown ────────────────────────────────────────────────
function BoletinDropdown({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const isActive = pathname.startsWith("/boletines");

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-1 ${
          isActive ? "text-primary" : "text-muted-foreground"
        }`}
      >
        Boletín
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-full mt-2 right-0 bg-background border border-border rounded-xl shadow-xl z-[60] overflow-hidden min-w-[200px]">
          <Link
            href="/boletines/hoy"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors group"
          >
            <Newspaper className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm font-semibold whitespace-nowrap">
              Boletín de hoy
            </span>
          </Link>
          <div className="border-t border-border" />
          <Link
            href="/boletines"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors group"
          >
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              Archivo
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Desktop category megamenu ───────────────────────────────────────────────
function DesktopCategoryDropdown({
  categories,
  pathname,
}: {
  categories: CategoryWithChildren[];
  pathname: string;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const sortedCategories = [...categories].sort((a, b) => {
    const aHasSubs =
      a.children.length > 0 || a.slug === "finanzas-provinciales";
    const bHasSubs =
      b.children.length > 0 || b.slug === "finanzas-provinciales";
    if (aHasSubs && !bHasSubs) return -1;
    if (!aHasSubs && bHasSubs) return 1;
    return 0;
  });

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-1 ${
          pathname.startsWith("/categorias")
            ? "text-primary"
            : "text-muted-foreground"
        }`}
      >
        Categorías
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="fixed top-[60px] right-4 bg-background border border-border rounded-xl shadow-xl z-[60] overflow-hidden grid grid-cols-2 gap-px w-[520px]">
          {sortedCategories.map((cat, idx) => (
            <div key={cat.id} className="bg-background">
              {/* Category heading */}
              <Link
                href={`/categorias/${cat.slug}`}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between gap-4 px-6 pt-5 pb-2 hover:bg-muted/50 transition-colors group"
              >
                <span className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted-foreground tabular-nums w-5 shrink-0">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span className="text-xl font-heading font-bold tracking-tight group-hover:text-primary transition-colors whitespace-nowrap">
                    {cat.nombre}
                  </span>
                </span>
                <ArrowUpRight className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>

              {/* Subcategories — aligned with category name (pl = px-6 + w-5 + gap-3) */}
              {(cat.children.length > 0 ||
                cat.slug === "finanzas-provinciales") && (
                <ul className="pb-4">
                  {cat.slug === "finanzas-provinciales" && (
                    <>
                      <li>
                        <Link
                          href="/ingresos"
                          onClick={() => setOpen(false)}
                          className="block pl-14 pr-6 py-1.5 text-base text-primary hover:text-primary/70 hover:bg-muted/30 transition-colors whitespace-nowrap"
                        >
                          Ingresos de la Provincia
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/coparticipacion"
                          onClick={() => setOpen(false)}
                          className="block pl-14 pr-6 py-1.5 text-base text-primary hover:text-primary/70 hover:bg-muted/30 transition-colors whitespace-nowrap"
                        >
                          Coparticipación
                        </Link>
                      </li>
                    </>
                  )}
                  {cat.children
                    .filter((sub) => sub.slug !== "ingresos-de-la-provincia")
                    .map((sub) => (
                      <li key={sub.id}>
                        <Link
                          href={`/categorias/${sub.slug}`}
                          onClick={() => setOpen(false)}
                          className="block pl-14 pr-6 py-1.5 text-base text-primary hover:text-primary/70 hover:bg-muted/30 transition-colors whitespace-nowrap"
                        >
                          {sub.nombre}
                        </Link>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Navbar ────────────────────────────────────────────────────────────
export function Navbar() {
  const [isDark, setIsDark] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [categoryTree, setCategoryTree] = useState<CategoryWithChildren[]>([]);
  const [mobileCatOpen, setMobileCatOpen] = useState(false);

  const pathname = usePathname();
  const { user, logout, isEditing, toggleEditMode, openLoginModal } = useAuth();

  const handleLogout = () => {
    logout(); // AuthContext calls /api/auth/logout (HttpOnly cookie) and redirects
    setUserMenuOpen(false);
  };

  // On detail pages the inner nav takes over; hide the main mobile top bar
  const isDetailPage =
    (pathname.startsWith("/publicaciones/") &&
      pathname !== "/publicaciones/") ||
    pathname.startsWith("/categorias/");

  const desktopMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);

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

  // Close user menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!userMenuOpen) return;
      const target = e.target as Node;
      const inDesktop = desktopMenuRef.current?.contains(target);
      const inMobile = mobileMenuRef.current?.contains(target);
      const inMobileDropdown = mobileDropdownRef.current?.contains(target);
      if (!inDesktop && !inMobile && !inMobileDropdown) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [userMenuOpen]);

  // Close overlay on route change
  useEffect(() => {
    setMobileCatOpen(false);
  }, [pathname]);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    document.documentElement.classList.toggle("dark", newDark);
    localStorage.setItem("theme", newDark ? "dark" : "light");
  };

  return (
    <>
      {/* ── Desktop Navbar ── */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full px-4 md:px-8">
          <div className="flex h-16 items-center gap-6">
            {/* Logo */}
            <Link href="/" className="shrink-0">
              <Isologotipo height={32} />
            </Link>

            {/* Nav links */}
            <div className="flex items-center gap-6 ml-auto">
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

              {categoryTree.length > 0 && (
                <DesktopCategoryDropdown
                  categories={categoryTree}
                  pathname={pathname}
                />
              )}

              <BoletinDropdown pathname={pathname} />

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                title={isDark ? "Modo Claro" : "Modo Oscuro"}
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              {/* User menu */}
              <div className="relative" ref={desktopMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  title="Menú de usuario"
                >
                  <User className="h-4 w-4" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-md border border-border bg-background shadow-lg z-[70]">
                    <div className="py-1">
                      {!user ? (
                        <>
                          {/* Public user menu */}
                          <button
                            onClick={() => {
                              toggleTheme();
                              setUserMenuOpen(false);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                          >
                            {isDark ? (
                              <Sun className="h-4 w-4" />
                            ) : (
                              <Moon className="h-4 w-4" />
                            )}
                            {isDark ? "Modo Claro" : "Modo Oscuro"}
                          </button>
                          <Link
                            href="/favoritos"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                          >
                            <Heart className="h-4 w-4" />
                            Favoritos
                          </Link>
                          <button
                            onClick={() => {
                              if (navigator.share) {
                                navigator.share({
                                  url: window.location.href,
                                  title: document.title,
                                });
                              } else {
                                navigator.clipboard.writeText(
                                  window.location.href,
                                );
                              }
                              setUserMenuOpen(false);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                          >
                            <Share2 className="h-4 w-4" />
                            Compartir
                          </button>
                          <div className="my-1 border-t border-border" />
                          <button
                            onClick={() => {
                              openLoginModal();
                              setUserMenuOpen(false);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                          >
                            <LogIn className="h-4 w-4" />
                            Iniciar Sesión
                          </button>
                        </>
                      ) : (
                        <>
                          {/* Authenticated user menu */}
                          <Link
                            href="/favoritos"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                          >
                            <Heart className="h-4 w-4" />
                            Mis Favoritos
                          </Link>
                          <Link
                            href="/admin/widgets"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                          >
                            <LayoutGrid className="h-4 w-4" />
                            Widgets
                          </Link>
                          <Link
                            href="/coparticipacion"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                          >
                            <Banknote className="h-4 w-4" />
                            Coparticipación
                          </Link>
                          <Link
                            href="/ingresos"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                          >
                            <TrendingUp className="h-4 w-4" />
                            Ingresos
                          </Link>
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
                              toggleTheme();
                              setUserMenuOpen(false);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                          >
                            {isDark ? (
                              <Sun className="h-4 w-4" />
                            ) : (
                              <Moon className="h-4 w-4" />
                            )}
                            {isDark ? "Modo Claro" : "Modo Oscuro"}
                          </button>
                          <button
                            onClick={() => {
                              if (navigator.share) {
                                navigator.share({
                                  url: window.location.href,
                                  title: document.title,
                                });
                              } else {
                                navigator.clipboard.writeText(
                                  window.location.href,
                                );
                              }
                              setUserMenuOpen(false);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                          >
                            <Share2 className="h-4 w-4" />
                            Compartir
                          </button>
                          <div className="my-1 border-t border-border" />
                          <div className="px-4 py-1.5 text-xs text-muted-foreground truncate">
                            {user.email}
                          </div>
                          <button
                            onClick={handleLogout}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <LogOut className="h-4 w-4" />
                            Cerrar Sesión
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile Top Bar ── */}
      {(() => {
        const boletinDetail = pathname.match(/^\/boletines\/(?!hoy$)([^/]+)(?:\/.*)?$/);
        const actoDetail = pathname.match(/^\/boletines\/([^/]+)\/(.+)$/);
        return (
          <div
            className={`${isDetailPage ? "hidden" : ""} md:hidden sticky top-0 z-50 w-full h-14 bg-background/95 backdrop-blur flex items-center justify-between px-4`}
          >
            {/* Left: logo / title / back */}
            <div>
              {actoDetail ? (
                <Link
                  href={`/boletines/${actoDetail[1]}`}
                  className="flex items-center gap-1 text-sm font-semibold text-foreground hover:text-primary transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 shrink-0" />
                  Boletín
                </Link>
              ) : boletinDetail ? (
                <Link
                  href="/boletines"
                  className="flex items-center gap-1 text-sm font-semibold text-foreground hover:text-primary transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 shrink-0" />
                  Boletines
                </Link>
              ) : pathname.startsWith("/publicaciones") ? (
                <span className="font-extrabold font-heading text-lg tracking-tight">
                  Publicaciones
                </span>
              ) : pathname.startsWith("/boletines") ? (
                <span className="font-extrabold font-heading text-lg tracking-tight">
                  Boletines
                </span>
              ) : (
                <Link href="/" className="shrink-0">
                  <Isologotipo height={30} animated={false} />
                </Link>
              )}
            </div>
            {/* Right: theme toggle + user menu button */}
            <div className="flex items-center gap-1">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                title={isDark ? "Modo Claro" : "Modo Oscuro"}
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <div ref={mobileMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  <User className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Mobile User Menu dropdown ── */}
      <div className="md:hidden">
          {userMenuOpen && (
            <div ref={mobileDropdownRef} className="fixed top-14 right-2 w-56 rounded-md border border-border bg-background shadow-lg z-[70]">
              {user ? (
                <>
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                      Usuario
                    </p>
                    <p className="text-sm font-medium truncate">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/favoritos"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <Heart className="h-4 w-4" />
                      Mis Favoritos
                    </Link>
                    <Link
                      href="/admin/widgets"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <LayoutGrid className="h-4 w-4" />
                      Widgets
                    </Link>
                    <Link
                      href="/coparticipacion"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <Banknote className="h-4 w-4" />
                      Coparticipación
                    </Link>
                    <Link
                      href="/ingresos"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <TrendingUp className="h-4 w-4" />
                      Ingresos
                    </Link>
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
                      Edición: {isEditing ? "ON" : "OFF"}
                    </button>
                    <button
                      onClick={() => {
                        toggleTheme();
                        setUserMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      {isDark ? (
                        <Sun className="h-4 w-4" />
                      ) : (
                        <Moon className="h-4 w-4" />
                      )}
                      {isDark ? "Modo Claro" : "Modo Oscuro"}
                    </button>
                    <button
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            url: window.location.href,
                            title: document.title,
                          });
                        } else {
                          navigator.clipboard.writeText(window.location.href);
                        }
                        setUserMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <Share2 className="h-4 w-4" />
                      Compartir
                    </button>
                    <div className="my-1 border-t border-border" />
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar Sesión
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-1">
                  {/* Public user menu (mobile) */}
                  <button
                    onClick={() => {
                      toggleTheme();
                      setUserMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    {isDark ? (
                      <Sun className="h-4 w-4" />
                    ) : (
                      <Moon className="h-4 w-4" />
                    )}
                    {isDark ? "Modo Claro" : "Modo Oscuro"}
                  </button>
                  <Link
                    href="/favoritos"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <Heart className="h-4 w-4" />
                    Favoritos
                  </Link>
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          url: window.location.href,
                          title: document.title,
                        });
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                      }
                      setUserMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <Share2 className="h-4 w-4" />
                    Compartir
                  </button>
                  <div className="my-1 border-t border-border" />
                  <button
                    onClick={() => {
                      openLoginModal();
                      setUserMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <LogIn className="h-4 w-4" />
                    Iniciar Sesión
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      {/* ── Mobile Bottom Navigation ── */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-background z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center justify-around h-16 px-1">
          {/* 1. Inicio */}
          <Link
            href="/"
            onClick={() => { setMobileCatOpen(false); setUserMenuOpen(false); }}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${
              pathname === "/"
                ? "text-primary"
                : "text-muted-foreground hover:text-primary"
            }`}
          >
            <Home className="h-5 w-5" />
            <span className="text-[10px] font-medium leading-none">Inicio</span>
          </Link>
          {/* 2. Categorías */}
          <button
            onClick={() => { setMobileCatOpen((v) => !v); setUserMenuOpen(false); }}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${
              mobileCatOpen
                ? "text-primary"
                : "text-muted-foreground hover:text-primary"
            }`}
          >
            <LayoutList className="h-5 w-5" />
            <span className="text-[10px] font-medium leading-none">
              Categorías
            </span>
          </button>
          {/* 3. Publicaciones */}
          <Link
            href="/publicaciones"
            onClick={() => { setMobileCatOpen(false); setUserMenuOpen(false); }}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${
              pathname.startsWith("/publicaciones")
                ? "text-primary"
                : "text-muted-foreground hover:text-primary"
            }`}
          >
            <FileText className="h-5 w-5" />
            <span className="text-[10px] font-medium leading-none">
              Publicaciones
            </span>
          </Link>
          {/* 4. Boletín hoy */}
          <Link
            href="/boletines/hoy"
            onClick={() => { setMobileCatOpen(false); setUserMenuOpen(false); }}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${
              pathname.startsWith("/boletines")
                ? "text-primary"
                : "text-muted-foreground hover:text-primary"
            }`}
          >
            <Newspaper className="h-5 w-5" />
            <span className="text-[10px] font-medium leading-none">Boletín</span>
          </Link>

        </div>
      </div>

      {/* ── Mobile CategoryMenu Overlay ── */}
      {mobileCatOpen && categoryTree.length > 0 && (
        <CategoryMenu
          categories={categoryTree}
          isDrawer={true}
          onClose={() => setMobileCatOpen(false)}
        />
      )}
    </>
  );
}

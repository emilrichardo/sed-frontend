"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LogOut,
  User,
  Edit3,
  Sun,
  Moon,
  ChevronDown,
  Home,
  FileText,
  Newspaper,
  Search,
  Heart,
  LogIn,
} from "lucide-react";
import type { Category } from "@/lib/api";
import { CategoryMenu } from "@/components/CategoryMenu";

interface CategoryWithChildren extends Category {
  children: Category[];
}

const navLinks = [
  { name: "Inicio", href: "/" },
  { name: "Boletines", href: "/boletines" },
  { name: "Informes", href: "/publicaciones" },
];

// ── Compact rotating stats ticker ──────────────────────────────────────────
interface StatItem {
  label: string;
  value: string;
}

function StatsTicker() {
  const [stats, setStats] = useState<StatItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api-proxy/publicaciones?limit=1")
        .then((r) => r.json())
        .catch(() => ({ totalDocs: 0 })),
      fetch("/api-proxy/taxonomias?limit=1&where[tipo][equals]=categoria")
        .then((r) => r.json())
        .catch(() => ({ totalDocs: 0 })),
      fetch("/api-proxy/boletines?limit=1")
        .then((r) => r.json())
        .catch(() => ({ totalDocs: 0 })),
    ]).then(([pubs, cats, bols]) => {
      const items: StatItem[] = [];
      if (pubs.totalDocs > 0)
        items.push({ value: String(pubs.totalDocs), label: "publicaciones" });
      if (cats.totalDocs > 0)
        items.push({ value: String(cats.totalDocs), label: "categorías" });
      if (bols.totalDocs > 0)
        items.push({ value: String(bols.totalDocs), label: "boletines" });
      setStats(items);
    });
  }, []);

  useEffect(() => {
    if (stats.length < 2) return;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % stats.length);
        setVisible(true);
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, [stats]);

  if (stats.length === 0) return null;
  const current = stats[idx];

  return (
    <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground font-mono">
      <span
        className={`transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
      >
        <span className="text-foreground font-bold">{current.value}</span>{" "}
        {current.label}
      </span>
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
  const { user, logout, isEditing, toggleEditMode } = useAuth();

  const menuRef = useRef<HTMLDivElement>(null);

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
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
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
      <nav className="hidden md:block sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex h-16 items-center gap-6">
            {/* Logo */}
            <Link href="/" className="shrink-0">
              <span className="text-xl font-extrabold tracking-tight font-heading">
                Santiago en Datos
              </span>
            </Link>

            {/* Stats ticker */}
            <StatsTicker />

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
                <Link
                  href="/categorias"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname.startsWith("/categorias")
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  Categorías
                </Link>
              )}

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                title={isDark ? "Modo claro" : "Modo oscuro"}
              >
                {isDark ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>

              {/* User menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md border border-input bg-background hover:bg-muted transition-colors"
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-md border border-border bg-background shadow-lg z-[70]">
                    <div className="py-1">
                      <Link
                        href="/favoritos"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                      >
                        <Heart className="h-4 w-4" />
                        Mis Favoritos
                      </Link>

                      {user && (
                        <>
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
                          <div className="my-1 border-t border-border" />
                          <div className="px-4 py-1.5 text-xs text-muted-foreground truncate">
                            {user.email}
                          </div>
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
                        </>
                      )}

                      {!user && (
                        <>
                          <div className="my-1 border-t border-border" />
                          <Link
                            href="/login"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                          >
                            <LogIn className="h-4 w-4" />
                            Iniciar Sesión
                          </Link>
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
      <div className="md:hidden sticky top-0 z-50 w-full h-14 border-b border-border bg-background/95 backdrop-blur flex items-center px-4 justify-between">
        <Link
          href="/"
          className="font-extrabold font-heading text-lg tracking-tight"
        >
          Santiago en Datos
        </Link>

        {user ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-input bg-background hover:bg-muted transition-colors"
            >
              <User className="h-4 w-4 text-muted-foreground" />
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-md border border-border bg-background shadow-lg z-[70]">
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
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            <User className="h-4 w-4" />
            Iniciar sesión
          </Link>
        )}
      </div>

      {/* ── Mobile Bottom Navigation ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-border bg-background flex items-center justify-around z-50 px-2 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <Link
          href="/"
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${
            pathname === "/"
              ? "text-primary"
              : "text-muted-foreground hover:text-primary"
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px] font-medium leading-none">Inicio</span>
        </Link>
        <Link
          href="/publicaciones"
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${
            pathname.startsWith("/publicaciones")
              ? "text-primary"
              : "text-muted-foreground hover:text-primary"
          }`}
        >
          <FileText className="h-5 w-5" />
          <span className="text-[10px] font-medium leading-none">Informes</span>
        </Link>
        <Link
          href="/boletines"
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${
            pathname.startsWith("/boletines")
              ? "text-primary"
              : "text-muted-foreground hover:text-primary"
          }`}
        >
          <Newspaper className="h-5 w-5" />
          <span className="text-[10px] font-medium leading-none">
            Boletines
          </span>
        </Link>
        <button
          onClick={() => setMobileCatOpen(true)}
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${
            mobileCatOpen
              ? "text-primary"
              : "text-muted-foreground hover:text-primary"
          }`}
        >
          <Search className="h-5 w-5" />
          <span className="text-[10px] font-medium leading-none">
            Categorías
          </span>
        </button>
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

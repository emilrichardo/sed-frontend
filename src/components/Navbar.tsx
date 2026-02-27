"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Menu,
  X,
  LogIn,
  LogOut,
  User,
  Edit3,
  LayoutDashboard,
  Sun,
  Moon,
  ChevronDown,
} from "lucide-react";

const navLinks = [
  { name: "Inicio", href: "/" },
  { name: "Boletines", href: "/boletines" },
  { name: "Publicaciones", href: "/publicaciones" },
  { name: "Widgets", href: "/widgets" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout, isEditing, toggleEditMode, layoutMode, setLayoutMode } =
    useAuth();

  // Handle theme initialization
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const dark =
      saved === "dark" ||
      (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);

    document.documentElement.classList.toggle("dark", dark);
    // Use a small timeout to avoid synchronous setState during render
    const timer = setTimeout(() => {
      setIsDark(dark);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

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

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    document.documentElement.classList.toggle("dark", newDark);
    localStorage.setItem("theme", newDark ? "dark" : "light");
  };

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl font-extrabold tracking-tight font-heading">
                Santiago en Datos
              </span>
            </Link>
          </div>

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
            </div>

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
                          Modo Edición: {isEditing ? "Activado" : "Desactivado"}
                        </button>
                        <button
                          onClick={() => {
                            setLayoutMode(
                              layoutMode === "dashboard" ? "web" : "dashboard",
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
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                <LogIn className="h-4 w-4" />
              </Link>
            )}
          </div>

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

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden border-t border-border bg-background animate-in slide-in-from-top-2 duration-200">
          <div className="container mx-auto px-4 py-4 space-y-4">
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
                  <LogIn className="h-5 w-5" />
                  Iniciar Sesión
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

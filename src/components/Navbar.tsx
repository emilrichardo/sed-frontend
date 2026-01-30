"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Menu, X, LogIn, LogOut, User, Edit3 } from "lucide-react";

const navLinks = [
  { name: "Inicio", href: "/" },
  { name: "Noticias", href: "/noticias" },
  { name: "Boletines", href: "/boletines" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout, isEditing, toggleEditMode } = useAuth();

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-xl font-bold tracking-tight hidden sm:inline-block">
                Santiago en Datos
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-6   mr-2">
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
                <button
                  onClick={toggleEditMode}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider border-2 border-black transition-all ${
                    isEditing
                      ? "bg-black text-white shadow-none"
                      : "bg-white text-black hover:bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-none"
                  }`}
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  {isEditing ? "Edit: ON" : "Edit: OFF"}
                </button>
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="max-w-[150px] truncate">{user.email}</span>
                </div>

                <button
                  onClick={logout}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                  title="Cerrar Sesión"
                >
                  <LogOut className="h-5 w-5" />
                </button>
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

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            {user && (
              <button
                onClick={toggleEditMode}
                className={`p-2 border-2 border-black transition-colors ${
                  isEditing ? "bg-black text-white" : "bg-white text-black"
                }`}
                title="Toggle Edit Mode"
              >
                <Edit3 className="h-5 w-5" />
              </button>
            )}
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
                  className={`block px-4 py-2 text-base font-bold uppercase tracking-wide border-2 border-transparent hover:border-black transition-colors ${
                    pathname === link.href
                      ? "bg-black text-white border-black"
                      : "text-muted-foreground hover:bg-muted hover:text-black"
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
                      logout();
                      setIsOpen(false);
                    }}
                    className="flex w-full items-center gap-3 py-2 text-base font-bold uppercase text-destructive hover:bg-destructive/10 border-2 border-transparent hover:border-destructive transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    Cerrar Sesión
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-base font-bold uppercase text-muted-foreground hover:bg-muted hover:text-black border-2 border-transparent hover:border-black transition-colors"
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

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LogOut,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  Home,
  Newspaper,
  FileText,
  BarChart,
  Layout,
} from "lucide-react";

const navLinks = [
  { name: "Inicio", href: "/", icon: Home },
  { name: "Noticias", href: "/noticias", icon: Newspaper },
  { name: "Boletines", href: "/boletines", icon: FileText },
  { name: "Publicaciones", href: "/publicaciones", icon: BarChart },
  { name: "Widgets", href: "/widgets", icon: Layout },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Hide global sidebar on Report Detail pages
  const isReportDetail =
    pathname.startsWith("/publicaciones/") && pathname.split("/").length > 2;

  if (!user) return null;
  if (isReportDetail) return null;

  return (
    <aside
      className={`sticky top-0 h-screen transition-all duration-300 border-r border-border bg-background flex flex-col flex-shrink-0 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Header / Logo */}
      <div className="flex items-center justify-between p-4 h-16 border-b border-border">
        {!isCollapsed && (
          <Link href="/" className="flex items-center gap-2 overflow-hidden">
            <span className="text-lg font-bold tracking-tight whitespace-nowrap truncate">
              Santiago en Datos
            </span>
          </Link>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted ml-auto"
          title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors group ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="font-medium whitespace-nowrap overflow-hidden">
                  {link.name}
                </span>
              )}
              {isCollapsed && isActive && (
                <div className="absolute left-14 bg-primary text-primary-foreground text-xs px-2 py-1 rounded ml-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                  {link.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Session Footer */}
      <div className="border-t border-border p-4">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-4">
            <div
              className="p-2 rounded-full bg-muted text-muted-foreground"
              title={user.email}
            >
              <User className="h-5 w-5" />
            </div>
            <button
              onClick={logout}
              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-2">
              <div className="p-2 rounded-full bg-muted text-muted-foreground">
                <User className="h-4 w-4" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span
                  className="text-sm font-medium truncate"
                  title={user.email}
                >
                  {user.email}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  Usuario
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

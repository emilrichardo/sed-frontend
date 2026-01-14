"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

interface AdminBarProps {
  collection?: string;
  id?: string | number;
}

export function AdminBar({ collection, id }: AdminBarProps) {
  const { user, logout, isEditing, toggleEditMode } = useAuth();

  if (!user) return null;

  const adminUrl = "http://localhost:3000/admin";

  return (
    <div className="fixed top-0 left-0 right-0 bg-foreground text-background py-3 px-6 flex items-center justify-between z-50 shadow-lg border-b border-border/20">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">
          <span className="opacity-70 mr-2">Hola,</span>
          {user.email}
        </span>
        <div className="h-4 w-px bg-background/20" />
        <Link
          href={adminUrl}
          target="_blank"
          className="text-sm hover:underline opacity-90 hover:opacity-100"
        >
          Panel Admin
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleEditMode}
          className={`px-4 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
            isEditing
              ? "bg-green-500 text-white hover:bg-green-600"
              : "bg-background text-foreground hover:bg-background/90"
          }`}
        >
          {isEditing ? (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Modo Edición: ON
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
              Modo Edición: OFF
            </>
          )}
        </button>

        <button
          onClick={logout}
          className="text-sm opacity-70 hover:opacity-100 hover:underline"
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}

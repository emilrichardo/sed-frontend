"use client";

import { useAuth } from "@/context/AuthContext";
import { Plus } from "lucide-react";

export function CreateNewsButton() {
  const { user } = useAuth();

  // Only show if user is logged in
  if (!user) return null;

  return (
    <a
      href="http://localhost:3000/admin/collections/noticias/create"
      target="_blank"
      rel="noopener noreferrer"
      className="bg-primary text-primary-foreground px-4 py-2 font-medium flex items-center gap-2 rounded-md hover:bg-primary/90 shadow-sm transition-all text-sm"
    >
      <Plus className="w-4 h-4" />
      Crear Nueva Noticia
    </a>
  );
}

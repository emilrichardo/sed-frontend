"use client";

import { useAuth } from "@/context/AuthContext";
import { Edit } from "lucide-react";

interface EditContentButtonProps {
  collection: "publicaciones" | "boletines";
  id: number | string;
  adminUrl?: string;
}

export function EditContentButton({ collection, id, adminUrl }: EditContentButtonProps) {
  const { user } = useAuth();

  if (!user) return null;

  const base = (adminUrl || "http://localhost:3000").replace(/\/+$/, "");

  return (
    <a
      href={`${base}/admin/collections/${collection}/${id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center p-2 text-muted-foreground hover:text-primary transition-colors rounded-full hover:bg-muted"
      title="Editar en Panel de Administración"
    >
      <Edit className="w-4 h-4" />
    </a>
  );
}

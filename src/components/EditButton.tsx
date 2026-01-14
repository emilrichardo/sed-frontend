"use client";

import { useAuth } from "@/context/AuthContext";

interface EditButtonProps {
  collection: string;
  id: string | number;
}

export function EditButton({ collection, id }: EditButtonProps) {
  const { user } = useAuth();

  if (!user) return null;

  const editUrl = `http://localhost:3000/admin/collections/${collection}/${id}`;

  return (
    <a
      href={editUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 z-50 bg-foreground text-background px-4 py-2 rounded-full shadow-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
    >
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
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
      Editar
    </a>
  );
}

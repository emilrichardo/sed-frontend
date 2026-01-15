"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function CreateNewsButton() {
  const { isEditing, user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  if (!isEditing || !user) return null;

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const token = localStorage.getItem("payload-token");
      if (!token) throw new Error("No token found");

      const res = await fetch("http://localhost:3000/api/noticias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify({
          titulo: "Nueva Noticia",
          slug: `nueva-noticia-${Date.now()}`,
          contenido: {
            root: {
              type: "root",
              format: "",
              indent: 0,
              version: 1,
              children: [
                {
                  type: "paragraph",
                  format: "",
                  indent: 0,
                  version: 1,
                  children: [
                    {
                      mode: "normal",
                      text: "Escribe aquí el contenido de tu noticia...",
                      type: "text",
                      style: "",
                      detail: 0,
                      format: 0,
                      version: 1,
                    },
                  ],
                  direction: "ltr",
                },
              ],
              direction: "ltr",
            },
          },
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create news");
      }

      const data = await res.json();
      router.push(`/noticias/${data.doc.slug}`);
      router.refresh();
    } catch (error) {
      console.error("Error creating news:", error);
      alert("Error al crear la noticia.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <button
      onClick={handleCreate}
      disabled={isCreating}
      className="mb-8 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2 shadow-md transition-all"
    >
      {isCreating ? (
        "Creando..."
      ) : (
        <>
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Crear Nueva Noticia
        </>
      )}
    </button>
  );
}

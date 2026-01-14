"use client";

import React, { useState, useEffect } from "react";
import { NewsItem } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { RichTextParser } from "@/components/RichTextParser";
import { BlockRenderer } from "@/components/BlockRenderer";

interface NewsEditableProps {
  initialData: NewsItem;
}

export const NewsEditable: React.FC<NewsEditableProps> = ({ initialData }) => {
  const { isEditing, user } = useAuth();
  const [data, setData] = useState(initialData);
  const [title, setTitle] = useState(initialData.titulo);
  const [isSaving, setIsSaving] = useState(false);

  // Update local state if initialData changes (e.g. revalidation)
  useEffect(() => {
    setData(initialData);
    setTitle(initialData.titulo);
  }, [initialData]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("payload-token");
      if (!token) throw new Error("No token found");

      const res = await fetch(`http://localhost:3000/api/noticias/${data.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify({
          titulo: title,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save");
      }

      const updatedDoc = await res.json();
      setData({ ...data, ...updatedDoc.doc });
      alert("Guardado exitosamente!");
    } catch (error) {
      console.error("Error saving:", error);
      alert("Error al guardar.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing && user) {
    return (
      <div className="space-y-8">
        <div className="bg-muted/30 p-4 rounded-lg border border-dashed border-border">
          <label className="block text-sm font-medium mb-2 text-muted-foreground">
            Editar Título
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-4xl md:text-5xl font-bold tracking-tight bg-background border border-input rounded p-2"
          />

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-primary text-primary-foreground px-4 py-2 rounded font-medium hover:opacity-90 disabled:opacity-50"
            >
              {isSaving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </div>

        <div className="prose prose-neutral max-w-none opacity-70 pointer-events-none select-none relative">
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="bg-background/80 backdrop-blur p-4 rounded shadow text-center">
              <p className="font-medium">Edición de contenido complejo</p>
              <p className="text-sm text-muted-foreground mb-2">
                Para editar el contenido rico y los bloques, usa el panel de
                administración.
              </p>
              <a
                href={`http://localhost:3000/admin/collections/noticias/${data.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline pointer-events-auto"
              >
                Ir al Admin &rarr;
              </a>
            </div>
          </div>
          {data.contenido?.root?.children ? (
            <RichTextParser content={data.contenido.root.children} />
          ) : (
            <BlockRenderer blocks={data.layout || []} />
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="mb-10 border-b border-border pb-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-tight">
          {data.titulo}
        </h1>
        {data.createdAt && (
          <time className="text-muted-foreground font-mono text-sm">
            Publicado el{" "}
            {new Date(data.createdAt).toLocaleDateString("es-CL", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        )}
      </header>

      <div className="prose prose-neutral max-w-none">
        {data.contenido?.root?.children ? (
          <RichTextParser content={data.contenido.root.children} />
        ) : (
          <BlockRenderer blocks={data.layout || []} />
        )}
      </div>
    </>
  );
};

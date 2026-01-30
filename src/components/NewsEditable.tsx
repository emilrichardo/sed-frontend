"use client";

import React, { useState, useEffect, useRef } from "react";
import { NewsItem } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { RichTextParser } from "@/components/RichTextParser";
import { BlockRenderer } from "@/components/BlockRenderer";
import { useRouter } from "next/navigation";
import { BlockSelector, BlockType } from "@/components/BlockSelector";

interface NewsEditableProps {
  initialData: NewsItem;
}

interface EditableBlock {
  id: string;
  type: BlockType;
  text?: string;
  tag?: string; // h1-h6
  value?: any; // For upload/media
  relationTo?: string; // For upload
  checked?: boolean; // For checklist
}

export const NewsEditable: React.FC<NewsEditableProps> = ({ initialData }) => {
  const { isEditing, user } = useAuth();
  const [data, setData] = useState(initialData);
  const [title, setTitle] = useState(initialData.titulo);
  const [blocks, setBlocks] = useState<EditableBlock[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Parse initial content into editable blocks
  useEffect(() => {
    setData(initialData);
    setTitle(initialData.titulo);

    if (initialData.contenido?.root?.children) {
      const parsedBlocks: EditableBlock[] = [];

      const processNode = (node: any) => {
        if (
          node.type === "paragraph" ||
          node.type === "heading" ||
          node.type === "quote"
        ) {
          const text = node.children?.map((c: any) => c.text).join("") || "";
          let type = node.type;
          if (node.type === "quote") type = "blockquote";
          if (node.type === "heading") type = node.tag || "h1";

          parsedBlocks.push({
            id: `block-${parsedBlocks.length}`,
            type: type as BlockType,
            text,
            tag: node.tag,
          });
        } else if (node.type === "upload") {
          parsedBlocks.push({
            id: `block-${parsedBlocks.length}`,
            type: "upload",
            value: node.value,
            relationTo: node.relationTo,
          });
        } else if (node.type === "horizontalrule") {
          parsedBlocks.push({
            id: `block-${parsedBlocks.length}`,
            type: "hr",
          });
        } else if (node.type === "list") {
          node.children.forEach((listItem: any) => {
            const text =
              listItem.children?.map((c: any) => c.text).join("") || "";
            parsedBlocks.push({
              id: `block-${parsedBlocks.length}`,
              type:
                node.listType === "check"
                  ? "check"
                  : node.tag === "ol"
                    ? "ol"
                    : "ul",
              text,
              checked: listItem.checked,
            });
          });
        }
      };

      initialData.contenido.root.children.forEach(processNode);
      setBlocks(parsedBlocks);
    }
  }, [initialData]);

  const handleBlockChange = (index: number, newText: string) => {
    const newBlocks = [...blocks];
    newBlocks[index].text = newText;
    setBlocks(newBlocks);
  };

  const handleCheckChange = (index: number, checked: boolean) => {
    const newBlocks = [...blocks];
    newBlocks[index].checked = checked;
    setBlocks(newBlocks);
  };

  const addBlock = (type: BlockType) => {
    setBlocks([
      ...blocks,
      {
        id: `new-${Date.now()}`,
        type,
        text: "",
        tag: type.startsWith("h") ? type : undefined,
      },
    ]);
  };

  const removeBlock = (index: number) => {
    const newBlocks = [...blocks];
    newBlocks.splice(index, 1);
    setBlocks(newBlocks);
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === blocks.length - 1) return;

    const newBlocks = [...blocks];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[targetIndex]] = [
      newBlocks[targetIndex],
      newBlocks[index],
    ];
    setBlocks(newBlocks);
  };

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const token = localStorage.getItem("payload-token");
      if (!token) throw new Error("No token found");

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("http://localhost:3000/api/media", {
        method: "POST",
        headers: {
          Authorization: `JWT ${token}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to upload image");

      const mediaDoc = await res.json();

      setBlocks([
        ...blocks,
        {
          id: `upload-${mediaDoc.doc.id}`,
          type: "upload",
          value: mediaDoc.doc,
          relationTo: "media",
        },
      ]);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Error al subir la imagen.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "¿Estás seguro de que quieres eliminar esta noticia? Esta acción no se puede deshacer.",
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const token = localStorage.getItem("payload-token");
      if (!token) throw new Error("No token found");

      const res = await fetch(`http://localhost:3000/api/noticias/${data.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `JWT ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to delete");

      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Error al eliminar.");
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("payload-token");
      if (!token) {
        alert(
          "No se encontró el token de sesión. Por favor, inicia sesión nuevamente.",
        );
        return;
      }

      // Reconstruct Lexical JSON
      const children: any[] = [];
      let currentList: any = null;

      blocks.forEach((block) => {
        // Handle Lists Grouping
        if (
          block.type === "ul" ||
          block.type === "ol" ||
          block.type === "check"
        ) {
          const listType =
            block.type === "check"
              ? "check"
              : block.type === "ol"
                ? "number"
                : "bullet";
          const tag =
            block.type === "ul" || block.type === "check" ? "ul" : "ol";

          // If we are not in a list or the list type changed, start a new list
          if (!currentList || currentList.listType !== listType) {
            if (currentList) children.push(currentList);
            currentList = {
              type: "list",
              listType: listType,
              tag: tag,
              format: "",
              indent: 0,
              version: 1,
              children: [],
            };
          }

          currentList.children.push({
            type: "listitem",
            value: 1,
            format: "",
            indent: 0,
            version: 1,
            checked: block.checked,
            children: [
              {
                mode: "normal",
                text: block.text || "",
                type: "text",
                style: "",
                detail: 0,
                format: 0,
                version: 1,
              },
            ],
          });
        } else {
          // If we were in a list, close it
          if (currentList) {
            children.push(currentList);
            currentList = null;
          }

          if (block.type === "upload") {
            children.push({
              type: "upload",
              value: block.value,
              relationTo: block.relationTo,
              format: "",
              version: 1,
            });
          } else if (block.type === "hr") {
            children.push({
              type: "horizontalrule",
              version: 1,
            });
          } else if (block.type === "blockquote") {
            children.push({
              type: "quote",
              format: "",
              indent: 0,
              version: 1,
              children: [
                {
                  mode: "normal",
                  text: block.text || "",
                  type: "text",
                  style: "",
                  detail: 0,
                  format: 0,
                  version: 1,
                },
              ],
            });
          } else {
            // Heading or Paragraph
            children.push({
              type: block.type.startsWith("h") ? "heading" : "paragraph",
              tag: block.type.startsWith("h") ? block.type : undefined,
              format: "",
              indent: 0,
              version: 1,
              children: [
                {
                  mode: "normal",
                  text: block.text || "",
                  type: "text",
                  style: "",
                  detail: 0,
                  format: 0,
                  version: 1,
                },
              ],
              direction: "ltr",
            });
          }
        }
      });

      // Push remaining list if any
      if (currentList) children.push(currentList);

      const newContent = {
        root: {
          type: "root",
          format: "",
          indent: 0,
          version: 1,
          children,
          direction: "ltr",
        },
      };

      const res = await fetch(`http://localhost:3000/api/noticias/${data.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify({
          titulo: title,
          contenido: newContent,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save");
      }

      const updatedDoc = await res.json();
      setData({ ...data, ...updatedDoc.doc });
      alert("Guardado exitosamente!");
      router.refresh();
    } catch (error) {
      console.error("Error saving:", error);
      alert("Error al guardar.");
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to render input based on block type
  const renderBlockInput = (block: EditableBlock, index: number) => {
    const commonClasses =
      "w-full bg-background border-2 border-black p-2 focus:ring-0 outline-none font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]";

    if (block.type === "upload") {
      return (
        <div className="border-2 border-black p-2 bg-muted/20">
          <div className="text-xs text-muted-foreground mb-2">
            Imagen: {block.value?.filename}
          </div>
          {block.value?.url && (
            <img
              src={block.value.url}
              alt={block.value.alt || "Imagen subida"}
              className="max-h-64 object-contain border-2 border-black"
            />
          )}
        </div>
      );
    }

    if (block.type === "hr") {
      return <hr className="my-4 border-border" />;
    }

    if (block.type === "check") {
      return (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={block.checked}
            onChange={(e) => handleCheckChange(index, e.target.checked)}
            className="w-4 h-4"
          />
          <input
            type="text"
            value={block.text}
            onChange={(e) => handleBlockChange(index, e.target.value)}
            placeholder="Elemento de lista..."
            className={commonClasses}
          />
        </div>
      );
    }

    if (block.type === "ul" || block.type === "ol") {
      return (
        <div className="flex items-center gap-2 pl-4">
          <span className="text-muted-foreground font-bold">
            {block.type === "ul" ? "•" : `${index + 1}.`}
          </span>
          <input
            type="text"
            value={block.text}
            onChange={(e) => handleBlockChange(index, e.target.value)}
            placeholder="Elemento de lista..."
            className={commonClasses}
          />
        </div>
      );
    }

    if (block.type === "blockquote") {
      return (
        <div className="flex gap-2">
          <div className="w-1 bg-primary/50 rounded-full" />
          <textarea
            value={block.text}
            onChange={(e) => handleBlockChange(index, e.target.value)}
            placeholder="Cita..."
            rows={2}
            className={`${commonClasses} italic`}
          />
        </div>
      );
    }

    if (block.type.startsWith("h")) {
      const sizeClasses: Record<string, string> = {
        h1: "text-4xl font-bold",
        h2: "text-3xl font-bold",
        h3: "text-2xl font-semibold",
        h4: "text-xl font-semibold",
        h5: "text-lg font-semibold",
        h6: "text-base font-semibold",
      };
      return (
        <input
          type="text"
          value={block.text}
          onChange={(e) => handleBlockChange(index, e.target.value)}
          placeholder={`Encabezado ${block.type.toUpperCase()}...`}
          className={`${commonClasses} ${sizeClasses[block.type] || ""}`}
        />
      );
    }

    // Default Paragraph
    return (
      <textarea
        value={block.text}
        onChange={(e) => handleBlockChange(index, e.target.value)}
        placeholder="Escribe un párrafo..."
        rows={3}
        className={`${commonClasses} resize-y`}
      />
    );
  };

  if (isEditing && user) {
    return (
      <div className="space-y-8">
        <div className="bg-muted/30 p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Editor de Contenido</h2>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-500 text-white px-4 py-2 font-bold uppercase disabled:opacity-50 text-xs border-2 border-black hover:bg-red-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[1px]"
              >
                {isDeleting ? "Eliminando..." : "Eliminar Noticia"}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-primary text-primary-foreground px-4 py-2 font-bold uppercase hover:opacity-90 disabled:opacity-50 text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[1px]"
              >
                {isSaving ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1 text-muted-foreground uppercase tracking-wider">
                Título
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-2xl font-bold bg-background border-2 border-black p-3 focus:ring-0 outline-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              />
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Cuerpo
              </label>
              {blocks.map((block, index) => (
                <div
                  key={block.id}
                  className="group relative flex gap-2 items-start bg-background p-2 border-2 border-transparent hover:border-black transition-colors"
                >
                  {/* Reorder Controls */}
                  <div className="flex flex-col gap-1 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => moveBlock(index, "up")}
                      disabled={index === 0}
                      className="p-1 hover:bg-black hover:text-white disabled:opacity-30 border-2 border-transparent hover:border-black"
                      title="Mover arriba"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveBlock(index, "down")}
                      disabled={index === blocks.length - 1}
                      className="p-1 hover:bg-black hover:text-white disabled:opacity-30 border-2 border-transparent hover:border-black"
                      title="Mover abajo"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="flex-1">{renderBlockInput(block, index)}</div>

                  <button
                    onClick={() => removeBlock(index)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-500 hover:text-white transition-all border-2 border-transparent hover:border-black"
                    title="Eliminar bloque"
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-4 border-t border-border/50 flex-wrap">
              <BlockSelector
                onSelect={addBlock}
                triggerImageUpload={triggerImageUpload}
              />

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="opacity-50 pointer-events-none select-none">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Vista Previa (No editable aquí)
          </h3>
          <header className="mb-10 border-b border-border pb-8">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-tight">
              {title}
            </h1>
          </header>
          <div className="prose prose-neutral max-w-none">
            {/* Simple preview based on blocks */}
            {blocks.map((block) => {
              if (block.type.startsWith("h")) {
                const Tag = block.type as React.ElementType;
                return <Tag key={block.id}>{block.text}</Tag>;
              }
              if (block.type === "upload") {
                return block.value?.url ? (
                  <img
                    key={block.id}
                    src={block.value.url}
                    alt={block.value.alt || ""}
                    className="border-2 border-black"
                  />
                ) : null;
              }
              if (block.type === "hr") return <hr key={block.id} />;
              if (block.type === "blockquote")
                return <blockquote key={block.id}>{block.text}</blockquote>;
              if (
                block.type === "ul" ||
                block.type === "ol" ||
                block.type === "check"
              ) {
                return (
                  <div key={block.id} className="pl-4">
                    • {block.text}
                  </div>
                );
              }
              return <p key={block.id}>{block.text}</p>;
            })}
          </div>
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

      <div className="prose prose-neutral max-w-none font-sans">
        {data.contenido?.root?.children ? (
          <RichTextParser content={data.contenido.root.children} />
        ) : (
          <BlockRenderer blocks={data.layout || []} />
        )}
      </div>
    </>
  );
};

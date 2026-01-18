"use client";

import React, { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  FileText,
  Upload,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Layout,
  FileType,
} from "lucide-react";
import Link from "next/link";

// Types
interface EntradaInterna {
  id: string; // temp id for UI
  identificador_acto: string;
  tipo_acto: string; // ID or name
  jurisdiccion: string; // ID or name
  referencia: string;
  texto_completo: string;
  es_homologacion: boolean;
  id_acto_referenciado?: string;
  nivel_opacidad: "Transparente" | "Parcial" | "Opaco";
  lugar_fecha: string;
  resolucion: string;
  paginas: string; // comma separated numbers
  firmantes: string; // simple text or JSON string for now
}

interface Seccion {
  id: string; // temp id
  nombre: string;
  entradas: EntradaInterna[];
}

interface BoletinData {
  numero: number | "";
  fecha_publicacion: string;
  año_edicion: string;
  cantidad_paginas: number | "";
  recaudacion_diaria: number | "";
  // staff_autoridades implicitly handled or added later
  secciones: Seccion[];
}

export default function UploadBulletinPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"text" | "structure">("structure");

  // Upload State
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedText, setExtractedText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Structured Data State
  const [data, setData] = useState<BoletinData>({
    numero: "",
    fecha_publicacion: new Date().toISOString().split("T")[0],
    año_edicion: "",
    cantidad_paginas: "",
    recaudacion_diaria: "",
    secciones: [],
  });

  // UI State for Accordions
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});
  const [expandedEntries, setExpandedEntries] = useState<
    Record<string, boolean>
  >({});

  // Redirect if not authorized
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <h2 className="text-2xl font-bold">Acceso Denegado</h2>
        <p className="text-muted-foreground">
          Debes iniciar sesión para ver esta página.
        </p>
        <Link href="/" className="text-primary hover:underline">
          Volver al inicio
        </Link>
      </div>
    );
  }

  // --- Handlers ---
  const processText = async () => {
    if (!extractedText) return;
    console.log("Sending text to API...");

    try {
      const response = await fetch("/api/extract-bulletin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: extractedText }),
      });

      const result = await response.json();
      console.log("API Response:", result);

      if (!response.ok) {
        alert("Error sending text: " + (result.error || response.statusText));
      } else {
        alert("Texto enviado correctamente. Ver consola.");
      }
    } catch (error) {
      console.error("Error processing text:", error);
      alert("Error de conexión al procesar texto.");
    }
  };

  // --- Handlers for File Upload ---
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      processFile(file);
    } else {
      setError("Por favor, sube un archivo PDF válido.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = async (file: File) => {
    setError(null);
    setIsExtracting(true);
    setFileName(file.name);

    try {
      // Dynamically import pdfjs-dist to avoid SSR issues
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: { str: string } | any) => item.str)
          .join(" ");
        fullText += `--- Página ${i} ---\n${pageText}\n\n`;
      }

      setExtractedText(fullText);
      setData((prev) => ({ ...prev, cantidad_paginas: pdf.numPages }));

      // Auto-switch to structure tab to encourage filling data
      setActiveTab("structure");
    } catch (err) {
      console.error("Error extracting text:", err);
      setError("Error al extraer texto del PDF.");
    } finally {
      setIsExtracting(false);
    }
  };

  const resetState = () => {
    setExtractedText("");
    setFileName(null);
    setError(null);
    setData({
      numero: "",
      fecha_publicacion: new Date().toISOString().split("T")[0],
      año_edicion: "",
      cantidad_paginas: "",
      recaudacion_diaria: "",
      secciones: [],
    });
  };

  // --- Handlers for Structured Data ---
  const addSection = () => {
    const newSection: Seccion = {
      id: crypto.randomUUID(),
      nombre: "",
      entradas: [],
    };
    setData((prev) => ({
      ...prev,
      secciones: [...prev.secciones, newSection],
    }));
    toggleSection(newSection.id, true);
  };

  const removeSection = (id: string) => {
    setData((prev) => ({
      ...prev,
      secciones: prev.secciones.filter((s) => s.id !== id),
    }));
  };

  const updateSectionName = (id: string, name: string) => {
    setData((prev) => ({
      ...prev,
      secciones: prev.secciones.map((s) =>
        s.id === id ? { ...s, nombre: name } : s,
      ),
    }));
  };

  const addEntry = (sectionId: string) => {
    const newEntry: EntradaInterna = {
      id: crypto.randomUUID(),
      identificador_acto: "",
      tipo_acto: "",
      jurisdiccion: "",
      referencia: "",
      texto_completo: "",
      es_homologacion: false,
      nivel_opacidad: "Transparente",
      lugar_fecha: "Santiago del Estero, ",
      resolucion: "",
      paginas: "",
      firmantes: "",
    };

    setData((prev) => ({
      ...prev,
      secciones: prev.secciones.map((s) =>
        s.id === sectionId ? { ...s, entradas: [...s.entradas, newEntry] } : s,
      ),
    }));
    toggleEntry(newEntry.id, true);
  };

  const removeEntry = (sectionId: string, entryId: string) => {
    setData((prev) => ({
      ...prev,
      secciones: prev.secciones.map((s) =>
        s.id === sectionId
          ? { ...s, entradas: s.entradas.filter((e) => e.id !== entryId) }
          : s,
      ),
    }));
  };

  const updateEntry = (
    sectionId: string,
    entryId: string,
    field: keyof EntradaInterna,
    value: string | number | boolean,
  ) => {
    setData((prev) => ({
      ...prev,
      secciones: prev.secciones.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              entradas: s.entradas.map((e) =>
                e.id === entryId ? { ...e, [field]: value } : e,
              ),
            }
          : s,
      ),
    }));
  };

  const toggleSection = (id: string, force?: boolean) => {
    setExpandedSections((prev) => ({
      ...prev,
      [id]: force ?? !prev[id],
    }));
  };

  const toggleEntry = (id: string, force?: boolean) => {
    setExpandedEntries((prev) => ({
      ...prev,
      [id]: force ?? !prev[id],
    }));
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Cargar Boletín Oficial
          </h1>
          <p className="text-muted-foreground">
            Sube el PDF, revisa el texto extraído y completa la estructura.
          </p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Link>
      </div>

      {/* File Upload Area */}
      {!extractedText && (
        <div className="mb-8">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`min-h-[300px] flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-all duration-200 ${
              isDragging
                ? "border-primary bg-primary/5 scale-[0.99]"
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/20"
            }`}
          >
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
              ref={fileInputRef}
            />

            {isExtracting ? (
              <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                  <Loader2 className="w-12 h-12 text-primary animate-spin relative z-10" />
                </div>
                <div className="text-center space-y-1">
                  <p className="font-medium text-lg">Procesando PDF...</p>
                  <p className="text-sm text-muted-foreground">
                    Extrayendo texto y analizando estructura
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4 max-w-md mx-auto">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Sube tu archivo PDF</h3>
                  <p className="text-sm text-muted-foreground">
                    Arrastra y suelta tu boletín aquí.
                  </p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all font-medium"
                >
                  Seleccionar Archivo
                </button>
              </div>
            )}

            {error && (
              <div className="mt-8 p-4 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2 animate-in slide-in-from-bottom-2">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {extractedText && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Toolbar */}
          <div className="flex items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md text-sm font-medium">
                <FileText className="w-4 h-4 text-primary" />
                {fileName}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={processText}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
              >
                <Loader2 className="w-4 h-4" /> {/* Or another icon */}
                Procesar Texto
              </button>
              <button
                onClick={resetState}
                className="text-sm text-destructive hover:underline font-medium"
              >
                Descartar y Nuevo
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("structure")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "structure"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-2">
                <Layout className="w-4 h-4" />
                Datos Estructurados
              </div>
            </button>
            <button
              onClick={() => setActiveTab("text")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "text"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-2">
                <FileType className="w-4 h-4" />
                Texto Extraído (Raw)
              </div>
            </button>
          </div>

          {/* Tab Content */}
          <div className="min-h-[500px]">
            {activeTab === "text" ? (
              <div className="bg-muted/20 p-4 rounded-b-lg border border-t-0">
                <textarea
                  readOnly
                  value={extractedText}
                  className="w-full h-[600px] p-4 font-mono text-xs leading-relaxed bg-background rounded-lg border focus:outline-none resize-y"
                />
              </div>
            ) : (
              <div className="space-y-6 py-6">
                {/* 1. Boletin Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6 border rounded-xl bg-card shadow-sm">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Número</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded-md"
                      value={data.numero}
                      onChange={(e) =>
                        setData({
                          ...data,
                          numero: parseInt(e.target.value) || "",
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Fecha Publicación
                    </label>
                    <input
                      type="date"
                      className="w-full p-2 border rounded-md"
                      value={data.fecha_publicacion}
                      onChange={(e) =>
                        setData({ ...data, fecha_publicacion: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Año Edición (Romano)
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-md"
                      placeholder="Ej: XCIII"
                      value={data.año_edicion}
                      onChange={(e) =>
                        setData({ ...data, año_edicion: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cant. Páginas</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded-md bg-muted"
                      value={data.cantidad_paginas}
                      onChange={(e) =>
                        setData({
                          ...data,
                          cantidad_paginas: parseInt(e.target.value) || "",
                        })
                      }
                    />
                  </div>
                </div>

                {/* 2. Sections & Entries */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      Secciones y Entradas
                    </h3>
                    <button
                      onClick={addSection}
                      className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90"
                    >
                      <Plus className="w-4 h-4" /> Nueva Sección
                    </button>
                  </div>

                  {data.secciones.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/10">
                      <p className="text-muted-foreground">
                        No hay secciones definidas.
                      </p>
                      <button
                        onClick={addSection}
                        className="text-primary hover:underline text-sm mt-2"
                      >
                        Crear primera sección
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {data.secciones.map((sec) => (
                        <div
                          key={sec.id}
                          className="border rounded-lg bg-card overflow-hidden shadow-sm"
                        >
                          {/* Section Header */}
                          <div className="flex items-center gap-2 p-3 bg-muted/30 border-b">
                            <button
                              onClick={() => toggleSection(sec.id)}
                              className="p-1 hover:bg-muted rounded"
                            >
                              {expandedSections[sec.id] ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                            <input
                              type="text"
                              placeholder="Nombre de la Sección (ej: Decretos)"
                              className="flex-1 bg-transparent font-medium focus:outline-none focus:underline"
                              value={sec.nombre}
                              onChange={(e) =>
                                updateSectionName(sec.id, e.target.value)
                              }
                            />
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => addEntry(sec.id)}
                                className="p-1.5 text-primary hover:bg-primary/10 rounded"
                                title="Agregar Entrada"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => removeSection(sec.id)}
                                className="p-1.5 text-destructive hover:bg-destructive/10 rounded"
                                title="Eliminar Sección"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Entries List */}
                          {expandedSections[sec.id] && (
                            <div className="p-4 space-y-4 bg-muted/5">
                              {sec.entradas.length === 0 && (
                                <p className="text-xs text-muted-foreground italic text-center py-2">
                                  Sin entradas en esta sección.
                                </p>
                              )}
                              {sec.entradas.map((entry) => (
                                <div
                                  key={entry.id}
                                  className="border rounded-md bg-background"
                                >
                                  <div
                                    className="flex items-center gap-2 p-2 px-3 border-b hover:bg-muted/10 cursor-pointer"
                                    onClick={() => toggleEntry(entry.id)}
                                  >
                                    {expandedEntries[entry.id] ? (
                                      <ChevronDown className="w-3 h-3 text-muted-foreground" />
                                    ) : (
                                      <ChevronRight className="w-3 h-3 text-muted-foreground" />
                                    )}
                                    <span className="text-sm font-mono text-primary">
                                      {entry.identificador_acto ||
                                        "Nueva Entrada"}
                                    </span>
                                    <span className="text-xs text-muted-foreground truncate flex-1">
                                      {entry.referencia}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeEntry(sec.id, entry.id);
                                      }}
                                      className="text-destructive hover:bg-destructive/10 p-1 rounded"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>

                                  {expandedEntries[entry.id] && (
                                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                      <div className="space-y-1">
                                        <label className="text-xs font-semibold text-muted-foreground">
                                          Identificador
                                        </label>
                                        <input
                                          type="text"
                                          className="w-full p-1.5 border rounded"
                                          value={entry.identificador_acto}
                                          onChange={(e) =>
                                            updateEntry(
                                              sec.id,
                                              entry.id,
                                              "identificador_acto",
                                              e.target.value,
                                            )
                                          }
                                          placeholder="DECRETO-2025-..."
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-xs font-semibold text-muted-foreground">
                                          Tipo de Acto
                                        </label>
                                        <input
                                          type="text"
                                          className="w-full p-1.5 border rounded"
                                          value={entry.tipo_acto}
                                          onChange={(e) =>
                                            updateEntry(
                                              sec.id,
                                              entry.id,
                                              "tipo_acto",
                                              e.target.value,
                                            )
                                          }
                                        />
                                      </div>
                                      <div className="col-span-2 space-y-1">
                                        <label className="text-xs font-semibold text-muted-foreground">
                                          Referencia / Título
                                        </label>
                                        <textarea
                                          className="w-full p-1.5 border rounded h-16 resize-none"
                                          value={entry.referencia}
                                          onChange={(e) =>
                                            updateEntry(
                                              sec.id,
                                              entry.id,
                                              "referencia",
                                              e.target.value,
                                            )
                                          }
                                        />
                                      </div>
                                      <div className="col-span-2 space-y-1">
                                        <label className="text-xs font-semibold text-muted-foreground">
                                          Texto Completo
                                        </label>
                                        <textarea
                                          className="w-full p-1.5 border rounded h-32"
                                          value={entry.texto_completo}
                                          onChange={(e) =>
                                            updateEntry(
                                              sec.id,
                                              entry.id,
                                              "texto_completo",
                                              e.target.value,
                                            )
                                          }
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-xs font-semibold text-muted-foreground">
                                          Jurisdicción
                                        </label>
                                        <input
                                          type="text"
                                          className="w-full p-1.5 border rounded"
                                          value={entry.jurisdiccion}
                                          onChange={(e) =>
                                            updateEntry(
                                              sec.id,
                                              entry.id,
                                              "jurisdiccion",
                                              e.target.value,
                                            )
                                          }
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-xs font-semibold text-muted-foreground">
                                          Opacidad
                                        </label>
                                        <select
                                          className="w-full p-1.5 border rounded"
                                          value={entry.nivel_opacidad}
                                          onChange={(e) =>
                                            updateEntry(
                                              sec.id,
                                              entry.id,
                                              "nivel_opacidad",
                                              e.target.value as
                                                | "Transparente"
                                                | "Parcial"
                                                | "Opaco",
                                            )
                                          }
                                        >
                                          <option value="Transparente">
                                            Transparente
                                          </option>
                                          <option value="Parcial">
                                            Parcial
                                          </option>
                                          <option value="Opaco">Opaco</option>
                                        </select>
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-xs font-semibold text-muted-foreground">
                                          Lugar y Fecha
                                        </label>
                                        <input
                                          type="text"
                                          className="w-full p-1.5 border rounded"
                                          value={entry.lugar_fecha}
                                          onChange={(e) =>
                                            updateEntry(
                                              sec.id,
                                              entry.id,
                                              "lugar_fecha",
                                              e.target.value,
                                            )
                                          }
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-xs font-semibold text-muted-foreground">
                                          Páginas
                                        </label>
                                        <input
                                          type="text"
                                          className="w-full p-1.5 border rounded"
                                          value={entry.paginas}
                                          onChange={(e) =>
                                            updateEntry(
                                              sec.id,
                                              entry.id,
                                              "paginas",
                                              e.target.value,
                                            )
                                          }
                                          placeholder="1, 2, 3"
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

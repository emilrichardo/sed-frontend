"use client";

import React, { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  FileText,
  Upload,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Save,
  Cloud,
} from "lucide-react";
import Link from "next/link";

interface BoletinData {
  numero: number | "";
  fecha_publicacion: string;
  año_edicion: string;
  cantidad_paginas: number | "";
  recaudacion_diaria: number | "";
}

export default function UploadBulletinPage() {
  const { user } = useAuth();

  // Upload State
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedText, setExtractedText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drive Sync State
  const [driveToken, setDriveToken] = useState("");
  const [folderId, setFolderId] = useState("");
  const [useManualToken, setUseManualToken] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<any>(null);

  // Metadata State
  const [data, setData] = useState<BoletinData>({
    numero: "",
    fecha_publicacion: new Date().toISOString().split("T")[0],
    año_edicion: "",
    cantidad_paginas: "",
    recaudacion_diaria: "",
  });

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

  // --- Handlers for Drive Sync ---
  const handleDriveSync = async () => {
    if (!folderId) {
      alert("Por favor ingresa el ID de la Carpeta de Drive");
      return;
    }
    if (useManualToken && !driveToken) {
      alert("Por favor ingresa el Token Manual");
      return;
    }

    setIsSyncing(true);
    setSyncResults(null);
    try {
      const payload = {
        folderId,
        accessToken: useManualToken ? driveToken : undefined,
      };

      const res = await fetch("/api/drive-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      setSyncResults(json);
      if (!res.ok) {
        alert("Error en sincronización: " + (json.error || "Desconocido"));
      } else {
        alert("Sincronización completada. Revisa los resultados.");
      }
    } catch (err: any) {
      console.error(err);
      alert("Error de conexión");
    } finally {
      setIsSyncing(false);
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
    setPdfFile(file); // Store the file for later upload

    try {
      // Dynamically import pdfjs-dist
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

      const firstPageText = fullText.split("--- Página 2 ---")[0] || "";
      const numberMatch = firstPageText.match(/N\s*\/\s*([\d.]+)/i);
      const number = numberMatch
        ? parseInt(numberMatch[1].replace(/\./g, ""))
        : "";
      const yearMatch = firstPageText.match(/Año\s+([XIVLCDM]+)/i);
      const yearRoman = yearMatch ? yearMatch[1] : "";

      setData((prev) => ({
        ...prev,
        cantidad_paginas: pdf.numPages,
        numero: number || prev.numero,
        año_edicion: yearRoman || prev.año_edicion,
      }));
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
    setPdfFile(null);
    setError(null);
    setData({
      numero: "",
      fecha_publicacion: new Date().toISOString().split("T")[0],
      año_edicion: "",
      cantidad_paginas: "",
      recaudacion_diaria: "",
    });
  };

  const saveBulletin = async () => {
    if (!data.fecha_publicacion) {
      alert("Por favor, ingresa la fecha de publicación.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_PAYLOAD_API_URL || "http://localhost:3000";
      let mediaId: number | null = null;

      if (pdfFile) {
        const formData = new FormData();
        const altText = `Boletin Oficial N° ${data.numero || "?"} - ${data.fecha_publicacion || "Sin Fecha"}`;

        let fileToUpload = pdfFile;
        if (data.numero) {
          const newFileName = `${data.numero}.pdf`;
          fileToUpload = new File([pdfFile], newFileName, {
            type: pdfFile.type,
          });
        }

        formData.append("alt", altText);
        formData.append("file", fileToUpload);

        const mediaRes = await fetch(`${API_BASE_URL}/api/boletines-pdf`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!mediaRes.ok) {
          const errorText = await mediaRes.text();
          throw new Error(`Error uploading PDF: ${errorText}`);
        }

        const mediaData = await mediaRes.json();
        mediaId = mediaData.doc?.id || mediaData.id;
      }

      const boletinPayload = {
        numero: data.numero ? parseInt(String(data.numero)) : undefined,
        fecha_publicacion: data.fecha_publicacion,
        año_edicion:
          data.año_edicion ||
          String(new Date(data.fecha_publicacion).getFullYear()),
        cantidad_paginas: data.cantidad_paginas
          ? parseInt(String(data.cantidad_paginas))
          : undefined,
        recaudacion_diaria: data.recaudacion_diaria
          ? parseFloat(String(data.recaudacion_diaria))
          : undefined,
        raw_text: extractedText.substring(0, 1000000),
        archivo_binario: mediaId,
      };

      const boletinRes = await fetch(`${API_BASE_URL}/api/boletines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(boletinPayload),
      });

      if (!boletinRes.ok) {
        const errorText = await boletinRes.text();
        throw new Error(`Error creating bulletin: ${errorText}`);
      }

      const boletinData = await boletinRes.json();
      const boletinId = boletinData.doc?.id || boletinData.id;
      alert(`¡Boletín guardado exitosamente! ID: ${boletinId}`);
    } catch (err) {
      console.error("Error saving bulletin:", err);
      let errorMessage =
        err instanceof Error ? err.message : "Error al guardar el boletín";

      if (errorMessage.includes("numero") && errorMessage.includes("unique")) {
        errorMessage =
          "Error: Ya existe un boletín registrado con este Número. Verifica el número o elimina el existente.";
      } else if (
        errorMessage.includes("slug") &&
        errorMessage.includes("unique")
      ) {
        errorMessage =
          "Error: Ya existe un boletín con esta fecha/slug. Verifica la fecha.";
      }

      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Cargar Boletín Oficial
          </h1>
          <p className="text-muted-foreground">
            Elige entre sincronización automática con Drive o carga manual.
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

      {/* Drive Sync Section */}
      <div className="mb-8 p-6 bg-card border rounded-xl shadow-sm">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Cloud className="w-5 h-5 text-blue-500" /> Sincronizar con Google
          Drive
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">ID de Carpeta Drive</label>
              <input
                type="text"
                placeholder="Ej: 1AbCd..."
                className="w-full p-2 border rounded text-sm font-mono"
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
              />
            </div>

            <button
              onClick={handleDriveSync}
              disabled={isSyncing}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2 h-10"
            >
              {isSyncing && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSyncing ? "Sincronizando..." : "Iniciar Sincronización"}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="tokenToggle"
              checked={useManualToken}
              onChange={(e) => setUseManualToken(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label
              htmlFor="tokenToggle"
              className="text-xs text-muted-foreground select-none cursor-pointer"
            >
              Usar Token de Acceso Manual (Avanzado)
            </label>
          </div>

          {useManualToken && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
              <label className="text-sm font-medium">Google Access Token</label>
              <input
                type="password"
                placeholder="Pega tu token OAuth2 aquí..."
                className="w-full p-2 border rounded text-sm font-mono"
                value={driveToken}
                onChange={(e) => setDriveToken(e.target.value)}
              />
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Por defecto, usa las credenciales del servidor (auto-refresh).
          </p>

          {syncResults && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg text-xs font-mono max-h-60 overflow-y-auto border">
              <div className="flex justify-between font-bold mb-2">
                <span>Resultados:</span>
                <span>{syncResults.results?.length || 0} archivos</span>
              </div>
              {syncResults.results?.map((res: any, i: number) => (
                <div
                  key={i}
                  className={`mb-1 ${res.status === "success" ? "text-green-600" : res.status.includes("skipped") ? "text-yellow-600" : "text-red-600"}`}
                >
                  [{res.status}] {res.name} {res.error ? `(${res.error})` : ""}
                </div>
              ))}
              {syncResults.error && (
                <div className="text-red-600">{syncResults.error}</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            O Carga Manual
          </span>
        </div>
      </div>

      {/* File Upload Area (Manual) */}
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
                    Extrayendo texto...
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
          <div className="flex items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md text-sm font-medium">
                <FileText className="w-4 h-4 text-primary" />
                {fileName}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={saveBulletin}
                disabled={isSaving}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium shadow-sm ${
                  isSaving
                    ? "bg-green-400 cursor-wait"
                    : "bg-green-600 hover:bg-green-700"
                } text-white`}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSaving ? "Guardando..." : "Guardar Boletín"}
              </button>

              <button
                onClick={resetState}
                className="text-sm text-destructive hover:underline font-medium"
              >
                Descartar y Nuevo
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-4 p-6 border rounded-xl bg-card shadow-sm">
              <h3 className="text-lg font-semibold">Datos del Boletín</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Texto Extraído Preview
              </h3>
              <textarea
                readOnly
                value={extractedText}
                className="w-full h-[300px] p-4 font-mono text-xs leading-relaxed bg-muted/20 rounded-lg border focus:outline-none resize-y"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

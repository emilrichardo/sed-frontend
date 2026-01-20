"use client";

import React, { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  FileText,
  Upload,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Cloud,
  X,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Search,
  Check,
} from "lucide-react";
import Link from "next/link";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BoletinData {
  numero: number | "";
  fecha_publicacion: string;
  año_edicion: string;
  cantidad_paginas: number | "";
  recaudacion_diaria: number | "";
}

interface UploadItem {
  id: string;
  file: File;
  status: "pending" | "processing" | "ready" | "saving" | "success" | "error";
  extractedText: string;
  data: BoletinData;
  error?: string;
  isExpanded: boolean;
}

export default function UploadBulletinPage() {
  const { user } = useAuth();

  // --- Drive Sync & Scan State ---
  const [driveToken, setDriveToken] = useState("");
  const [folderId, setFolderId] = useState("");
  const [useManualToken, setUseManualToken] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [scannedFiles, setScannedFiles] = useState<any[]>([]);
  const [currentSyncIndex, setCurrentSyncIndex] = useState(-1);
  const [payloadApiKey, setPayloadApiKey] = useState("");

  // --- Multi-Upload State ---
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Helpers ---
  const getAuthHeader = () => {
    // Prioritize API Key if provided manually
    if (payloadApiKey) {
      return `users API-Key ${payloadApiKey}`;
    }
    // Fallback to Session Token
    const token = localStorage.getItem("payload-token");
    if (token) {
      return `JWT ${token}`;
    }
    return null;
  };

  // Load API Key from local storage on mount
  React.useEffect(() => {
    const storedKey = localStorage.getItem("payload-api-key");
    if (storedKey) setPayloadApiKey(storedKey);
  }, []);

  // Save API Key when changed
  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPayloadApiKey(val);
    localStorage.setItem("payload-api-key", val);
  };

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

  // --- Handlers: Scan & Sync ---
  const handleScan = async () => {
    if (!folderId) {
      alert("Ingresa ID de Carpeta");
      return;
    }
    const authHeader = getAuthHeader();
    if (!authHeader) {
      alert("Falta Auth (Token o API Key)");
      return;
    }

    setIsScanning(true);
    setScannedFiles([]);
    try {
      const payload = {
        folderId,
        accessToken: useManualToken ? driveToken : undefined,
      };
      const res = await fetch("/api/drive-scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        alert(`Error Scanning: ${json.error}`);
      } else {
        setScannedFiles(json.files || []);
      }
    } catch {
      alert("Error de conexión al escanear");
    } finally {
      setIsScanning(false);
    }
  };

  const handleSyncScanned = async () => {
    if (scannedFiles.length === 0) return;
    const authHeader = getAuthHeader();
    if (!authHeader) return;

    setIsSyncing(true);
    setCurrentSyncIndex(0);

    for (let i = 0; i < scannedFiles.length; i++) {
      const file = scannedFiles[i];
      setCurrentSyncIndex(i);

      setScannedFiles((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, status: "processing" } : f)),
      );

      try {
        if (file.status === "synced") {
          continue; // Skip already synced
        }

        const payload = {
          fileId: file.id,
          accessToken: useManualToken ? driveToken : undefined,
        };

        const res = await fetch("/api/drive-process-item", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify(payload),
        });

        const json = await res.json();

        if (!res.ok) {
          setScannedFiles((prev) =>
            prev.map((f, idx) =>
              idx === i ? { ...f, status: "error", error: json.error } : f,
            ),
          );
        } else {
          setScannedFiles((prev) =>
            prev.map((f, idx) =>
              idx === i ? { ...f, status: "synced", pages: json.pages } : f,
            ),
          );
        }
      } catch (e: any) {
        setScannedFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: "error", error: e.message } : f,
          ),
        );
      }
    }

    setIsSyncing(false);
    setCurrentSyncIndex(-1);
    alert("Sincronización Completada");
  };

  // --- Handlers: Manual Upload ---
  const processPdfFile = async (item: UploadItem): Promise<UploadItem> => {
    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      const arrayBuffer = await item.file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((item: { str: string } | any) => item.str)
          .join(" ");
        fullText += `--- Página ${i} ---\n${pageText}\n\n`;
      }

      const firstPageText = fullText.split("--- Página 2 ---")[0] || "";
      const numberMatch = firstPageText.match(/N\s*\/\s*([\d.]+)/i);
      const number = numberMatch
        ? parseInt(numberMatch[1].replace(/\./g, ""))
        : "";
      const yearMatch = firstPageText.match(/Año\s+([XIVLCDM]+)/i);
      const yearRoman = yearMatch ? yearMatch[1] : "";

      return {
        ...item,
        status: "ready",
        extractedText: fullText,
        data: {
          ...item.data,
          cantidad_paginas: pdf.numPages,
          numero: number || item.data.numero,
          año_edicion: yearRoman || item.data.año_edicion,
        },
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("Error extracting text for file", item.file.name, err);
      return {
        ...item,
        status: "error",
        error: "Fallo al procesar PDF: " + errorMessage,
      };
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;

    const newItems: UploadItem[] = Array.from(files)
      .filter((f) => f.type === "application/pdf")
      .map((f) => ({
        id: Math.random().toString(36).substring(2, 9),
        file: f,
        status: "processing",
        extractedText: "",
        data: {
          numero: "",
          fecha_publicacion: new Date().toISOString().split("T")[0],
          año_edicion: "",
          cantidad_paginas: "",
          recaudacion_diaria: "",
        },
        isExpanded: true,
      }));

    if (newItems.length === 0) return;

    setUploads((prev) => [...prev, ...newItems]);

    newItems.forEach(async (item) => {
      const processed = await processPdfFile(item);
      setUploads((prev) => prev.map((p) => (p.id === item.id ? processed : p)));
    });
  };

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
    handleFiles(e.dataTransfer.files);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    if (e.target) e.target.value = "";
  };

  const removeUpload = (id: string) => {
    if (confirm("¿Estás seguro de quitar este archivo?")) {
      setUploads((prev) => prev.filter((u) => u.id !== id));
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateUploadData = (
    id: string,
    field: keyof BoletinData,
    value: any,
  ) => {
    setUploads((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, data: { ...u.data, [field]: value } } : u,
      ),
    );
  };

  const toggleExpand = (id: string) => {
    setUploads((prev) =>
      prev.map((u) => (u.id === id ? { ...u, isExpanded: !u.isExpanded } : u)),
    );
  };

  const saveItem = async (item: UploadItem) => {
    if (item.status === "saving" || item.status === "success") return;
    if (!item.data.fecha_publicacion) {
      alert(`Falta fecha en ${item.file.name}`);
      return;
    }

    setUploads((prev) =>
      prev.map((u) => (u.id === item.id ? { ...u, status: "saving" } : u)),
    );

    try {
      const formData = new FormData();
      let fileToUpload = item.file;
      if (item.data.numero) {
        const newFileName = `${item.data.numero}.pdf`;
        fileToUpload = new File([item.file], newFileName, {
          type: item.file.type,
        });
      }

      const metadata = {
        ...item.data,
        extractedText: item.extractedText,
      };

      formData.append("file", fileToUpload);
      formData.append("metadata", JSON.stringify(metadata));

      const authHeader = getAuthHeader();
      if (!authHeader) throw new Error("No hay sesión activa ni API Key.");

      const response = await fetch("/api/manual-upload", {
        method: "POST",
        headers: {
          Authorization: authHeader,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error && result.error.includes("unique")) {
          throw new Error("Boletín duplicado (Número o Fecha ya existen).");
        }
        throw new Error(result.error || "Error desconocido al guardar");
      }

      setUploads((prev) =>
        prev.map((u) =>
          u.id === item.id
            ? { ...u, status: "success", error: undefined, isExpanded: false }
            : u,
        ),
      );
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(err);
      setUploads((prev) =>
        prev.map((u) =>
          u.id === item.id ? { ...u, status: "error", error: errorMessage } : u,
        ),
      );
    }
  };

  const saveAllReady = async () => {
    const readyItems = uploads.filter((u) => u.status === "ready");
    if (readyItems.length === 0) return;
    await Promise.all(readyItems.map((item) => saveItem(item)));
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 font-sans">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Cargar Boletines
          </h1>
          <p className="text-muted-foreground">
            Sube múltiples archivos PDF o sincroniza con Google Drive.
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

      {/* --- Drive Scan & Process Section --- */}
      <div className="mb-8 p-6 bg-card border rounded-xl shadow-sm">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Cloud className="w-5 h-5 text-blue-500" /> Sincronización Automática
          (Drive)
        </h2>

        <div className="mb-4 p-3 bg-yellow-50/50 border border-yellow-100 rounded-lg">
          <label className="block text-xs font-semibold text-yellow-700 mb-1">
            Payload API Key (Opcional - Para permisos Admin)
          </label>
          <input
            type="password"
            placeholder="users API-Key ..."
            className="w-full max-w-md p-2 border rounded text-sm font-mono bg-white"
            value={payloadApiKey}
            onChange={handleApiKeyChange}
          />
          <p className="text-[10px] text-yellow-600/80 mt-1">
            Si ves errores de &quot;Not allowed&quot;, genera una API Key en
            Payload (Usuarios) e ingrésala aquí. Se usará en lugar de tu sesión
            actual.
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">ID de Carpeta Drive</label>
              <input
                className="w-full p-2 border rounded text-sm font-mono"
                placeholder="Ej: 1AbCd..."
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleScan}
                disabled={isScanning || isSyncing}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-md font-medium disabled:opacity-50 flex items-center justify-center gap-2 h-10 border"
              >
                {isScanning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                {isScanning ? "Escaneando..." : "Escanear"}
              </button>

              <button
                onClick={handleSyncScanned}
                disabled={isSyncing || scannedFiles.length === 0}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50 flex items-center justify-center gap-2 h-10"
              >
                {isSyncing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Cloud className="w-4 h-4" />
                )}
                {isSyncing
                  ? `Sincronizando (${currentSyncIndex + 1}/${scannedFiles.length})`
                  : "Sincronizar Todo"}
              </button>
            </div>
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
              className="text-xs text-muted-foreground cursor-pointer select-none"
            >
              Usar Token Manual (Avanzado)
            </label>
          </div>
          {useManualToken && (
            <input
              type="password"
              placeholder="Access Token..."
              className="w-full p-2 border rounded text-sm font-mono"
              value={driveToken}
              onChange={(e) => setDriveToken(e.target.value)}
            />
          )}

          {scannedFiles.length > 0 && (
            <div className="mt-4 border rounded-md overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b text-xs font-semibold text-gray-500 uppercase flex justify-between">
                <span>Archivos ({scannedFiles.length})</span>
                <span>Estado</span>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y">
                {scannedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="px-4 py-2 text-sm flex justify-between items-center hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate max-w-[300px]">
                        {file.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {file.mimeType}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {file.status === "pending" && (
                        <span className="text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded text-xs">
                          Pendiente
                        </span>
                      )}
                      {file.status === "processing" && (
                        <span className="text-blue-600 flex items-center gap-1 text-xs">
                          <Loader2 className="w-3 h-3 animate-spin" />{" "}
                          Procesando
                        </span>
                      )}
                      {file.status === "synced" && (
                        <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs flex items-center gap-1">
                          <Check className="w-3 h-3" /> Completado
                        </span>
                      )}
                      {file.status === "error" && (
                        <span
                          className="text-red-600 bg-red-50 px-2 py-0.5 rounded text-xs"
                          title={file.error}
                        >
                          Error
                        </span>
                      )}
                      {/* Show Pages if available */}
                      {file.pages && (
                        <span className="text-gray-500 text-xs text-[10px] ml-2">
                          {file.pages} pág.
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t pt-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5 text-purple-500" /> Carga Manual (PDFs)
        </h2>
        {/* Dropzone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-xl p-8 transition-colors text-center cursor-pointer mb-6",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50",
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept="application/pdf"
            className="hidden"
          />
          <div className="flex flex-col items-center gap-2">
            <div className="p-4 bg-muted rounded-full">
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">
                Arrastra y suelta tus archivos PDF aquí
              </p>
              <p className="text-sm text-muted-foreground">
                o haz clic para explorar
              </p>
            </div>
          </div>
        </div>

        {/* Uploads List */}
        <div className="space-y-4">
          {uploads.map((item) => (
            <div
              key={item.id}
              className={cn(
                "border rounded-lg overflow-hidden transition-all",
                item.status === "error" && "border-red-200 bg-red-50",
                item.status === "success" && "border-green-200 bg-green-50",
              )}
            >
              {/* Header Row */}
              <div className="flex items-center justify-between p-4 bg-card/50">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div
                    className={cn(
                      "p-2 rounded-md",
                      item.status === "success"
                        ? "bg-green-100 text-green-600"
                        : "bg-blue-100 text-blue-600",
                    )}
                  >
                    {item.status === "success" ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <FileText className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{item.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(item.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {item.status === "processing" && (
                    <span className="text-xs text-blue-600 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Procesando
                    </span>
                  )}
                  {item.status === "saving" && (
                    <span className="text-xs text-orange-600 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Guardando
                    </span>
                  )}
                  {item.status === "error" && (
                    <span className="text-xs text-red-600 font-medium">
                      Error
                    </span>
                  )}

                  <button
                    onClick={() => toggleExpand(item.id)}
                    className="p-1 hover:bg-muted rounded text-muted-foreground"
                  >
                    {item.isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => removeUpload(item.id)}
                    className="p-1 hover:bg-red-100 text-red-400 hover:text-red-600 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded Details Form */}
              {item.isExpanded && (
                <div className="p-4 border-t bg-card/30 space-y-4">
                  {item.error && (
                    <div className="p-3 bg-red-100 text-red-700 text-sm rounded-md flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <p>{item.error}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Número
                      </label>
                      <input
                        className="w-full p-2 border rounded text-sm"
                        value={item.data.numero}
                        onChange={(e) =>
                          updateUploadData(item.id, "numero", e.target.value)
                        }
                        placeholder="Ej: 12345"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Fecha Publicación
                      </label>
                      <input
                        type="date"
                        className="w-full p-2 border rounded text-sm"
                        value={item.data.fecha_publicacion}
                        onChange={(e) =>
                          updateUploadData(
                            item.id,
                            "fecha_publicacion",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Año Edición
                      </label>
                      <input
                        className="w-full p-2 border rounded text-sm"
                        value={item.data.año_edicion}
                        onChange={(e) =>
                          updateUploadData(
                            item.id,
                            "año_edicion",
                            e.target.value,
                          )
                        }
                        placeholder="Ej: CXX"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Páginas
                      </label>
                      <input
                        type="number"
                        className="w-full p-2 border rounded text-sm"
                        value={item.data.cantidad_paginas}
                        onChange={(e) =>
                          updateUploadData(
                            item.id,
                            "cantidad_paginas",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Recaudación
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full p-2 border rounded text-sm"
                        value={item.data.recaudacion_diaria}
                        onChange={(e) =>
                          updateUploadData(
                            item.id,
                            "recaudacion_diaria",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => saveItem(item)}
                      disabled={
                        item.status === "saving" || item.status === "success"
                      }
                      className={cn(
                        "px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2",
                        item.status === "success"
                          ? "bg-green-600 text-white cursor-default"
                          : "bg-primary text-primary-foreground hover:bg-primary/90",
                      )}
                    >
                      {item.status === "saving" ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />{" "}
                          Guardando...
                        </>
                      ) : item.status === "success" ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" /> Guardado
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" /> Guardar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {uploads.length > 0 && (
            <div className="flex justify-end pt-4">
              <button
                onClick={saveAllReady}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Guardar Todo (
                {uploads.filter((u) => u.status === "ready").length})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

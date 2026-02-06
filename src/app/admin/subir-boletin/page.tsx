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
  RefreshCw,
  Search,
  Check,
  Save,
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

interface ScannedFile {
  id: string;
  name: string;
  mimeType?: string;
  status?: "pending" | "processing" | "synced" | "error";
  error?: string;
  extracted?: {
    numero?: string | number;
    fecha_publicacion?: string;
  };
  pages?: number;
  data?: BoletinData;
}

interface UploadItem {
  id: string;
  file: File;
  status: "pending" | "processing" | "ready" | "saving" | "success" | "error";
  extractedText: string;
  data: BoletinData;
  error?: string;
  isDuplicate?: boolean;
  existingId?: string;
  slug?: string;
}

export default function UploadBulletinPage() {
  const { user, logout } = useAuth();

  // --- Drive Sync & Scan State ---
  const [folderId, setFolderId] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedFiles, setScannedFiles] = useState<ScannedFile[]>([]);
  const [currentSyncIndex, setCurrentSyncIndex] = useState(-1);

  // --- Multi-Upload State ---
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<"manual" | "drive">("manual");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Helpers ---
  const getAuthHeader = () => {
    const token = localStorage.getItem("payload-token");
    if (token) {
      return `Bearer ${token}`;
    }
    return null;
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
      alert("Falta Auth (inicia sesión)");
      return;
    }

    setIsScanning(true);
    setScannedFiles([]);
    try {
      const payload = { folderId };
      const res = await fetch("/api/drive-scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(payload),
      });
      const json: { error?: string; files?: ScannedFile[] } = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          alert("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
          logout();
          return;
        }
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

  const handleSyncItem = async (index: number) => {
    const file = scannedFiles[index];
    const authHeader = getAuthHeader();
    if (!authHeader) return;

    // Update status to processing
    setScannedFiles((prev) =>
      prev.map((f, idx) =>
        idx === index ? { ...f, status: "processing" } : f,
      ),
    );

    try {
      const payload = { fileId: file.id };

      const res = await fetch("/api/drive-process-item", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(payload),
      });

      const json: {
        error?: string;
        pages?: number;
        extracted?: ScannedFile["extracted"];
      } = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          alert("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
          logout();
          return;
        }
        setScannedFiles((prev) =>
          prev.map((f, idx) =>
            idx === index ? { ...f, status: "error", error: json.error } : f,
          ),
        );
      } else {
        setScannedFiles((prev) =>
          prev.map((f, idx) =>
            idx === index
              ? {
                  ...f,
                  status: "synced",
                  pages: json.pages,
                  extracted: json.extracted,
                }
              : f,
          ),
        );
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Error desconocido";
      setScannedFiles((prev) =>
        prev.map((f, idx) =>
          idx === index ? { ...f, status: "error", error: errorMessage } : f,
        ),
      );
    }
  };

  const handleSyncAll = async () => {
    if (scannedFiles.length === 0) return;
    const authHeader = getAuthHeader();
    if (!authHeader) return;

    setIsSyncing(true);

    for (let i = 0; i < scannedFiles.length; i++) {
      const file = scannedFiles[i];
      if (file.status === "synced") continue;

      setCurrentSyncIndex(i);
      await handleSyncItem(i);
    }

    setIsSyncing(false);
    setCurrentSyncIndex(-1);
    alert("Sincronización Completada");
  };

  const showInfo = (file: ScannedFile) => {
    if (!file.extracted) return;
    const { numero, fecha_publicacion } = file.extracted;
    alert(
      `Boletín N° ${numero}\nFecha: ${fecha_publicacion}\nAño: ${file.data?.año_edicion || ""}\nPáginas: ${file.pages}`,
    );
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

      // Use the first part of the text for metadata search to avoid false positives later in valid text
      const headerText = fullText.substring(0, 10000);

      // 1. Number: e.g. "Boletin Oficial N/ 22.980", "N° 22.980"
      // IMPROVED: Look for "Boletin Oficial" context to avoid matching "Ley N° 123"
      // Use [\s\S] to match across newlines
      let numberMatch = headerText.match(
        /Bolet[íi]n\s+Oficial[\s\S]*?N\s*[º°o./]?\s*([\d.]+)/i,
      );

      if (!numberMatch) {
        // Fallback: Start of line matches for N°
        numberMatch = headerText.match(/(?:^|\n)\s*N\s*[º°o./]?\s*([\d.]+)/i);
      }

      const number = numberMatch
        ? parseInt(numberMatch[1].replace(/\./g, ""))
        : "";

      // 2. Year: e.g. "Año XCIII"
      const yearMatch = headerText.match(/Año\s+([XIVLCDM]+)/i);
      const yearRoman = yearMatch ? yearMatch[1] : "";

      // 3. Pages: e.g. "Edición de 40 Páginas"
      const pagesMatch = headerText.match(/Edición\s+de\s+(\d+)\s+Páginas/i);
      const pagesFromText = pagesMatch ? parseInt(pagesMatch[1]) : "";
      const finalPages = pagesFromText || pdf.numPages;

      // 4. Recaudacion: e.g. "TOTAL ________ $ 448.700", "TOTAL _____ $ 118.200"
      // Handles variable underscores, spaces, dots
      const recaudacionMatch = headerText.match(
        /TOTAL\s+[_]+\s*\$\s*([\d.,]+)/i,
      );
      let recaudacion: number | "" = "";
      if (recaudacionMatch) {
        // remove dots, replace comma with dot if exists (though usually it's integer in examples)
        // Example: 448.700 -> 448700.  118.200 -> 118200
        const cleanVal = recaudacionMatch[1]
          .replace(/\./g, "")
          .replace(",", ".");
        recaudacion = parseFloat(cleanVal);
      }

      // 5. Date: e.g. "Jueves 27 de Noviembre de 2025" or "Lunes 10 de Noviembre de 2025"
      const monthMap: { [key: string]: string } = {
        enero: "01",
        febrero: "02",
        marzo: "03",
        abril: "04",
        mayo: "05",
        junio: "06",
        julio: "07",
        agosto: "08",
        septiembre: "09",
        setiembre: "09",
        octubre: "10",
        noviembre: "11",
        diciembre: "12",
      };

      // Improved Date Regex: Don't require preceding word (DayName).
      // Matches: "1 de Noviembre de 2024", "07 de Agosto de 2015"
      // Groups: 1=Day, 2=MonthName, 3=Year
      // Use (?:^|[\s,.-]) to match start of line or separators
      const dateRegex =
        /(?:^|[\s,.-])(\d{1,2})\s+de\s+([a-záéíóú]+)\s+de\s+(\d{4})/gi;
      let fecha_publicacion = item.data.fecha_publicacion;

      // Find all matches, pick the valid one (sometimes "Boletin Oficial" appears before date)
      const dateMatches = [...headerText.matchAll(dateRegex)];

      for (const match of dateMatches) {
        const day = match[1].padStart(2, "0");
        const monthName = match[2].toLowerCase();
        const year = match[3];

        if (monthMap[monthName]) {
          const month = monthMap[monthName];
          fecha_publicacion = `${year}-${month}-${day}`;
          break; // Use the first valid date found
        }
      }

      const status: UploadItem["status"] = "ready";
      const errorMsg: string | undefined = undefined;
      let isDuplicate = false;
      let existingId: string | undefined = undefined;

      // 6. Check for duplicates in DB
      if (fecha_publicacion && number) {
        try {
          const slug = `${fecha_publicacion}-${number}`;
          const authHeader = getAuthHeader();
          const checkRes = await fetch(`/api/check-bulletin?slug=${slug}`, {
            headers: authHeader ? { Authorization: authHeader } : undefined,
          });
          if (checkRes.ok) {
            const checkJson = await checkRes.json();
            if (checkJson.docs && checkJson.docs.length > 0) {
              // Found duplicate
              isDuplicate = true;
              existingId = checkJson.docs[0].id;
              // We keep status as "ready" so user can choose to Update
            }
          }
        } catch (e) {
          console.warn("Error checking duplicate:", e);
        }
      }

      return {
        ...item,
        status: status,
        error: errorMsg,
        extractedText: fullText,
        isDuplicate,
        existingId,
        data: {
          ...item.data,
          cantidad_paginas: finalPages || item.data.cantidad_paginas,
          numero: number || item.data.numero,
          año_edicion: yearRoman || item.data.año_edicion,
          recaudacion_diaria:
            recaudacion !== "" ? recaudacion : item.data.recaudacion_diaria,
          fecha_publicacion: fecha_publicacion,
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

  const updateUploadData = (
    id: string,
    field: keyof BoletinData,
    value: string | number,
  ) => {
    setUploads((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, data: { ...u.data, [field]: value } } : u,
      ),
    );
  };

  const saveItem = async (item: UploadItem) => {
    if (item.status === "saving" || item.status === "success") return;
    if (!item.data.fecha_publicacion) {
      alert(`Falta fecha en ${item.file.name}`);
      return;
    }

    if (item.isDuplicate) {
      if (
        !confirm(
          "Este boletín ya existe. Al actualizar, se sobrescribirán los datos y el archivo. ¿Deseas continuar?",
        )
      ) {
        return;
      }
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
        id: item.existingId, // Pass ID if update
      };

      formData.append("file", fileToUpload);
      formData.append("metadata", JSON.stringify(metadata));

      const authHeader = getAuthHeader();
      if (!authHeader) throw new Error("No hay sesión activa.");

      const response = await fetch("/api/manual-upload", {
        method: "POST",
        headers: {
          Authorization: authHeader,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          alert("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
          logout();
          return;
        }
        if (result.error && result.error.includes("unique")) {
          throw new Error("Boletín duplicado (Número o Fecha ya existen).");
        }
        throw new Error(result.error || "Error desconocido al guardar");
      }

      setUploads((prev) =>
        prev.map((u) =>
          u.id === item.id
            ? {
                ...u,
                status: "success",
                error: undefined,
                isExpanded: false,
                slug: result.doc?.slug || result.slug,
              }
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
    // Only save NEW items (not duplicates) to avoid unintended bulk overwrites
    const readyItems = uploads.filter(
      (u) => u.status === "ready" && !u.isDuplicate,
    );
    if (readyItems.length === 0) return;
    await Promise.all(readyItems.map((item) => saveItem(item)));
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 font-sans">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b">
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
          className="flex items-center gap-2 px-4 py-2 border rounded-md font-medium hover:bg-accent transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Inicio
        </Link>
      </div>

      {/* --- Drive Scan & Process Section --- */}
      {/* Tabs */}
      <div className="flex justify-center mb-8">
        <div className="bg-muted p-1 rounded-lg inline-flex">
          <button
            onClick={() => setActiveTab("manual")}
            className={cn(
              "px-6 py-2 text-sm font-medium rounded-md transition-all",
              activeTab === "manual"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background/50",
            )}
          >
            Carga Manual (PDFs)
          </button>
          <button
            onClick={() => setActiveTab("drive")}
            className={cn(
              "px-6 py-2 text-sm font-medium rounded-md transition-all",
              activeTab === "drive"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background/50",
            )}
          >
            Sincronización Drive
          </button>
        </div>
      </div>

      {/* --- Drive Scan & Process Section --- */}
      {activeTab === "drive" && (
        <div className="mb-8 p-8 bg-card border rounded-lg shadow-sm flex flex-col items-center text-center space-y-6 max-w-3xl mx-auto">
          <div className="bg-muted p-4 rounded-full border">
            <Cloud className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            Sincronización Automática (Drive)
          </h2>

          <div className="w-full max-w-lg space-y-4">
            <div className="space-y-2 text-left">
              <label className="text-sm font-semibold text-muted-foreground uppercase text-[10px]">
                ID de Carpeta Drive
              </label>
              <input
                className="w-full p-2.5 border rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="Ej: 1AbCd..."
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleScan}
                disabled={isScanning || isSyncing}
                className="flex-1 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium rounded-md shadow-sm border border-transparent transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {isScanning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                {isScanning ? "Escaneando..." : "Escanear"}
              </button>

              <button
                onClick={handleSyncAll}
                disabled={isSyncing || scannedFiles.length === 0}
                className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-md shadow-sm border border-transparent transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
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

          <div className="w-full text-left">
            {scannedFiles.length > 0 && (
              <div className="mt-8 border rounded-lg shadow-sm overflow-hidden bg-background">
                <div className="bg-muted/50 px-4 py-3 border-b text-sm font-medium flex justify-between">
                  <span>Archivos ({scannedFiles.length})</span>
                  <span>Acciones</span>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y bg-background">
                  {scannedFiles.map((file, i) => (
                    <div
                      key={file.id}
                      className="px-4 py-3 text-sm flex justify-between items-center hover:bg-muted/30 transition-colors"
                    >
                      {/* ... Content of Scanned File Item (Can be styled further later) ... */}
                      <div className="flex flex-col flex-1 overflow-hidden gap-1">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate max-w-[300px] font-medium font-mono text-sm">
                            {file.name}
                          </span>

                          {/* Status Badges */}
                          {file.status === "processing" && (
                            <span className="text-blue-600 flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 border border-blue-600 bg-blue-50">
                              <Loader2 className="w-3 h-3 animate-spin" />{" "}
                              Procesando
                            </span>
                          )}
                          {file.status === "synced" && (
                            <span className="text-green-600 border border-green-600 bg-green-50 px-2 py-0.5 text-[10px] font-bold uppercase flex items-center gap-1">
                              <Check className="w-3 h-3" /> Ok
                            </span>
                          )}
                          {file.status === "error" && (
                            <span
                              className="text-red-600 border border-red-600 bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase"
                              title={file.error}
                            >
                              Error
                            </span>
                          )}
                        </div>

                        {/* Metadata Row */}
                        {(file.extracted ||
                          (file.status === "synced" && file.pages)) && (
                          <div className="text-xs text-muted-foreground ml-6 flex gap-3 font-mono">
                            {file.extracted?.numero && (
                              <span>
                                <span className="font-bold text-black">
                                  N°:
                                </span>{" "}
                                {file.extracted.numero}
                              </span>
                            )}
                            {file.extracted?.fecha_publicacion && (
                              <span>
                                <span className="font-bold text-black">
                                  Fecha:
                                </span>{" "}
                                {file.extracted.fecha_publicacion}
                              </span>
                            )}
                            {(file.pages || file.data?.cantidad_paginas) && (
                              <span>
                                <span className="font-bold text-black">
                                  Págs:
                                </span>{" "}
                                {file.pages || file.data?.cantidad_paginas}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Info Button */}
                        {(file.status === "synced" || file.extracted) && (
                          <button
                            onClick={() => showInfo(file)}
                            className="p-1.5 text-muted-foreground hover:bg-muted rounded-md transition-colors"
                            title="Ver Información Extraída"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        )}

                        {/* Sync Button (Individual) */}
                        <button
                          onClick={() => handleSyncItem(i)}
                          disabled={file.status === "processing" || isSyncing}
                          className={cn(
                            "px-3 py-1.5 text-[10px] font-semibold border rounded-md flex items-center gap-1 transition-all",
                            file.status === "synced"
                              ? "bg-muted text-muted-foreground border-transparent cursor-not-allowed"
                              : "bg-background hover:bg-muted text-foreground",
                          )}
                        >
                          {file.status === "synced"
                            ? "Re-Sincronizar"
                            : "Sincronizar"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "manual" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Carga Manual (PDFs)
            </h2>
            <button
              onClick={saveAllReady}
              disabled={
                uploads.filter((u) => u.status === "ready" && !u.isDuplicate)
                  .length === 0
              }
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-md shadow-sm transition-all disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              <Save className="w-4 h-4" />
              Guardar Todo (
              {
                uploads.filter((u) => u.status === "ready" && !u.isDuplicate)
                  .length
              }
              )
            </button>
          </div>
          {/* Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-lg transition-all text-center cursor-pointer py-12 bg-muted/30 hover:bg-muted/50",
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
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-background rounded-full border shadow-sm">
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
            {uploads.length > 0 && (
              <div className="border rounded-lg shadow-sm bg-card overflow-hidden">
                <div className="bg-muted/50 px-4 py-3 border-b flex justify-between items-center text-sm font-medium">
                  <span>Archivos ({uploads.length})</span>
                  <span>Acciones</span>
                </div>
                <div className="divide-y max-h-[600px] overflow-y-auto">
                  {uploads.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "px-4 py-4 flex flex-col md:flex-row justify-between items-start hover:bg-muted/30 transition-colors gap-4",
                        item.status === "success" && "bg-green-50/30",
                        item.status === "error" && "bg-red-50/30",
                      )}
                    >
                      <div className="flex flex-col flex-1 gap-3 overflow-hidden w-full">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "p-2 rounded-md flex-shrink-0 bg-muted",
                              item.status === "success"
                                ? "text-green-600 bg-green-100/50"
                                : "text-muted-foreground",
                            )}
                          >
                            {item.status === "success" ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : (
                              <FileText className="w-5 h-5" />
                            )}
                          </div>

                          <div className="flex flex-col min-w-0">
                            <span
                              className="font-medium truncate max-w-[200px] md:max-w-[400px] text-sm"
                              title={item.file.name}
                            >
                              {item.file.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {(item.file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                          </div>

                          {/* Status Badges */}
                          <div className="flex flex-wrap gap-2 ml-2">
                            {item.status === "processing" && (
                              <span className="text-blue-600 border border-blue-200 bg-blue-50 flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full">
                                <Loader2 className="w-3 h-3 animate-spin" />{" "}
                                Procesando
                              </span>
                            )}
                            {item.status === "saving" && (
                              <span className="text-orange-600 border border-orange-200 bg-orange-50 flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full">
                                <Loader2 className="w-3 h-3 animate-spin" />{" "}
                                Guardando
                              </span>
                            )}
                            {item.status === "success" && (
                              <span className="text-green-600 border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-semibold uppercase flex items-center gap-1 rounded-full">
                                <CheckCircle2 className="w-3 h-3" /> Guardado
                              </span>
                            )}
                            {item.status === "error" && (
                              <span className="text-red-600 border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase flex items-center gap-1 rounded-full">
                                <AlertCircle className="w-3 h-3" /> Error
                              </span>
                            )}
                            {item.isDuplicate && item.status === "ready" && (
                              <span className="text-orange-600 border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-semibold uppercase flex items-center gap-1 rounded-full">
                                <AlertCircle className="w-3 h-3" /> Existe
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Metadata / Editor Row */}
                        {(item.status === "ready" ||
                          item.status === "error") && (
                          <div className="ml-12 mt-1 w-full max-w-4xl">
                            {item.isDuplicate && (
                              <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-md text-xs text-orange-900 flex items-start gap-2 font-medium">
                                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-orange-600" />
                                <p>
                                  <strong>ADVERTENCIA:</strong> Este boletín ya
                                  existe. Si guardas, se sobrescribirán los
                                  datos.
                                </p>
                              </div>
                            )}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                              <div className="flex flex-col gap-1.5">
                                <label className="font-semibold text-[10px] uppercase text-muted-foreground">
                                  Número
                                </label>
                                <input
                                  placeholder="Ej: 12345"
                                  className="border rounded-md px-2 py-1.5 h-8 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                  value={item.data.numero}
                                  onChange={(e) =>
                                    updateUploadData(
                                      item.id,
                                      "numero",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <label className="font-semibold text-[10px] uppercase text-muted-foreground">
                                  Fecha Publicación
                                </label>
                                <input
                                  type="date"
                                  className="border rounded-md px-2 py-1.5 h-8 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
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

                              <div className="flex flex-col gap-1.5">
                                <label className="font-semibold text-[10px] uppercase text-muted-foreground">
                                  Páginas
                                </label>
                                <input
                                  placeholder="Cant."
                                  className="border rounded-md px-2 py-1.5 h-8 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
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

                              <div className="flex flex-col gap-1.5">
                                <label className="font-semibold text-[10px] uppercase text-muted-foreground">
                                  Año Edición
                                </label>
                                <input
                                  placeholder="Ej: CXX"
                                  className="border rounded-md px-2 py-1.5 h-8 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                  value={item.data.año_edicion}
                                  onChange={(e) =>
                                    updateUploadData(
                                      item.id,
                                      "año_edicion",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Compact Metadata Display (ReadOnly) for Saved Items */}
                        {(item.status === "success" ||
                          item.status === "saving") && (
                          <div className="ml-12 mt-1 space-y-2">
                            <div className="text-xs text-muted-foreground flex flex-wrap gap-3 font-mono">
                              <span className="bg-muted/50 px-1.5 py-0.5 rounded border">
                                <span className="font-bold">N°:</span>{" "}
                                {item.data.numero}
                              </span>
                              <span className="bg-muted/50 px-1.5 py-0.5 rounded border">
                                <span className="font-bold">Fecha:</span>{" "}
                                {item.data.fecha_publicacion}
                              </span>
                              <span className="bg-muted/50 px-1.5 py-0.5 rounded border">
                                <span className="font-bold">Págs:</span>{" "}
                                {item.data.cantidad_paginas}
                              </span>
                            </div>

                            {item.status === "success" && item.slug && (
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/boletines/${item.slug}`}
                                  target="_blank"
                                  className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                                >
                                  Ver Boletín Públicado
                                  <ArrowLeft className="w-3 h-3 rotate-180" />
                                </Link>
                              </div>
                            )}
                          </div>
                        )}

                        {item.error && (
                          <div className="text-xs text-red-600 ml-12 mt-2 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
                            <span className="font-bold">ERROR:</span>{" "}
                            {item.error}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Individual Save Button */}
                        {item.status === "ready" && (
                          <button
                            onClick={() => saveItem(item)}
                            className={cn(
                              "px-3 py-1.5 text-xs font-semibold rounded-md border flex items-center gap-1.5 transition-all shadow-sm",
                              item.isDuplicate
                                ? "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
                                : "bg-primary text-primary-foreground hover:bg-primary/90 border-transparent",
                            )}
                          >
                            {item.isDuplicate ? (
                              <>
                                <RefreshCw className="w-3 h-3" /> Actualizar
                              </>
                            ) : (
                              <>
                                <Save className="w-3 h-3" /> Guardar
                              </>
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => removeUpload(item.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                          title="Quitar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Footer with Guardar Todo */}
                <div className="bg-muted/30 px-4 py-3 border-t flex justify-end">
                  <button
                    onClick={saveAllReady}
                    disabled={
                      uploads.filter(
                        (u) => u.status === "ready" && !u.isDuplicate,
                      ).length === 0
                    }
                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-md shadow-sm transition-all disabled:opacity-50 flex items-center gap-2 text-sm"
                  >
                    <Save className="w-4 h-4" />
                    Guardar Todo (
                    {
                      uploads.filter(
                        (u) => u.status === "ready" && !u.isDuplicate,
                      ).length
                    }
                    )
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

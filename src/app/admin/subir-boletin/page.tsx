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
    // Only save NEW items (not duplicates) to avoid unintended bulk overwrites
    const readyItems = uploads.filter(
      (u) => u.status === "ready" && !u.isDuplicate,
    );
    if (readyItems.length === 0) return;
    await Promise.all(readyItems.map((item) => saveItem(item)));
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 font-sans">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-4 border-black pb-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-incompatible uppercase mb-2">
            Cargar Boletines
          </h1>
          <p className="text-lg font-medium text-muted-foreground">
            Sube múltiples archivos PDF o sincroniza con Google Drive.
          </p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 border-2 border-black font-bold uppercase hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-none bg-white text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Inicio
        </Link>
      </div>

      {/* --- Drive Scan & Process Section --- */}
      {/* Tabs */}
      <div className="flex justify-center mb-12">
        <div className="bg-black p-1.5 inline-flex shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
          <button
            onClick={() => setActiveTab("manual")}
            className={cn(
              "px-8 py-3 text-sm font-bold uppercase tracking-wide transition-all",
              activeTab === "manual"
                ? "bg-white text-black shadow-sm"
                : "text-white hover:bg-white/10",
            )}
          >
            Carga Manual (PDFs)
          </button>
          <button
            onClick={() => setActiveTab("drive")}
            className={cn(
              "px-8 py-3 text-sm font-bold uppercase tracking-wide transition-all",
              activeTab === "drive"
                ? "bg-white text-black shadow-sm"
                : "text-white hover:bg-white/10",
            )}
          >
            Sincronización Drive
          </button>
        </div>
      </div>

      {/* --- Drive Scan & Process Section --- */}
      {activeTab === "drive" && (
        <div className="mb-8 p-12 bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center text-center space-y-6 max-w-3xl mx-auto">
          <div className="bg-black p-4 rounded-full">
            <Cloud className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight">
            Sincronización Automática (Drive)
          </h2>

          <div className="w-full max-w-lg space-y-4 px-4">
            <div className="space-y-2 text-left">
              <label className="text-sm font-bold uppercase">
                ID de Carpeta Drive
              </label>
              <input
                className="w-full p-3 border-2 border-black text-sm font-mono focus:outline-none focus:ring-4 focus:ring-black/20"
                placeholder="Ej: 1AbCd..."
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleScan}
                disabled={isScanning || isSyncing}
                className="flex-1 px-4 py-3 bg-white hover:bg-gray-50 text-black border-2 border-black font-bold uppercase disabled:opacity-50 flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-none transition-all"
              >
                {isScanning ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                {isScanning ? "Escaneando..." : "Escanear"}
              </button>

              <button
                onClick={handleSyncAll}
                disabled={isSyncing || scannedFiles.length === 0}
                className="flex-1 px-4 py-3 bg-black hover:bg-gray-800 text-white border-2 border-black font-bold uppercase disabled:opacity-50 flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-none transition-all"
              >
                {isSyncing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Cloud className="w-5 h-5" />
                )}
                {isSyncing
                  ? `Sincronizando (${currentSyncIndex + 1}/${scannedFiles.length})`
                  : "Sincronizar Todo"}
              </button>
            </div>
          </div>

          <div className="w-full text-left">
            {scannedFiles.length > 0 && (
              <div className="mt-8 border-2 border-black">
                <div className="bg-black text-white px-4 py-3 border-b-2 border-black text-sm font-bold uppercase flex justify-between tracking-wider">
                  <span>Archivos ({scannedFiles.length})</span>
                  <span>Acciones</span>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y-2 divide-black bg-gray-50">
                  {scannedFiles.map((file, i) => (
                    <div
                      key={file.id}
                      className="px-4 py-3 text-sm flex justify-between items-center hover:bg-white transition-colors"
                    >
                      {/* ... Content of Scanned File Item (Can be styled further later) ... */}
                      <div className="flex flex-col flex-1 overflow-hidden gap-1">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-black flex-shrink-0" />
                          <span className="truncate max-w-[300px] font-bold font-mono">
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
                            className="p-1.5 text-black hover:bg-black hover:text-white border border-black transition-colors"
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
                            "px-3 py-1.5 text-[10px] font-bold uppercase border-2 flex items-center gap-1 transition-all",
                            file.status === "synced"
                              ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                              : "bg-white text-black border-black hover:bg-black hover:text-white hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
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
        <div className="pt-4">
          <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-black">
            <h2 className="text-2xl font-black uppercase flex items-center gap-3">
              <div className="bg-black text-white p-1">
                <Upload className="w-6 h-6" />
              </div>
              Carga Manual (PDFs)
            </h2>
            <button
              onClick={saveAllReady}
              disabled={
                uploads.filter((u) => u.status === "ready" && !u.isDuplicate)
                  .length === 0
              }
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold uppercase border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
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
              "border-4 border-dashed transition-all text-center cursor-pointer mb-8 py-12 bg-gray-50 relative group",
              isDragging
                ? "border-primary bg-primary/10 scale-[0.99]"
                : "border-gray-300 hover:border-black hover:bg-white hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]",
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
            {uploads.length > 0 && (
              <div className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
                <div className="bg-black text-white px-4 py-3 border-b-2 border-black text-sm font-bold uppercase flex justify-between tracking-wider">
                  <span>Archivos ({uploads.length})</span>
                  <span>Acciones</span>
                </div>
                <div className="max-h-[600px] overflow-y-auto divide-y-2 divide-black">
                  {uploads.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "px-4 py-4 text-sm flex flex-col md:flex-row justify-between items-start hover:bg-gray-50 transition-colors gap-4",
                        item.status === "success" && "bg-green-50/50",
                        item.status === "error" && "bg-red-50/50",
                        item.isDuplicate &&
                          item.status === "ready" &&
                          "bg-orange-50/30",
                      )}
                    >
                      <div className="flex flex-col flex-1 gap-3 overflow-hidden w-full">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "p-2 border-2 border-black flex-shrink-0 bg-white",
                              item.status === "success"
                                ? "text-green-600"
                                : "text-black",
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
                              className="font-bold font-mono truncate max-w-[200px] md:max-w-[400px] text-base"
                              title={item.file.name}
                            >
                              {item.file.name}
                            </span>
                            <span className="text-[10px] font-bold uppercase text-muted-foreground">
                              {(item.file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                          </div>

                          {/* Status Badges */}
                          <div className="flex flex-wrap gap-2 ml-2">
                            {item.status === "processing" && (
                              <span className="text-blue-600 border-2 border-blue-600 bg-blue-50 flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5">
                                <Loader2 className="w-3 h-3 animate-spin" />{" "}
                                Procesando
                              </span>
                            )}
                            {item.status === "saving" && (
                              <span className="text-orange-600 border-2 border-orange-600 bg-orange-50 flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5">
                                <Loader2 className="w-3 h-3 animate-spin" />{" "}
                                Guardando
                              </span>
                            )}
                            {item.status === "success" && (
                              <span className="text-green-600 border-2 border-green-600 bg-green-50 px-2 py-0.5 text-[10px] font-bold uppercase flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Guardado
                              </span>
                            )}
                            {item.status === "error" && (
                              <span className="text-red-600 border-2 border-red-600 bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Error
                              </span>
                            )}
                            {item.isDuplicate && item.status === "ready" && (
                              <span className="text-orange-600 border-2 border-orange-600 bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase flex items-center gap-1">
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
                              <div className="mb-3 p-3 bg-orange-50 border-2 border-orange-200 text-xs text-orange-900 flex items-start gap-2 font-medium">
                                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-orange-600" />
                                <p>
                                  <strong>ADVERTENCIA:</strong> Este boletín ya
                                  existe. Si guardas, se sobrescribirán los
                                  datos.
                                </p>
                              </div>
                            )}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                              <div className="flex flex-col gap-1">
                                <label className="font-bold uppercase text-[10px]">
                                  Número
                                </label>
                                <input
                                  placeholder="Ej: 12345"
                                  className="border-2 border-black px-2 py-2 h-9 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-black/20"
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

                              <div className="flex flex-col gap-1">
                                <label className="font-bold uppercase text-[10px]">
                                  Fecha Publicación
                                </label>
                                <input
                                  type="date"
                                  className="border-2 border-black px-2 py-2 h-9 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-black/20"
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

                              <div className="flex flex-col gap-1">
                                <label className="font-bold uppercase text-[10px]">
                                  Páginas
                                </label>
                                <input
                                  placeholder="Cant."
                                  className="border-2 border-black px-2 py-2 h-9 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-black/20"
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

                              <div className="flex flex-col gap-1">
                                <label className="font-bold uppercase text-[10px]">
                                  Año Edición
                                </label>
                                <input
                                  placeholder="Ej: CXX"
                                  className="border-2 border-black px-2 py-2 h-9 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-black/20"
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
                          <div className="text-xs text-muted-foreground ml-12 flex flex-wrap gap-4 mt-1 font-mono">
                            <span className="bg-gray-100 px-2 py-1 border border-gray-300">
                              <span className="font-bold text-black">N°:</span>{" "}
                              {item.data.numero}
                            </span>
                            <span className="bg-gray-100 px-2 py-1 border border-gray-300">
                              <span className="font-bold text-black">
                                Fecha:
                              </span>{" "}
                              {item.data.fecha_publicacion}
                            </span>
                            <span className="bg-gray-100 px-2 py-1 border border-gray-300">
                              <span className="font-bold text-black">
                                Págs:
                              </span>{" "}
                              {item.data.cantidad_paginas}
                            </span>
                          </div>
                        )}

                        {item.error && (
                          <p className="text-xs text-red-600 ml-12 mt-2 font-bold bg-red-50 border border-red-200 px-2 py-1 inline-block uppercase">
                            Error: {item.error}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Individual Save Button */}
                        {item.status === "ready" && (
                          <button
                            onClick={() => saveItem(item)}
                            className={cn(
                              "px-4 py-2 text-xs font-bold uppercase border-2 flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-none transition-all h-9 whitespace-nowrap",
                              item.isDuplicate
                                ? "bg-orange-50 text-orange-700 border-black hover:bg-orange-100"
                                : "bg-purple-50 text-purple-700 border-black hover:bg-purple-100",
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
                          className="p-2 text-black hover:bg-red-600 hover:text-white border-2 border-transparent hover:border-black transition-all"
                          title="Quitar"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Footer with Guardar Todo */}
                <div className="bg-gray-100 px-4 py-4 border-t-2 border-black flex justify-end">
                  <button
                    onClick={saveAllReady}
                    disabled={
                      uploads.filter(
                        (u) => u.status === "ready" && !u.isDuplicate,
                      ).length === 0
                    }
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 flex items-center gap-2 text-sm"
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

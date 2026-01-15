"use client";

import React, { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { Upload, X, FileText, Loader2, AlertCircle } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export function UploadBulletinButton() {
  const { isEditing, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedText, setExtractedText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isEditing || !user) return null;

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
    setIsExtracting(true);
    setError(null);
    setFileName(file.name);
    setExtractedText("");

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        fullText += `--- Página ${i} ---\n${pageText}\n\n`;
      }

      setExtractedText(fullText);
    } catch (err) {
      console.error("Error extracting PDF text:", err);
      setError(
        "Error al extraer el texto del PDF. Asegúrate de que el archivo no esté protegido."
      );
    } finally {
      setIsExtracting(false);
    }
  };

  const resetState = () => {
    setIsOpen(false);
    setExtractedText("");
    setError(null);
    setFileName(null);
    setIsExtracting(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-sm text-sm font-medium"
      >
        <Upload className="h-4 w-4" />
        Cargar Boletín
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-lg">Cargar Nuevo Boletín</h3>
              </div>
              <button
                onClick={resetState}
                className="p-1 hover:bg-muted rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {!fileName ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <div className="p-4 bg-primary/10 rounded-full">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">
                      Arrastra el PDF aquí o haz clic para buscar
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Solo archivos PDF
                    </p>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf"
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm truncate max-w-[300px]">
                          {fileName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PDF cargado correctamente
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setFileName(null);
                        setExtractedText("");
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      Cambiar archivo
                    </button>
                  </div>

                  {isExtracting && (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                      <p className="text-sm text-muted-foreground">
                        Extrayendo texto del PDF...
                      </p>
                    </div>
                  )}

                  {error && (
                    <div className="flex items-start gap-3 p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
                      <AlertCircle className="h-5 w-5 shrink-0" />
                      <p className="text-sm">{error}</p>
                    </div>
                  )}

                  {extractedText && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Texto Extraído (Vista Previa)
                      </label>
                      <div className="p-4 bg-muted rounded-lg border font-mono text-xs whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                        {extractedText}
                      </div>
                      <p className="text-[10px] text-muted-foreground italic">
                        * Este texto será procesado para generar las entradas
                        del boletín automáticamente.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-muted/30 flex justify-end gap-3">
              <button
                onClick={resetState}
                className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                disabled={!extractedText || isExtracting}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-sm text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Procesar Boletín
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

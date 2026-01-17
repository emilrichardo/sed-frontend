"use client";

import React, { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { FileText, Upload, X, Loader2, AlertCircle } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
    setError(null);
    setIsExtracting(true);
    setFileName(file.name);

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
      console.error("Error extracting text:", err);
      setError("Error al extraer texto del PDF.");
    } finally {
      setIsExtracting(false);
    }
  };

  const resetState = () => {
    setExtractedText("");
    setFileName(null);
    setIsOpen(false);
    setError(null);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors shadow-sm font-medium text-sm"
      >
        <Upload className="w-4 h-4" />
        Cargar Boletín
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-background rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden border">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">
                    Cargar Boletín Oficial
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Sube el PDF para extraer el contenido.
                  </p>
                </div>
              </div>
              <button
                onClick={resetState}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden p-6 bg-muted/10">
              {!extractedText ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`h-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-all duration-200 ${
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
                      <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <Upload className="w-10 h-10 text-muted-foreground" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold">
                          Sube tu archivo PDF
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Arrastra y suelta tu boletín oficial aquí, o haz clic
                          para seleccionar desde tu ordenador.
                        </p>
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-8 py-2.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/25 font-medium"
                      >
                        Seleccionar Archivo
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col gap-4">
                  {/* Toolbar */}
                  <div className="flex items-center justify-between bg-card p-3 rounded-lg border shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md text-sm font-medium">
                        <FileText className="w-4 h-4 text-primary" />
                        {fileName}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Texto extraído correctamente
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setExtractedText("");
                        setFileName(null);
                      }}
                      className="text-xs text-destructive hover:underline font-medium"
                    >
                      Cancelar / Subir otro
                    </button>
                  </div>

                  {/* Text Preview */}
                  <div className="flex-1 bg-card rounded-lg border shadow-sm overflow-hidden flex flex-col">
                    <div className="p-3 border-b bg-muted/30 flex justify-between items-center">
                      <h3 className="text-sm font-medium flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        Contenido Extraído
                      </h3>
                    </div>
                    <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                      {extractedText}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {error && (
              <div className="p-4 bg-destructive/10 border-t border-destructive/20 text-destructive flex items-center gap-2 text-sm animate-in slide-in-from-bottom-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

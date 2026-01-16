"use client";

import React, { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { Upload, X, FileText, Loader2, AlertCircle } from "lucide-react";

export function UploadBulletinButton() {
  const { isEditing, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [parsedData, setParsedData] = useState<{
    metadata: {
      numero: string;
      fecha: string;
      año: string;
      paginas: string;
      recaudacion_diaria: string;
    };
    entries: Array<{
      id: string;
      tipo: string;
      seccion: string;
      referencia: string;
      texto: string;
    }>;
  } | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [activeSection, setActiveSection] = useState<string>(
    "Sección Administrativa"
  );
  const [viewMode, setViewMode] = useState<"structured" | "json">("structured");
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

  const parseBulletinText = (text: string) => {
    // Improved bulletin number detection
    const numeroMatch = text.match(
      /Bolet[ií]n\s+Oficial\s+(?:N|Número)[ºo\.\/\s]*\s*([\d\.]+)/i
    );
    // Extract recaudacion_diaria (Value before TOTAL, usually after a range like "03 al 25")
    const recaudacionMatch = text.match(
      /\d{1,2}\s+al\s+\d{1,2}\s+_{3,}\s+\$\s*([\d\.]+)/i
    );

    const metadata = {
      numero: numeroMatch?.[1] || "",
      fecha:
        text.match(
          /(?:Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo)\s+(\d{1,2})\s+de\s+(?:Enero|Febrero|Marzo|Abril|Mayo|Junio|Julio|Agosto|Septiembre|Octubre|Noviembre|Diciembre)\s+de\s+(\d{4})/i
        )?.[0] || "",
      año: text.match(/Año\s+([IVXLCDM]+)/i)?.[1] || "",
      paginas: text.match(/Edición de (\d+) Páginas/i)?.[1] || "",
      recaudacion_diaria: recaudacionMatch?.[1] || "",
    };

    const entries: Array<{
      id: string;
      tipo: string;
      seccion: string;
      referencia: string;
      texto: string;
    }> = [];

    // Define sections and their regex (handling spaces between letters)
    const sectionDefinitions = [
      {
        id: "Sección Administrativa",
        regex:
          /S\s*E\s*C\s*C\s*I\s*[ÓO]\s*N\s*A\s*D\s*M\s*I\s*N\s*I\s*S\s*T\s*R\s*A\s*T\s*I\s*V\s*A/i,
      },
      {
        id: "Avisos Varios",
        regex:
          /S\s*E\s*C\s*C\s*I\s*O\s*N\s*A\s*V\s*I\s*S\s*O\s*S\s*V\s*A\s*R\s*I\s*O\s*S/i,
      },
      {
        id: "Notificaciones Catastrales",
        regex:
          /N\s*O\s*T\s*I\s*F\s*I\s*C\s*A\s*C\s*I\s*O\s*N\s*E\s*S\s*C\s*A\s*T\s*A\s*S\s*T\s*R\s*A\s*L\s*E\s*S/i,
      },
      {
        id: "Avisos de Hoy",
        regex:
          /S\s*E\s*C\s*C\s*I\s*O\s*N\s*A\s*V\s*I\s*S\s*O\s*S\s*D\s*E\s*H\s*O\s*Y/i,
      },
    ];

    // Find all section header positions with robust regex
    const sectionPositions: Array<{ id: string; index: number }> = [];
    sectionDefinitions.forEach((def) => {
      const matches = text.matchAll(new RegExp(def.regex, "gi"));
      for (const match of matches) {
        if (match.index !== undefined) {
          sectionPositions.push({ id: def.id, index: match.index });
        }
      }
    });
    sectionPositions.sort((a, b) => a.index - b.index);

    // If no sections found, treat everything as Administrative
    if (sectionPositions.length === 0) {
      sectionPositions.push({ id: "Sección Administrativa", index: 0 });
    }

    // Split text into section blocks
    for (let i = 0; i < sectionPositions.length; i++) {
      const currentSection = sectionPositions[i];
      const nextSectionIndex = sectionPositions[i + 1]?.index || text.length;
      const sectionText = text.substring(
        currentSection.index,
        nextSectionIndex
      );

      // Define entry starters based on section type
      let entryRegex: RegExp;
      if (currentSection.id === "Sección Administrativa") {
        entryRegex = /(?=DECRETO-\d{4}-\d+|RESOLUCION RESOL-\d{4}-\d+)/gi;
      } else {
        // More flexible detection for other sections
        entryRegex =
          /(?=EDICTO|LICITACI[ÓO]N|ASAMBLEA|CONVOCATORIA|AVISO|NOTIFICACI[ÓO]N|REMATES?|CONCURSOS?)/gi;
      }

      const entryBlocks = sectionText.split(entryRegex);

      entryBlocks.forEach((block, index) => {
        const trimmedBlock = block.trim();
        if (trimmedBlock.length < 100) return; // Skip short fragments

        // Skip the first block if it doesn't start with a known keyword
        // (This is usually the text between the section header and the first real entry)
        if (index === 0) {
          const startsWithKeyword =
            /^(DECRETO|RESOLUCION|EDICTO|LICITACI|ASAMBLEA|CONVOCATORIA|AVISO|NOTIFICACI|REMATES|CONCURSOS)/i.test(
              trimmedBlock
            );
          if (!startsWithKeyword) return;
        }

        const decretoMatch = block.match(/DECRETO-(\d{4}-\d+-[A-Z0-9-]+)/i);
        const resolucionMatch = block.match(
          /RESOLUCION RESOL-(\d{4}-\d+-[A-Z0-9-]+)/i
        );

        // For non-admin, try to find a title/ID in the first line
        let id = decretoMatch?.[1] || resolucionMatch?.[1];
        let tipo = decretoMatch
          ? "Decreto"
          : resolucionMatch
          ? "Resolución"
          : "Aviso";

        if (!id) {
          // Try to find something that looks like an ID (e.g., "Nº 123/2024" or "EXPTE. ...")
          const idMatch = block.match(/(?:N[ºo\.]|EXPTE\.?)\s*([\w\/\.-]+)/i);
          id =
            idMatch?.[1] ||
            "AVISO-" + Math.random().toString(36).substr(2, 5).toUpperCase();

          if (block.match(/^EDICTO/i)) tipo = "Edicto";
          else if (block.match(/LICITACI[ÓO]N/i)) tipo = "Licitación";
          else if (block.match(/ASAMBLEA|CONVOCATORIA/i)) tipo = "Asamblea";
        }

        // Improved reference detection
        let referencia = block
          .match(/Referencia\s*:\s*([\s\S]*?)(?=VISTO:|CONSIDERANDO:|$)/i)?.[1]
          ?.trim();

        if (!referencia || referencia === "") {
          // Fallback: take the first 2-3 lines as reference
          const lines = block.trim().split("\n");
          referencia = lines.slice(0, 3).join(" ").trim();

          // Clean up common headers and noise from reference
          referencia = referencia
            .replace(/S\s*E\s*C\s*C\s*I\s*[ÓO]\s*N\s*[\w\s]+/gi, "")
            .replace(/Bolet[ií]n\s+Oficial\s+N\s*[\d\.]+/gi, "")
            .replace(/P[áa]gina\s+\d+/gi, "")
            .replace(/--- Página \d+ ---/gi, "")
            .replace(
              new RegExp(id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
              ""
            )
            .replace(/\s+/g, " ")
            .trim();

          if (referencia.length > 300) {
            referencia = referencia.substring(0, 250) + "...";
          }
        }

        entries.push({
          id,
          tipo,
          seccion: currentSection.id,
          referencia: referencia || "Sin referencia",
          texto: block.substring(0, 1500) + "...",
        });
      });
    }

    return { metadata, entries };
  };

  const processFile = async (file: File) => {
    setIsExtracting(true);
    setError(null);
    setFileName(file.name);
    setParsedData(null);
    setExtractedText("");

    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => (item as { str: string }).str)
          .join(" ");
        fullText += `--- Página ${i} ---\n${pageText}\n\n`;
      }

      setExtractedText(fullText);
      const parsed = parseBulletinText(fullText);
      setParsedData(parsed);
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
    setParsedData(null);
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
          <div className="bg-card border rounded-xl shadow-2xl w-full max-w-[95vw] max-h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
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

            <div className="flex-1 overflow-hidden p-6">
              {!fileName ? (
                <div className="h-full flex items-center justify-center">
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-12 w-full max-w-xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${
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
                </div>
              ) : (
                <div className="flex-1 flex flex-col gap-6 min-h-0">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border shrink-0">
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
                        setParsedData(null);
                        setExtractedText("");
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      Cambiar archivo
                    </button>
                  </div>

                  {isExtracting && (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3">
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                      <p className="text-sm text-muted-foreground">
                        Procesando y analizando PDF...
                      </p>
                    </div>
                  )}

                  {error && (
                    <div className="flex items-start gap-3 p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
                      <AlertCircle className="h-5 w-5 shrink-0" />
                      <p className="text-sm">{error}</p>
                    </div>
                  )}

                  {parsedData && (
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                      {/* Left Column: Raw Text */}
                      <div className="flex flex-col min-h-0 border rounded-xl overflow-hidden bg-muted/20">
                        <div className="p-3 border-b bg-muted/40 flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Texto Extraído del PDF
                          </h4>
                          <span className="text-[10px] text-muted-foreground">
                            {extractedText.length.toLocaleString()} caracteres
                          </span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] leading-relaxed whitespace-pre-wrap select-text max-h-[65vh]">
                          {extractedText}
                        </div>
                      </div>

                      {/* Right Column: Structured Data / JSON */}
                      <div className="flex flex-col min-h-0 border rounded-xl overflow-hidden">
                        <div className="p-3 border-b bg-muted/40 flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            {viewMode === "structured"
                              ? "Vista Estructurada"
                              : "Vista JSON"}
                          </h4>
                          <div className="flex bg-muted rounded-lg p-0.5">
                            <button
                              onClick={() => setViewMode("structured")}
                              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                                viewMode === "structured"
                                  ? "bg-background shadow-sm text-primary"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              DATOS
                            </button>
                            <button
                              onClick={() => setViewMode("json")}
                              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                                viewMode === "json"
                                  ? "bg-background shadow-sm text-primary"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              JSON
                            </button>
                          </div>
                        </div>

                        <div className="flex-1 flex flex-col min-h-0 p-6">
                          {viewMode === "structured" ? (
                            <div className="flex-1 flex flex-col gap-8 min-h-0">
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 shrink-0">
                                <div className="p-3 bg-muted/30 rounded-lg border max-h-24 overflow-y-auto">
                                  <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">
                                    Número
                                  </p>
                                  <p className="font-mono text-sm font-bold">
                                    {parsedData.metadata.numero ||
                                      "No detectado"}
                                  </p>
                                </div>
                                <div className="p-3 bg-muted/30 rounded-lg border max-h-24 overflow-y-auto">
                                  <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">
                                    Fecha
                                  </p>
                                  <p className="text-sm">
                                    {parsedData.metadata.fecha ||
                                      "No detectada"}
                                  </p>
                                </div>
                                <div className="p-3 bg-muted/30 rounded-lg border max-h-24 overflow-y-auto">
                                  <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">
                                    Año Edición
                                  </p>
                                  <p className="font-mono text-sm">
                                    {parsedData.metadata.año || "No detectado"}
                                  </p>
                                </div>
                                <div className="p-3 bg-muted/30 rounded-lg border max-h-24 overflow-y-auto">
                                  <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">
                                    Páginas
                                  </p>
                                  <p className="text-sm">
                                    {parsedData.metadata.paginas ||
                                      "No detectado"}
                                  </p>
                                </div>
                                <div className="p-3 bg-muted/30 rounded-lg border max-h-24 overflow-y-auto">
                                  <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">
                                    Recaudación
                                  </p>
                                  <p className="font-mono text-sm font-bold text-green-600">
                                    {parsedData.metadata.recaudacion_diaria
                                      ? `$${parsedData.metadata.recaudacion_diaria}`
                                      : "No detectada"}
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-4 flex-1 flex flex-col min-h-0">
                                <div className="flex flex-col gap-4 shrink-0">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                      Entradas Detectadas (
                                      {parsedData.entries.length})
                                    </h4>
                                  </div>

                                  {/* Section Tabs */}
                                  <div className="flex flex-wrap gap-1 p-1 bg-muted/50 rounded-lg border">
                                    {[
                                      "Sección Administrativa",
                                      "Avisos Varios",
                                      "Notificaciones Catastrales",
                                      "Avisos de Hoy",
                                    ].map((s) => {
                                      const count = parsedData.entries.filter(
                                        (e) => e.seccion === s
                                      ).length;
                                      return (
                                        <button
                                          key={s}
                                          onClick={() => setActiveSection(s)}
                                          className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all flex items-center gap-2 ${
                                            activeSection === s
                                              ? "bg-background shadow-sm text-primary border"
                                              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                                          }`}
                                        >
                                          {s}
                                          <span
                                            className={`px-1.5 py-0.5 rounded-full text-[9px] ${
                                              activeSection === s
                                                ? "bg-primary/10 text-primary"
                                                : "bg-muted-foreground/10 text-muted-foreground"
                                            }`}
                                          >
                                            {count}
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                <div className="flex-1 overflow-y-auto border rounded-lg divide-y bg-card min-h-0 max-h-[55vh]">
                                  {parsedData.entries.filter(
                                    (e) => e.seccion === activeSection
                                  ).length > 0 ? (
                                    parsedData.entries
                                      .filter(
                                        (e) => e.seccion === activeSection
                                      )
                                      .map((entry, idx) => (
                                        <div
                                          key={idx}
                                          className="p-4 hover:bg-muted/30 transition-colors space-y-2"
                                        >
                                          <div className="flex items-center justify-between">
                                            <span
                                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                entry.tipo === "Decreto"
                                                  ? "bg-blue-100 text-blue-700"
                                                  : entry.tipo === "Resolución"
                                                  ? "bg-purple-100 text-purple-700"
                                                  : "bg-orange-100 text-orange-700"
                                              }`}
                                            >
                                              {entry.tipo}
                                            </span>
                                            <span className="font-mono text-[10px] text-muted-foreground">
                                              {entry.id}
                                            </span>
                                          </div>
                                          <p className="text-xs font-medium leading-relaxed">
                                            {entry.referencia}
                                          </p>
                                        </div>
                                      ))
                                  ) : (
                                    <div className="p-12 text-center text-muted-foreground italic text-sm">
                                      No se detectaron entradas en esta sección.
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex-1 min-h-0">
                              <pre className="bg-muted/30 p-4 rounded-lg border font-mono text-[11px] h-full overflow-auto">
                                {JSON.stringify(parsedData, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-muted/30 flex justify-end gap-3 shrink-0">
              <button
                onClick={resetState}
                className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                disabled={!parsedData || isExtracting}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-sm text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar y Cargar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

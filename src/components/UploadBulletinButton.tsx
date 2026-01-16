"use client";

import React, { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  FileText,
  Upload,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";

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
      identificador_acto: string;
      tipo: string;
      seccion: string;
      referencia: string;
      texto_completo: string;
      paginas: number[];
      es_homologacion: boolean;
      resolucion_homologada?: string;
      lugar_fecha?: string;
    }>;
  } | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [activeSection, setActiveSection] = useState<string>(
    "Sección Administrativa"
  );
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"structured" | "json">("structured");
  const [rawTextPage, setRawTextPage] = useState(1);
  const [entriesPage, setEntriesPage] = useState(1);
  const ENTRIES_PER_PAGE = 100;
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
      identificador_acto: string;
      tipo: string;
      seccion: string;
      referencia: string;
      texto_completo: string;
      paginas: number[];
      es_homologacion: boolean;
      resolucion_homologada?: string;
      lugar_fecha?: string;
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

    // Pre-calculate page marker positions
    const pageMarkers: Array<{ page: number; index: number }> = [];
    const pageMatches = text.matchAll(/--- P[áa]gina (\d+) ---/gi);
    for (const m of pageMatches) {
      pageMarkers.push({ page: parseInt(m[1]), index: m.index! });
    }

    // Find all section header positions
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

    // Split by sections first to avoid cross-contamination
    for (let i = 0; i < sectionPositions.length; i++) {
      const currentSection = sectionPositions[i];
      const nextSection = sectionPositions[i + 1];
      const sectionEnd = nextSection ? nextSection.index : text.length;
      const sectionText = text.substring(currentSection.index, sectionEnd);

      // Find all entry starters within this section using matchAll to get indices
      // Use compound starters first to prevent incorrect splitting
      // STRICT: Case-sensitive and only uppercase keywords
      const entryRegex =
        /(DECRETO|RESOLUCI[ÓO]N|EDICTO\s+NOTIFICACI[ÓO]N|EDICTO|LICITACI[ÓO]N|ASAMBLEA|CONVOCATORIA|AVISO|NOTIFICACI[ÓO]N|REMATES|CONCURSOS)/g;
      const allMatches = Array.from(sectionText.matchAll(entryRegex));

      // Filter matches that are likely references within the text
      const entryMatches = allMatches.filter((match) => {
        if (match.index === 0) return true;

        const nextChar = sectionText[match.index! + match[0].length];
        const precedingText = sectionText
          .substring(Math.max(0, match.index! - 40), match.index!)
          .toLowerCase();

        // If followed by lowercase letters, it's likely not a header (e.g., "EDICTOs")
        const isWholeWord = !nextChar || !/[a-z]/.test(nextChar);

        // If preceded by these words, it's a reference, not a new entry
        // Expanded to include "este", "esta", "dicho", "presente", "el", "la"
        const isReference =
          /\b(conforme|seg[uú]n|en|de|citada|mencionada|referida|visto|por|este|esta|dicho|presente|el|la)\s+(?:la\s+)?$/i.test(
            precedingText.trim() + " "
          );

        return isWholeWord && !isReference;
      });

      for (let j = 0; j < entryMatches.length; j++) {
        const match = entryMatches[j];
        const nextMatch = entryMatches[j + 1];

        const blockStart = currentSection.index + match.index!;
        const blockEnd = nextMatch
          ? currentSection.index + nextMatch.index!
          : sectionEnd;

        const block = text.substring(blockStart, blockEnd);
        if (block.trim().length < 100) continue;

        let id = "";
        let tipo = "Aviso";

        if (block.match(/^DECRETO/i)) {
          tipo = "Decreto";
          // Capture full GDE format: DECRETO-2025-2716-E-GDESDE-GSDE
          const idMatch = block.match(
            /DECRETO-?\s*(\d{4}-\d+(?:-[A-Z0-9]+(?:-[A-Z0-9#\s]+)*)?)/i
          );
          id = idMatch ? `DECRETO-${idMatch[1].trim()}` : "DECRETO-S/N";
        } else if (block.match(/^RESOLUCI[ÓO]N/i)) {
          tipo = "Resolución";
          // Capture full GDE format for resolutions
          const idMatch = block.match(
            /RESOLUCI[ÓO]N-?\s*(\d{4}-\d+(?:-[A-Z0-9]+(?:-[A-Z0-9#\s]+)*)?)/i
          );
          id = idMatch ? `RESOL-${idMatch[1].trim()}` : "RESOL-S/N";
        } else {
          // Improved ID extraction: avoid matching "NO" in "NOTIFICACION"
          // Look for N, Nº, No, or EXPTE followed by numbers/slashes
          const idMatch = block.match(/(?:N[ºo\.]|EXPTE\.?)\s*([\w\/\.-]+)/i);

          // If the match is just "NO" or part of "NOTIFICACION", it's likely a false positive
          const potentialId = idMatch?.[1];
          if (potentialId && !/^(?:NO|NOTIFICACION)$/i.test(potentialId)) {
            id = potentialId;
          } else {
            id =
              "AVISO-" + Math.random().toString(36).substr(2, 5).toUpperCase();
          }

          if (block.match(/^EDICTO/i)) tipo = "Edicto";
          else if (block.match(/^LICITACI[ÓO]N/i)) tipo = "Licitación";
          else if (block.match(/^ASAMBLEA|^CONVOCATORIA/i)) tipo = "Asamblea";
          else if (block.match(/^NOTIFICACI[ÓO]N/i)) tipo = "Notificación";
          else if (block.match(/^REMATES?/i)) tipo = "Remate";
          else if (block.match(/^CONCURSOS?/i)) tipo = "Concurso";
        }

        // Clean ID from city names and trailing noise
        id = id.split(/SANTIAGO DEL ESTERO/i)[0].trim();

        // Improved reference detection
        let referencia = "";
        const refMatch = block.match(
          /Refere\s*n\s*ci\s*a:\s*([^]*?)(?=VISTO:|CONSIDERANDO:|EL SEÑOR|ART[IÍ]CULO|POR ELLO|RESUELVE|DECRETA|$)/i
        );
        if (refMatch) {
          referencia = refMatch[1].trim();
        } else {
          // Fallback: first 2 lines, but stop at keywords
          const firstPart = block.split(
            /(?=VISTO:|CONSIDERANDO:|EL SEÑOR|ART[IÍ]CULO|POR ELLO|RESUELVE|DECRETA)/i
          )[0];
          const lines = firstPart
            .split("\n")
            .filter((l) => l.trim().length > 0);
          referencia = lines.slice(0, 2).join(" ").trim();
        }

        // Helper to fix spaced-out letters (PDF artifact: "G D E S D E" -> "GDESDE")
        const fixSpacedLetters = (str: string) => {
          // Join single characters (A-Z, 0-9, #, -) separated by single spaces
          return str.replace(/([A-Z0-9#-])\s(?=[A-Z0-9#-](?:\s|$))/gi, "$1");
        };

        // Clean up common headers and noise from reference
        referencia = fixSpacedLetters(referencia)
          .replace(/S\s*E\s*C\s*C\s*I\s*[ÓO]\s*N\s*[\w\s]+/gi, "")
          .replace(/Bolet[ií]n\s+Oficial\s+N\s*[\d\.]+/gi, "")
          .replace(/P[áa]gina\s+\d+/gi, "")
          .replace(/--- P[áa]gina \d+ ---/gi, "")
          .replace(
            /,?\s*(?:LUNES|MARTES|MI[EÉ]RCOLES|JUEVES|VIERNES|S[AÁ]BADO|DOMINGO)\s+\d+\s+DE\s+[A-Z]+\s+DE\s+\d{4}/gi,
            ""
          )
          .replace(/Referenci\s*a\s*:\s*/gi, "")
          .replace(/^[\s,.-]+/, "")
          .trim();

        // Create a de-spaced version of the block for more accurate matching
        // (PDF artifacts: "E X - 2 0 2 5" -> "EX-2025", "H o m o l o g a" -> "Homologa")
        const deSpacedBlock = fixSpacedLetters(block);

        // Ensure expediente number is in reference if present (e.g., EX-2025-...)
        // Use the de-spaced block for much cleaner matching
        const expMatch = deSpacedBlock.match(
          /(EX-\d{4}-\d+-(?:[A-Z0-9-]+)?(?:[A-Z0-9#]+)?)/i
        );

        if (expMatch) {
          referencia = expMatch[1].trim();
        }

        const dateMatch = deSpacedBlock.match(
          /(?:SANTIAGO DEL ESTERO,?\s*)?(?:LUNES|MARTES|MI[EÉ]RCOLES|JUEVES|VIERNES|S[AÁ]BADO|DOMINGO)\s+\d+\s+DE\s+[A-Z]+\s+DE\s+\d{4}/i
        );
        const lugarFecha = dateMatch ? dateMatch[0].trim() : undefined;

        // Detect homologation and extract target resolution
        // Search the entire de-spaced block for homologation keywords
        const homologaMatch = deSpacedBlock.match(
          /Homologa(?:cion|[ií]n)?\s+(?:RESOL-?)?(\d{4}-\d+(?:-[A-Z0-9]+(?:-[A-Z0-9#\s]+)*)?)/i
        );
        const esHomologacion =
          !!homologaMatch || /Homologa(?:cion|[ií]n)?/i.test(deSpacedBlock);
        const resolucionHomologada = homologaMatch
          ? fixSpacedLetters(homologaMatch[1].trim())
          : undefined;

        // Final reference cleaning:
        // 1. Remove city names
        // 2. Remove homologation text if present
        // 3. Remove the ID itself if it appears in the reference
        // 4. Remove duplicated expedientes if they somehow got through
        referencia = referencia
          .replace(/SANTIAGO DEL ESTERO/gi, "")
          .replace(/Homologa(?:cion|[ií]n)?.*$/gi, "")
          .replace(
            new RegExp(id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
            ""
          )
          .replace(/\s+/g, " ")
          .replace(/-\s+-/g, "--")
          .replace(/^[\s,.-]+/, "")
          .trim();

        if (referencia.length > 300) {
          referencia = referencia.substring(0, 250) + "...";
        }

        // Determine pages for this block using absolute indices
        const blockPages = pageMarkers
          .filter((pm) => pm.index >= blockStart && pm.index < blockEnd)
          .map((pm) => pm.page);

        // Also include the page the block starts on
        const startPageMarker = pageMarkers
          .filter((pm) => pm.index <= blockStart)
          .pop();
        const startPage = startPageMarker ? startPageMarker.page : 1;

        if (!blockPages.includes(startPage)) {
          blockPages.unshift(startPage);
        }

        // Clean texto_completo: remove headers, footers, and page markers
        const cleanedTexto = block
          .trim()
          .replace(/S\s*E\s*C\s*C\s*I\s*[ÓO]\s*N\s*[\w\s]+/gi, "")
          .replace(/Bolet[ií]n\s+Oficial\s+N\s*[\d\.]+/gi, "")
          .replace(/P[áa]gina\s+\d+/gi, "")
          .replace(/--- P[áa]gina \d+ ---/gi, "")
          .replace(
            /(?:Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo)\s+\d{1,2}\s+de\s+\w+\s+de\s+\d{4}/gi,
            ""
          )
          .replace(/\s+/g, " ")
          .trim();

        entries.push({
          identificador_acto: id,
          tipo,
          seccion: currentSection.id,
          referencia: referencia || "Sin referencia",
          texto_completo: cleanedTexto,
          paginas: blockPages,
          es_homologacion: esHomologacion,
          resolucion_homologada: resolucionHomologada,
          lugar_fecha: lugarFecha,
        });
      }
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
                <div className="flex-1 flex flex-col gap-6 min-h-0 ">
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
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground">
                              Pág. {rawTextPage} de{" "}
                              {extractedText.split("--- Página ").length - 1}
                            </span>
                            <div className="flex gap-1">
                              <button
                                disabled={rawTextPage === 1}
                                onClick={() =>
                                  setRawTextPage((p) => Math.max(1, p - 1))
                                }
                                className="h-6 w-6 flex items-center justify-center border rounded hover:bg-muted disabled:opacity-50 transition-colors"
                              >
                                <ChevronLeft className="h-3 w-3" />
                              </button>
                              <button
                                disabled={
                                  rawTextPage ===
                                  extractedText.split("--- Página ").length - 1
                                }
                                onClick={() =>
                                  setRawTextPage((p) =>
                                    Math.min(
                                      extractedText.split("--- Página ")
                                        .length - 1,
                                      p + 1
                                    )
                                  )
                                }
                                className="h-6 w-6 flex items-center justify-center border rounded hover:bg-muted disabled:opacity-50 transition-colors"
                              >
                                <ChevronRight className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 bg-muted/30 p-4 font-mono text-[11px] leading-relaxed whitespace-pre-wrap overflow-y-auto max-h-[65vh] select-text">
                          {extractedText
                            .split(`--- Página ${rawTextPage} ---`)[1]
                            ?.split("--- Página")[0] || "Cargando página..."}
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

                                <div className="flex-1 flex flex-col min-h-0 gap-4">
                                  <div className="flex-1 overflow-y-auto border rounded-lg divide-y bg-card min-h-0 max-h-[300px]">
                                    {parsedData.entries.filter(
                                      (e) => e.seccion === activeSection
                                    ).length > 0 ? (
                                      parsedData.entries
                                        .filter(
                                          (e) => e.seccion === activeSection
                                        )
                                        .slice(
                                          (entriesPage - 1) * ENTRIES_PER_PAGE,
                                          entriesPage * ENTRIES_PER_PAGE
                                        )
                                        .map((entry, idx) => (
                                          <div
                                            key={idx}
                                            className="flex flex-col border-b last:border-0"
                                          >
                                            <button
                                              onClick={() =>
                                                setExpandedEntry(
                                                  expandedEntry ===
                                                    entry.identificador_acto
                                                    ? null
                                                    : entry.identificador_acto
                                                )
                                              }
                                              className="w-full text-left p-4 hover:bg-muted/30 transition-colors space-y-2"
                                            >
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                  <span
                                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                      entry.tipo === "Decreto"
                                                        ? "bg-blue-100 text-blue-700"
                                                        : entry.tipo ===
                                                          "Resolución"
                                                        ? "bg-purple-100 text-purple-700"
                                                        : "bg-orange-100 text-orange-700"
                                                    }`}
                                                  >
                                                    {entry.tipo}
                                                  </span>
                                                  <span className="font-mono text-[10px] text-muted-foreground">
                                                    {entry.identificador_acto}
                                                  </span>
                                                  {entry.es_homologacion && (
                                                    <div className="flex flex-col gap-0.5">
                                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 w-fit">
                                                        Homologación
                                                      </span>
                                                      {entry.resolucion_homologada && (
                                                        <span className="text-[9px] text-green-600 font-mono font-bold">
                                                          Res:{" "}
                                                          {
                                                            entry.resolucion_homologada
                                                          }
                                                        </span>
                                                      )}
                                                    </div>
                                                  )}
                                                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                    Pág.{" "}
                                                    {entry.paginas.join(", ")}
                                                  </span>
                                                  {entry.lugar_fecha && (
                                                    <span className="text-[10px] text-muted-foreground italic">
                                                      {entry.lugar_fecha}
                                                    </span>
                                                  )}
                                                </div>
                                                <div className="text-muted-foreground">
                                                  {expandedEntry ===
                                                  entry.identificador_acto ? (
                                                    <X className="h-3 w-3" />
                                                  ) : (
                                                    <FileText className="h-3 w-3" />
                                                  )}
                                                </div>
                                              </div>
                                              <p className="text-xs font-medium leading-relaxed">
                                                {entry.referencia}
                                              </p>
                                            </button>

                                            {expandedEntry ===
                                              entry.identificador_acto && (
                                              <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2 duration-200">
                                                <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                                                  <div className="grid grid-cols-2 gap-4 text-[11px]">
                                                    <div>
                                                      <span className="text-muted-foreground block mb-1">
                                                        Sección
                                                      </span>
                                                      <span className="font-medium">
                                                        {entry.seccion}
                                                      </span>
                                                    </div>
                                                    <div>
                                                      <span className="text-muted-foreground block mb-1">
                                                        Páginas
                                                      </span>
                                                      <span className="font-medium">
                                                        {entry.paginas.join(
                                                          ", "
                                                        )}
                                                      </span>
                                                    </div>
                                                    {entry.lugar_fecha && (
                                                      <div className="col-span-2">
                                                        <span className="text-muted-foreground block mb-1">
                                                          Lugar y Fecha
                                                        </span>
                                                        <span className="font-medium italic">
                                                          {entry.lugar_fecha}
                                                        </span>
                                                      </div>
                                                    )}
                                                  </div>
                                                  <div className="space-y-2">
                                                    <h5 className="text-[10px] text-muted-foreground uppercase font-bold">
                                                      Texto Completo
                                                    </h5>
                                                    <div className="p-3 bg-muted/30 rounded-lg border text-[11px] font-mono whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto select-text">
                                                      {entry.texto_completo}
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        ))
                                    ) : (
                                      <div className="p-12 text-center text-muted-foreground italic text-sm">
                                        No se detectaron entradas en esta
                                        sección.
                                      </div>
                                    )}
                                  </div>

                                  {/* Entries Pagination */}
                                  {parsedData.entries.filter(
                                    (e) => e.seccion === activeSection
                                  ).length > ENTRIES_PER_PAGE && (
                                    <div className="flex items-center justify-between px-2">
                                      <span className="text-[10px] text-muted-foreground">
                                        Mostrando{" "}
                                        {Math.min(
                                          parsedData.entries.filter(
                                            (e) => e.seccion === activeSection
                                          ).length,
                                          entriesPage * ENTRIES_PER_PAGE
                                        )}{" "}
                                        de{" "}
                                        {
                                          parsedData.entries.filter(
                                            (e) => e.seccion === activeSection
                                          ).length
                                        }
                                      </span>
                                      <div className="flex gap-1">
                                        <button
                                          disabled={entriesPage === 1}
                                          onClick={() =>
                                            setEntriesPage((p) =>
                                              Math.max(1, p - 1)
                                            )
                                          }
                                          className="h-7 px-3 text-[10px] border rounded hover:bg-muted disabled:opacity-50 transition-colors"
                                        >
                                          Anterior
                                        </button>
                                        <button
                                          disabled={
                                            entriesPage * ENTRIES_PER_PAGE >=
                                            parsedData.entries.filter(
                                              (e) => e.seccion === activeSection
                                            ).length
                                          }
                                          onClick={() =>
                                            setEntriesPage((p) => p + 1)
                                          }
                                          className="h-7 px-3 text-[10px] border rounded hover:bg-muted disabled:opacity-50 transition-colors"
                                        >
                                          Siguiente
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex-1 min-h-0">
                              <pre className="bg-muted/30 p-4 rounded-lg border font-mono text-[11px] h-full max-h-[400px] overflow-auto">
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

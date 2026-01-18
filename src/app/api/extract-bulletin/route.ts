import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // --- Regex Extraction Logic ---
    const textContext = text.substring(0, 3000); // Analyze first ~3000 chars

    // Helper to parse Spanish date "Lunes 03 de Noviembre de 2025" -> "2025-11-03"
    const parseSpanishDate = (dateString: string): string => {
      const months: { [key: string]: string } = {
        enero: "01",
        febrero: "02",
        marzo: "03",
        abril: "04",
        mayo: "05",
        junio: "06",
        julio: "07",
        agosto: "08",
        septiembre: "09",
        octubre: "10",
        noviembre: "11",
        diciembre: "12",
      };
      const parts = dateString
        .toLowerCase()
        .match(/(\d{1,2})\s+de\s+([a-z]+)\s+de\s+(\d{4})/);
      if (parts) {
        const day = parts[1].padStart(2, "0");
        const month = months[parts[2]] || "01";
        const year = parts[3];
        return `${year}-${month}-${day}`;
      }
      return new Date().toISOString().split("T")[0]; // Fallback
    };

    // 1. Extract Number
    const numeroMatch =
      textContext.match(/N\s*\/\s*([\d\.]+)/) ||
      textContext.match(/Número\s*([\d\.]+)/);
    const numero = numeroMatch
      ? parseInt(numeroMatch[1].replace(/\./g, ""), 10)
      : 0;

    // 2. Extract Date
    // Matches "Lunes 03 de Noviembre de 2025" or similar
    const fechaMatch = textContext.match(
      /[A-Z][a-z]+\s+\d{1,2}\s+de\s+[A-Z][a-z]+\s+de\s+\d{4}/,
    );
    const fecha_publicacion = fechaMatch
      ? parseSpanishDate(fechaMatch[0])
      : new Date().toISOString().split("T")[0];

    // 3. Extract Year Edition (Roman)
    const yearMatch = textContext.match(/Año\s+([IXVLCDM]+)/);
    const año_edicion = yearMatch ? yearMatch[1] : "";

    // 4. Extract Pages
    const paginasMatch = textContext.match(/Edición de\s+(\d+)\s+Páginas/i);
    const cantidad_paginas = paginasMatch ? parseInt(paginasMatch[1], 10) : 0;

    // 5. Extract Revenue
    // Matches "TOTAL ________ $ 448.700" or similar
    // We look for "TOTAL" followed by stuff, then "$" then numbers
    const recaudacionMatch = textContext.match(
      /TOTAL.*?\$?\s*([\d\.]+(?:,\d{2})?)/,
    );
    let recaudacion_diaria = 0;
    if (recaudacionMatch) {
      // Remove dots used for thousands, keep comma if decimal (Spanish format usually uses dot for thousands)
      // Assuming input "448.700" -> 448700
      const cleanAmount = recaudacionMatch[1]
        .replace(/\./g, "")
        .replace(",", ".");
      recaudacion_diaria = parseFloat(cleanAmount);
    }

    // --- Section Extraction Logic ---
    let secciones: any[] = [];

    // 1. Fetch valid sections from CMS
    // Note: In production this should be cached or passed as context
    let validSections: string[] = [];
    try {
      const sectionsRes = await fetch(
        "http://localhost:3000/api/secciones?limit=100",
        {
          cache: "no-store",
        },
      );
      if (sectionsRes.ok) {
        const data = await sectionsRes.json();
        validSections = data.docs.map((s: any) => s.nombre);
      }
    } catch (e) {
      console.warn("Assuming default sections due to fetch error");
      // Fallback defaults
      validSections = [
        "Sección Administrativa",
        "Sección Judicial",
        "Ministerio de Salud",
        "Ministerio de Obras, Servicios Públicos y Agua",
        "Ministerio de Gobierno, Seguridad y Culto",
        "Sección Avisos Varios",
        "Notificaciones Catastrales",
      ];
    }

    if (validSections.length > 0) {
      // Deduplicate valid sections
      validSections = Array.from(new Set(validSections));

      // 2. Normalize and find section positions
      // Helper to create flexible regex
      const createFlexibleRegex = (title: string) => {
        // Remove punctuation for cleaner matching
        const cleanTitle = title.replace(/[.,;:\-]/g, "");
        // CONVERT TO UPPERCASE to strictly match headers
        const upperTitle = cleanTitle.toUpperCase();

        // Map for accent insensitivity (only uppercase needed)
        const charMap: { [key: string]: string } = {
          A: "[AÁÀÄÂ]",
          E: "[EÉÈËÊ]",
          I: "[IÍÌÏÎ]",
          O: "[OÓÒÖÔ]",
          U: "[UÚÙÜÛ]",
          N: "[NÑ]",
          C: "[CÇ]",
        };

        const pattern = upperTitle
          .split("")
          .map((char) => {
            if (/\s/.test(char)) return "\\s+";
            const matchedChar =
              charMap[char] || (char.match(/[A-Z0-9]/) ? char : `\\${char}`);
            // Allow spaces/punctuation between characters
            return `${matchedChar}[\\s.,;:\\-_]*`;
          })
          .join("");

        // "g" flag only. NO "i" flag to ensure we only match Uppercase Headers.
        return new RegExp(pattern, "g");
      };

      const foundSections: {
        name: string;
        index: number;
        normalizedName: string;
        isWide: boolean;
      }[] = [];

      validSections.forEach((sectionName) => {
        const regex = createFlexibleRegex(sectionName);
        let match;
        regex.lastIndex = 0;

        while ((match = regex.exec(text)) !== null) {
          // Heuristic: Check if it's "Wide" (spaced out) vs "Compact"
          // "MINISTERIO" (10 chars) vs "M I N I S T E R I O" (19+ chars)
          // If match length is significantly longer than the base name length, it's likely the spaced header.
          const isWide = match[0].length > sectionName.length * 1.2;

          foundSections.push({
            name: match[0],
            index: match.index,
            normalizedName: sectionName,
            isWide,
          });
        }
      });

      // Deduplication Logic:
      // Group matches by normalizedName
      const sectionsByName: { [key: string]: typeof foundSections } = {};
      foundSections.forEach((s) => {
        if (!sectionsByName[s.normalizedName])
          sectionsByName[s.normalizedName] = [];
        sectionsByName[s.normalizedName].push(s);
      });

      const uniqueFoundSections: typeof foundSections = [];
      Object.keys(sectionsByName).forEach((name) => {
        const matches = sectionsByName[name];
        // Prioritize WIDE matches. If any wide match exists, take the FIRST wide match.
        // If no wide match, take the FIRST compact match (fallback).
        const wideMatch = matches.find((m) => m.isWide);
        if (wideMatch) {
          uniqueFoundSections.push(wideMatch);
        } else {
          // If only compact matches found, use the first one (appearing earliest in text)
          // Sort by index to be sure
          matches.sort((a, b) => a.index - b.index);
          uniqueFoundSections.push(matches[0]);
        }
      });

      // Sort final unique sections by position
      uniqueFoundSections.sort((a, b) => a.index - b.index);

      // 3. Extract content for each section
      uniqueFoundSections.forEach((section, i) => {
        const start = section.index + section.name.length;
        const end =
          i < uniqueFoundSections.length - 1
            ? uniqueFoundSections[i + 1].index
            : text.length;

        const content = text.substring(start, end).trim();

        secciones.push({
          id: crypto.randomUUID(),
          nombre: section.normalizedName,
          entradas: [],
        });
      });
    }

    const parsedData = {
      numero,
      fecha_publicacion,
      año_edicion,
      cantidad_paginas,
      recaudacion_diaria,
      staff_autoridades: [],
      secciones: secciones.length > 0 ? secciones : [],
    };

    console.log(
      "Regex Extracted Metadata & Sections:",
      parsedData.secciones.map((s) => s.nombre),
    );

    return NextResponse.json(parsedData);
  } catch (error) {
    console.error("Error in extract-bulletin:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

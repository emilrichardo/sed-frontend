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

    const parsedData = {
      numero,
      fecha_publicacion,
      año_edicion,
      cantidad_paginas,
      recaudacion_diaria,
      staff_autoridades: [], // Hard to extract reliably with simple regex, leaving empty as requested
      secciones: [], // Sections will be populated later or via AI if specifically requested for body
    };

    console.log("Regex Extracted Metadata:", parsedData);

    return NextResponse.json(parsedData);
  } catch (error) {
    console.error("Error in extract-bulletin:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

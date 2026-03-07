/**
 * Extracts readable text from a Lexical node tree.
 * Skips chart/table blocks, uploads, and horizontal rules.
 */
export function extractLexicalText(nodes: unknown[]): string {
  if (!Array.isArray(nodes)) return "";
  const parts: string[] = [];

  for (const node of nodes as Record<string, unknown>[]) {
    if (!node) continue;
    if (typeof node.text === "string") {
      if ((node.text as string).trim()) parts.push(node.text as string);
      continue;
    }
    if (["block", "upload", "horizontalrule"].includes(node.type as string)) continue;
    if (Array.isArray(node.children)) {
      const child = extractLexicalText(node.children as unknown[]).trim();
      if (!child) continue;
      switch (node.type) {
        case "heading":
        case "paragraph":
        case "quote":
          parts.push(child + ".");
          break;
        case "listitem":
          parts.push(child + ",");
          break;
        default:
          parts.push(child);
      }
    }
  }
  return parts.join(" ");
}

/**
 * Splits a long text into ~200-char chunks at sentence boundaries
 * to avoid Chrome's SpeechSynthesis cut-off bug.
 */
export function splitIntoChunks(text: string, maxLen = 200): string[] {
  const sentences = text.match(/[^.!?,;]+[.!?,;]*/g) || [text];
  const chunks: string[] = [];
  let current = "";
  for (const s of sentences) {
    if ((current + s).length > maxLen && current) {
      chunks.push(current.trim());
      current = s;
    } else {
      current += s;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

/** Returns best available Spanish voice, cycling through a list. */
export function getSpanishVoices(): SpeechSynthesisVoice[] {
  const voices = speechSynthesis.getVoices();
  const priority = ["es-AR", "es-419", "es-MX", "es-CL", "es-CO", "es-ES"];
  const result: SpeechSynthesisVoice[] = [];
  for (const lang of priority) {
    const v = voices.find((v) => v.lang === lang);
    if (v) result.push(v);
  }
  // Also add any remaining es-* voices not already in result
  for (const v of voices) {
    if (v.lang.startsWith("es") && !result.includes(v)) result.push(v);
  }
  return result;
}

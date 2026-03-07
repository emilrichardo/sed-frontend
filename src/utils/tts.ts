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
    if (["block", "upload", "horizontalrule"].includes(node.type as string))
      continue;
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

/** Returns an array of Spanish voices, prioritizing finding at least one female and one male voice for alternation. */
export function getSpanishVoices(): SpeechSynthesisVoice[] {
  const voices = speechSynthesis.getVoices();

  // First get all spanish voices
  const esVoices = voices.filter((v) => v.lang.startsWith("es"));

  // Common names to distinguish female vs male voices if available
  const femaleNames = [
    "paulina",
    "monica",
    "luciana",
    "sabina",
    "victoria",
    "elena",
    "laura",
    "google español",
  ];
  const maleNames = [
    "diego",
    "jorge",
    "carlos",
    "juan",
    "alvaro",
    "pablo",
    "raul",
  ];

  let female = esVoices.find((v) =>
    femaleNames.some((n) => v.name.toLowerCase().includes(n)),
  );
  let male = esVoices.find((v) =>
    maleNames.some((n) => v.name.toLowerCase().includes(n)),
  );

  // Fallbacks if not enough recognizable names are found
  if (!female && esVoices.length > 0) {
    // If not found, just pick the first one as female
    female = esVoices.find((v) => v !== male) || esVoices[0];
  }
  if (!male && esVoices.length > 1) {
    // Pick the next available different one as male
    male = esVoices.find((v) => v !== female) || esVoices[1];
  }

  const result: SpeechSynthesisVoice[] = [];
  if (female) result.push(female);
  if (male && male !== female) result.push(male);

  // If we couldn't find 2, just return what we have
  if (result.length < 2 && esVoices.length >= 2) {
    return [esVoices[0], esVoices[1]];
  }

  // If we found our female/male pair, try to append any other voices just in case
  const finalResult = [...result];
  for (const v of esVoices) {
    if (!finalResult.includes(v)) finalResult.push(v);
  }

  return finalResult.length > 0 ? finalResult : voices;
}

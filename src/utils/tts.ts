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

/**
 * Latin American Spanish language codes.
 */
const LATIN_AMERICAN_LOCALES = [
  "es-mx", // Mexico
  "es-ar", // Argentina
  "es-us", // United States (Spanish)
  "es-co", // Colombia
  "es-cl", // Chile
  "es-pe", // Peru
  "es-ve", // Venezuela
  "es-ec", // Ecuador
  "es-uy", // Uruguay
  "es-py", // Paraguay
  "es-bo", // Bolivia
  "es-gt", // Guatemala
  "es-sv", // El Salvador
  "es-hn", // Honduras
  "es-ni", // Nicaragua
  "es-cr", // Costa Rica
  "es-pa", // Panama
  "es-pr", // Puerto Rico
  "es-cu", // Cuba
  "es-do", // Dominican Republic
];

/**
 * Quality scores for known voice providers.
 * Higher = better quality (more natural sounding).
 */
const VOICE_QUALITY_RANK: Record<string, number> = {
  // Premium cloud voices (best quality)
  "google": 10,
  "microsoft": 9,
  "apple": 9,
  "amazon": 9,
  "azure": 9,
  // Good quality Latin American voices
  "diego": 8,
  "paulina": 8,
  "monica": 8,
  "luciana": 8,
  "jorge": 7,
  "carlos": 7,
  "laura": 7,
  "elena": 7,
  "sofia": 8,
  "valentina": 8,
  "camila": 7,
  "fernanda": 7,
  // Lower quality / robotic voices to avoid
  "microsoft sabina": 3,  // Old Windows voice, robotic
  "microsoft helena": 3,
  "microsoft laura": 3,
};

/**
 * Known robotic/low-quality voice patterns to filter out.
 */
const LOW_QUALITY_PATTERNS = [
  /microsoft.*desktop/i,
  /microsoft.*mobile/i,
  /^sapi/i,
];

/**
 * Returns true if a voice appears to be low quality.
 */
function isLowQualityVoice(voice: SpeechSynthesisVoice): boolean {
  const nameLower = voice.name.toLowerCase();
  return LOW_QUALITY_PATTERNS.some((pattern) => pattern.test(nameLower));
}

/**
 * Returns true if the voice is Latin American Spanish.
 */
function isLatinAmericanVoice(voice: SpeechSynthesisVoice): boolean {
  const langLower = voice.lang.toLowerCase();
  return LATIN_AMERICAN_LOCALES.some((locale) => langLower.startsWith(locale));
}

/**
 * Returns a quality score for a voice (higher = better).
 */
function getVoiceQuality(voice: SpeechSynthesisVoice): number {
  const nameLower = voice.name.toLowerCase();
  
  // Check for known quality rankings
  for (const [key, score] of Object.entries(VOICE_QUALITY_RANK)) {
    if (nameLower.includes(key)) return score;
  }
  
  // Default scores based on voice URI patterns
  if (voice.voiceURI.includes("Google")) return 10;
  if (voice.voiceURI.includes("Apple")) return 9;
  if (voice.voiceURI.includes("Microsoft")) return 5; // Mixed quality
  
  // Local voices usually lower quality
  return 3;
}

/**
 * Returns an array of Latin American Spanish voices sorted by quality (best first).
 * Filters out known low-quality/robotic voices and Spanish from Spain (es-ES).
 */
export function getSpanishVoices(): SpeechSynthesisVoice[] {
  const voices = speechSynthesis.getVoices();

  // Get all Latin American Spanish voices (exclude es-ES)
  const latAmVoices = voices.filter((v) => {
    // Must start with "es-" but NOT "es-es" (Spain)
    const langLower = v.lang.toLowerCase();
    return langLower.startsWith("es-") && !langLower.startsWith("es-es");
  });
  
  if (latAmVoices.length === 0) {
    // Fallback: try any Spanish voice if no Latin American found
    const esVoices = voices.filter((v) => v.lang.startsWith("es"));
    if (esVoices.length > 0) {
      return esVoices;
    }
    return voices;
  }

  // Filter out low quality voices
  const goodVoices = latAmVoices.filter((v) => !isLowQualityVoice(v));
  
  // If all voices were filtered out, use the original list
  const candidates = goodVoices.length > 0 ? goodVoices : latAmVoices;

  // Sort by quality score (descending)
  const sorted = candidates.sort((a, b) => getVoiceQuality(b) - getVoiceQuality(a));

  // Try to find one female and one male voice from top quality voices
  const femaleNames = ["paulina", "monica", "luciana", "laura", "elena", "valentina", "camila", "fernanda", "sofia", "female", "mujer"];
  const maleNames = ["diego", "jorge", "carlos", "juan", "alvaro", "pablo", "raul", "male", "hombre"];

  const topVoices = sorted.slice(0, 6); // Consider top 6 for gender selection
  
  let female = topVoices.find((v) =>
    femaleNames.some((n) => v.name.toLowerCase().includes(n)),
  );
  let male = topVoices.find((v) =>
    maleNames.some((n) => v.name.toLowerCase().includes(n)),
  );

  // Build result prioritizing quality first, then gender variety
  const result: SpeechSynthesisVoice[] = [];
  
  // Add the highest quality voice first
  if (sorted[0]) result.push(sorted[0]);
  
  // Add a voice of different gender if available
  if (female && !result.includes(female)) result.push(female);
  else if (male && !result.includes(male)) result.push(male);
  
  // Add remaining high-quality voices
  for (const v of sorted) {
    if (!result.includes(v)) result.push(v);
  }

  return result;
}

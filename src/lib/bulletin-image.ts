export const MAX_BULLETIN_IMAGE_BYTES = 10 * 1024 * 1024;
export const BULLETIN_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function getBulletinImageError(file: File): string | null {
  if (!BULLETIN_IMAGE_TYPES.includes(file.type)) return "Elegí una imagen JPG, PNG, WebP o GIF.";
  if (!file.size || file.size > MAX_BULLETIN_IMAGE_BYTES) return "La imagen debe pesar entre 1 byte y 10 MiB.";
  return null;
}

export function detectBulletinImageType(bytes: Uint8Array): string | null {
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((b, i) => bytes[i] === b)) return "image/png";
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "image/jpeg";
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  if (/^GIF8[79]a$/.test(ascii(0, 6))) return "image/gif";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  return null;
}

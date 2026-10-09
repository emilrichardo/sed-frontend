"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Save, X } from "lucide-react";
import { Boletin, getBulletinImage } from "@/lib/api";
import { BULLETIN_IMAGE_TYPES, getBulletinImageError } from "@/lib/bulletin-image";

export default function BulletinImageEditor({ bulletin }: { bulletin: Boletin }) {
  const router = useRouter();
  const fieldId = useId();
  const existing = getBulletinImage(bulletin);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [alt, setAlt] = useState(existing?.alt || "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pendingMediaId, setPendingMediaId] = useState<number | null>(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const selectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    setError("");
    setMessage("");
    if (!selected) return;
    const validation = getBulletinImageError(selected);
    if (validation) {
      setError(validation);
      setFile(null);
      setPreview(null);
      setPendingMediaId(null);
      event.target.value = "";
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setPendingMediaId(null);
  };

  const save = async (remove = false) => {
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const form = new FormData();
      form.append("boletin_id", String(bulletin.id));
      if (file) form.append("file", file);
      form.append("alt", alt.trim());
      const response = await fetch(
        remove ? `/api/bulletin-image?boletin_id=${encodeURIComponent(bulletin.id)}` : "/api/bulletin-image",
        remove ? { method: "DELETE" } : pendingMediaId
          ? { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ boletin_id: bulletin.id, media_id: pendingMediaId }) }
          : { method: "POST", body: form },
      );
      const data = await response.json();
      if (!response.ok) {
        if (data.media_id) setPendingMediaId(data.media_id);
        throw new Error(data.error || data.errors?.[0]?.message || "No se pudo guardar la imagen.");
      }
      setFile(null);
      setPreview(null);
      setPendingMediaId(null);
      setMessage(remove ? "Imagen destacada quitada." : "Imagen destacada guardada.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <details className="rounded-lg border border-border bg-card">
      <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-primary">
        <ImagePlus className="h-4 w-4" />
        {existing ? "Cambiar imagen destacada" : "Agregar imagen destacada"}
      </summary>
      <div className="space-y-4 border-t border-border p-4">
        <p id={`${fieldId}-help`} className="text-sm text-muted-foreground">JPG, PNG, WebP o GIF. Hasta 10 MiB. La imagen se muestra en la portada y el detalle del boletín.</p>
        {(preview || existing?.url) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview || existing!.url} alt={alt || "Vista previa de la imagen destacada"} className="max-h-64 w-full rounded-md border border-border object-contain" />
        )}
        <div className="space-y-2">
          <label htmlFor={`${fieldId}-file`} className="block text-sm font-medium">Imagen destacada</label>
          <input key={message} id={`${fieldId}-file`} type="file" accept={BULLETIN_IMAGE_TYPES.join(",")} disabled={busy} onChange={selectFile} aria-describedby={`${fieldId}-help`} className="block w-full min-w-0 rounded-md border border-input p-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1" />
        </div>
        <div className="space-y-2">
          <label htmlFor={`${fieldId}-alt`} className="block text-sm font-medium">Descripción de la imagen</label>
          <input id={`${fieldId}-alt`} value={alt} onChange={(event) => setAlt(event.target.value)} maxLength={1000} disabled={busy || pendingMediaId !== null} placeholder="Describí lo que aparece en la imagen" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => save()} disabled={busy || (!file && !pendingMediaId) || !alt.trim()} className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {pendingMediaId ? "Reintentar asignación" : "Guardar imagen"}
          </button>
          {existing && <button type="button" onClick={() => save(true)} disabled={busy} className="flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm disabled:opacity-50"><X className="h-4 w-4" />Quitar imagen</button>}
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
      </div>
    </details>
  );
}

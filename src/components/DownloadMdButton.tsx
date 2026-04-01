"use client";

import { useState } from "react";
import { Download, Copy, Check } from "lucide-react";

interface DownloadMdButtonProps {
  markdown: string;
  filename: string;
}

export function DownloadMdButton({ markdown, filename }: DownloadMdButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".md") ? filename : `${filename}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for browsers without clipboard API
      const ta = document.createElement("textarea");
      ta.value = markdown;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const btnBase =
    "flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-muted transition-all shrink-0";

  return (
    <>
      <button
        onClick={handleDownload}
        className={btnBase}
        title="Descargar publicación completa en formato Markdown (ideal para IA)"
      >
        <Download className="h-4 w-4" />
        Descargar .md
      </button>

      <button
        onClick={handleCopy}
        className={`${btnBase} ${copied ? "text-green-600 border-green-500/40 bg-green-500/5" : ""}`}
        title="Copiar contenido completo en Markdown para usar con modelos de IA"
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
        {copied ? "¡Copiado!" : "Copiar MD"}
      </button>
    </>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  custom_markup: string;
  data: {
    columns: { id: string; header: string }[];
    rows: Record<string, string>[];
  };
};

const STANDARD_VARS = [
  "--background", "--foreground",
  "--card", "--card-foreground",
  "--primary", "--primary-foreground",
  "--secondary", "--secondary-foreground",
  "--muted", "--muted-foreground",
  "--accent", "--accent-foreground",
  "--destructive", "--border", "--radius",
  "--font-sans", "--font-mono",
];

// Aliases for common AI-generated variable names → mapped to standard vars
const ALIAS_CSS = `
  --color-text-primary: var(--foreground);
  --color-text-secondary: var(--muted-foreground);
  --color-text-tertiary: var(--muted-foreground);
  --color-background-primary: var(--background);
  --color-background-secondary: var(--muted);
  --color-background-tertiary: var(--card);
  --color-border-primary: var(--border);
  --color-border-secondary: var(--border);
  --color-border-tertiary: var(--border);
  --color-accent: var(--primary);
  --color-surface: var(--card);
`;

const RESIZE_SCRIPT = `<script>
  (function() {
    var lastHeight = 0;
    function notifyHeight() {
      var root = document.getElementById('custom-viz-root');
      if (!root) return;
      // Calcula altura considerando el contenido real, no solo scrollHeight
      var rect = root.getBoundingClientRect();
      var computed = window.getComputedStyle(root);
      var marginTop = parseFloat(computed.marginTop) || 0;
      var marginBottom = parseFloat(computed.marginBottom) || 0;
      var h = Math.ceil(rect.height + marginTop + marginBottom);
      // Fallback a scrollHeight si el cálculo da 0 o muy pequeño
      if (h < 50) h = root.scrollHeight;
      // Mínimo razonable para evitar colapsos
      h = Math.max(h, 50);
      // Solo notifica si cambió significativamente (evita loops)
      if (Math.abs(h - lastHeight) > 2) {
        lastHeight = h;
        window.parent.postMessage({ type: 'custom-viz-height', height: h }, '*');
      }
    }
    // Notificar en diferentes momentos
    window.addEventListener('load', notifyHeight);
    document.addEventListener('DOMContentLoaded', notifyHeight);
    // Retraso para asegurar que estilos y fuentes cargaron
    setTimeout(notifyHeight, 100);
    setTimeout(notifyHeight, 500);
    setTimeout(notifyHeight, 1000);
    
    var root = document.getElementById('custom-viz-root');
    if (root && typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(function() { notifyHeight(); }).observe(root);
    } else if (root) {
      new MutationObserver(notifyHeight).observe(root, {
        childList: true, subtree: true, attributes: true
      });
    }
    // Intervalo de seguridad por si hay animaciones
    setInterval(notifyHeight, 2000);
  })();
<\/script>`;

function readThemeStyle(): string {
  if (typeof window === "undefined") return "";
  const computed = window.getComputedStyle(document.documentElement);
  const vars = STANDARD_VARS.map(
    (v) => `${v}: ${computed.getPropertyValue(v).trim() || "unset"};`
  ).join(" ");
  return `:root { ${vars} ${ALIAS_CSS} } html, body { background-color: var(--background); color: var(--foreground); margin: 0; padding: 0; overflow: hidden; } #custom-viz-root { box-sizing: border-box; }`;
}

export function CustomVizBlock({ custom_markup, data }: Props) {
  const [height, setHeight] = useState<number | null>(null);
  // Lazy initializer: runs synchronously on the client before first render,
  // avoiding the double-render / iframe-reload caused by a useEffect update.
  const [themeStyle] = useState(readThemeStyle);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const tableData = data.rows.map((row) =>
    Object.fromEntries(data.columns.map((col) => [col.header, row[col.id] ?? ""]))
  );

  const srcdoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>${themeStyle}</style>
</head>
<body>
  <script>window.__tableData = ${JSON.stringify(tableData)};<\/script>
  <div id="custom-viz-root">${custom_markup}</div>
  ${RESIZE_SCRIPT}
</body>
</html>`;

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (
        e.data?.type === "custom-viz-height" &&
        typeof e.data.height === "number"
      ) {
        // Limita la altura máxima a 1200px para evitar iframes descontrolados
        // y mínimo de 100px para contenido vacío
        const newHeight = Math.min(1200, Math.max(100, e.data.height));
        setHeight(newHeight);
        
        // Resetea el timeout de seguridad
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      }
    };
    window.addEventListener("message", handler);
    
    // Timeout de seguridad: si no recibimos altura en 3 segundos, usamos auto
    timeoutRef.current = setTimeout(() => {
      setHeight((prev) => (prev === null ? 400 : prev));
    }, 3000);
    
    return () => {
      window.removeEventListener("message", handler);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Altura final: usa la recibida del iframe o el valor por defecto
  const finalHeight = height ?? 400;
  
  return (
    <iframe
      ref={iframeRef}
      srcDoc={srcdoc}
      style={{ 
        width: "100%", 
        height: `${finalHeight}px`, 
        border: "none", 
        display: "block",
        overflow: "hidden"
      }}
      title="Visualización personalizada"
      sandbox="allow-scripts"
      allow="clipboard-write"
      scrolling="no"
    />
  );
}

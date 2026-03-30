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
    var reported = false;
    
    function getContentHeight() {
      var root = document.getElementById('custom-viz-root');
      if (!root) return 400;
      
      // Obtener el elemento más alto dentro del root
      var children = root.children;
      var maxChildHeight = 0;
      for (var i = 0; i < children.length; i++) {
        var rect = children[i].getBoundingClientRect();
        var childBottom = rect.top + rect.height;
        if (childBottom > maxChildHeight) {
          maxChildHeight = childBottom;
        }
      }
      
      // Si encontramos hijos con altura, usamos esa
      if (maxChildHeight > 50) {
        return Math.ceil(maxChildHeight + 20); // +20px de margen
      }
      
      // Fallback a scrollHeight del root
      return Math.max(root.scrollHeight, 200);
    }
    
    function notifyHeight() {
      if (reported) return; // Solo reportar una vez
      
      var h = getContentHeight();
      // Limitar entre 100px y 1200px
      h = Math.min(1200, Math.max(100, h));
      
      if (Math.abs(h - lastHeight) > 5) {
        lastHeight = h;
        window.parent.postMessage({ type: 'custom-viz-height', height: h }, '*');
        reported = true;
      }
    }
    
    // Reportar solo una vez, después de que todo cargue
    window.addEventListener('load', notifyHeight);
    setTimeout(notifyHeight, 500);
    setTimeout(notifyHeight, 1500);
  })();
<\/script>`;

function readThemeStyle(): string {
  if (typeof window === "undefined") return "";
  const computed = window.getComputedStyle(document.documentElement);
  const vars = STANDARD_VARS.map(
    (v) => `${v}: ${computed.getPropertyValue(v).trim() || "unset"};`
  ).join(" ");
  return `:root { ${vars} ${ALIAS_CSS} } html, body { background-color: var(--background); color: var(--foreground); margin: 0; padding: 0; } #custom-viz-root { box-sizing: border-box; height: auto; display: block; }`;
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
        // Solo aceptar la primera altura reportada válida
        setHeight((prev) => {
          if (prev !== null) return prev; // Ya tenemos altura, no cambiar
          const h = Math.min(1200, Math.max(100, e.data.height));
          return h;
        });
      }
    };
    window.addEventListener("message", handler);
    
    // Timeout de seguridad
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
        display: "block"
      }}
      title="Visualización personalizada"
      sandbox="allow-scripts"
      allow="clipboard-write"
    />
  );
}

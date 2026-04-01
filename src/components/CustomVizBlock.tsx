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
    var observer = null;
    var checkInterval = null;
    var timeoutId = null;
    var startTime = Date.now();
    var isStable = false;
    var stabilityCounter = 0;
    
    function getContentHeight() {
      var root = document.getElementById('custom-viz-root');
      if (!root) return 400;
      
      // Obtener todas las dimensiones posibles
      var scrollHeight = root.scrollHeight;
      var offsetHeight = root.offsetHeight;
      
      // Obtener el elemento más alto dentro del root
      var children = root.children;
      var maxChildBottom = 0;
      var hasVisibleChildren = false;
      
      for (var i = 0; i < children.length; i++) {
        var child = children[i];
        var rect = child.getBoundingClientRect();
        if (rect.height > 0) {
          hasVisibleChildren = true;
          var childBottom = rect.bottom;
          if (childBottom > maxChildBottom) {
            maxChildBottom = childBottom;
          }
        }
        // También considerar scrollHeight de los hijos (para elementos con overflow)
        var childScrollHeight = child.scrollHeight;
        if (childScrollHeight > 0) {
          hasVisibleChildren = true;
        }
      }
      
      // Calcular altura considerando todos los factores
      var heightFromChildren = hasVisibleChildren ? Math.ceil(maxChildBottom + 20) : 0;
      var heightFromScroll = scrollHeight > 50 ? scrollHeight + 20 : 0;
      var heightFromOffset = offsetHeight > 50 ? offsetHeight + 20 : 0;
      
      // Tomar el máximo de todas las mediciones
      var finalHeight = Math.max(heightFromChildren, heightFromScroll, heightFromOffset, 200);
      
      // Limitar entre 100px y 1500px
      return Math.min(1500, Math.max(100, finalHeight));
    }
    
    function notifyHeight(force) {
      var h = getContentHeight();
      var hasChanged = Math.abs(h - lastHeight) > 3;
      
      if (force || hasChanged) {
        lastHeight = h;
        window.parent.postMessage({ type: 'custom-viz-height', height: h }, '*');
        
        // Reset stability counter cuando hay cambios
        if (hasChanged) {
          stabilityCounter = 0;
          isStable = false;
        }
      } else {
        // Contar estabilidad
        stabilityCounter++;
        if (stabilityCounter >= 3) {
          isStable = true;
        }
      }
      
      return isStable;
    }
    
    function startObserving() {
      var root = document.getElementById('custom-viz-root');
      if (!root) return;
      
      // Notificar altura inicial
      notifyHeight(true);
      
      // ResizeObserver para detectar cambios de tamaño
      if (typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(function(entries) {
          setTimeout(function() { notifyHeight(false); }, 50);
        });
        observer.observe(root);
        
        // Observar hijos directos también
        for (var i = 0; i < root.children.length; i++) {
          observer.observe(root.children[i]);
        }
      }
      
      // MutationObserver para detectar cambios en el DOM
      if (typeof MutationObserver !== 'undefined') {
        var mutationObserver = new MutationObserver(function(mutations) {
          setTimeout(function() { notifyHeight(false); }, 100);
        });
        mutationObserver.observe(root, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['style', 'class']
        });
      }
      
      // Intervalo de verificación durante los primeros 10 segundos
      checkInterval = setInterval(function() {
        var elapsed = Date.now() - startTime;
        
        // Verificar altura periódicamente
        notifyHeight(false);
        
        // Detener después de 10 segundos o cuando sea estable por suficiente tiempo
        if (elapsed > 10000 || (elapsed > 3000 && isStable)) {
          clearInterval(checkInterval);
          if (observer) {
            observer.disconnect();
          }
        }
      }, 300);
    }
    
    // Iniciar cuando el DOM esté listo
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', startObserving);
    } else {
      startObserving();
    }
    
    // También en window.load (para recursos externos)
    window.addEventListener('load', function() {
      setTimeout(function() { notifyHeight(true); }, 100);
      setTimeout(function() { notifyHeight(true); }, 500);
      setTimeout(function() { notifyHeight(true); }, 1000);
    });
    
    // Cleanup en unload
    window.addEventListener('beforeunload', function() {
      if (checkInterval) clearInterval(checkInterval);
      if (timeoutId) clearTimeout(timeoutId);
      if (observer) observer.disconnect();
    });
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
    let debounceTimeout: NodeJS.Timeout | null = null;
    let lastUpdateTime = Date.now();
    
    const handler = (e: MessageEvent) => {
      if (
        e.data?.type === "custom-viz-height" &&
        typeof e.data.height === "number"
      ) {
        const newHeight = Math.min(1500, Math.max(100, e.data.height));
        const now = Date.now();
        
        // Si es la primera vez, aplicar inmediatamente
        if (height === null) {
          setHeight(newHeight);
          lastUpdateTime = now;
          return;
        }
        
        // Para actualizaciones posteriores, usar debounce de 100ms
        // pero permitir updates inmediatos si han pasado más de 500ms desde el último
        if (debounceTimeout) {
          clearTimeout(debounceTimeout);
        }
        
        if (now - lastUpdateTime > 500) {
          setHeight(newHeight);
          lastUpdateTime = now;
        } else {
          debounceTimeout = setTimeout(() => {
            setHeight(newHeight);
            lastUpdateTime = Date.now();
          }, 100);
        }
      }
    };
    window.addEventListener("message", handler);
    
    // Timeout de seguridad - si no recibimos altura en 5 segundos, usar default
    timeoutRef.current = setTimeout(() => {
      setHeight((prev) => (prev === null ? 600 : prev));
    }, 5000);
    
    return () => {
      window.removeEventListener("message", handler);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [height]); // Dependencia height para poder comparar con valor anterior

  // Altura final: usa la recibida del iframe o el valor por defecto
  const finalHeight = height ?? 600;
  
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

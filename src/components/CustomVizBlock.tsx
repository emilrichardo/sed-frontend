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
  function notifyHeight() {
    var h = document.documentElement.scrollHeight;
    window.parent.postMessage({ type: 'custom-viz-height', height: h }, '*');
  }
  window.addEventListener('load', notifyHeight);
  new MutationObserver(notifyHeight).observe(document.body, {
    childList: true, subtree: true, attributes: true
  });
<\/script>`;

function readThemeStyle(): string {
  if (typeof window === "undefined") return "";
  const computed = window.getComputedStyle(document.documentElement);
  const vars = STANDARD_VARS.map(
    (v) => `${v}: ${computed.getPropertyValue(v).trim() || "unset"};`
  ).join(" ");
  return `:root { ${vars} ${ALIAS_CSS} } html, body { background-color: var(--background); color: var(--foreground); margin: 0; padding: 0; }`;
}

export function CustomVizBlock({ custom_markup, data }: Props) {
  const [height, setHeight] = useState(400);
  // Lazy initializer: runs synchronously on the client before first render,
  // avoiding the double-render / iframe-reload caused by a useEffect update.
  const [themeStyle] = useState(readThemeStyle);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const tableData = data.rows.map((row) =>
    Object.fromEntries(data.columns.map((col) => [col.header, row[col.id] ?? ""]))
  );

  const srcdoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>${themeStyle}</style>
</head>
<body>
  <script>window.__tableData = ${JSON.stringify(tableData)};<\/script>
  ${RESIZE_SCRIPT}
  ${custom_markup}
</body>
</html>`;

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (
        e.data?.type === "custom-viz-height" &&
        typeof e.data.height === "number"
      ) {
        setHeight(Math.max(200, e.data.height));
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={srcdoc}
      style={{ width: "100%", height: `${height}px`, border: "none", display: "block" }}
      title="Visualización personalizada"
      sandbox="allow-scripts"
    />
  );
}

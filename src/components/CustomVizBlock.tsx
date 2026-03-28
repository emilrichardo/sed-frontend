"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  custom_markup: string;
  data: {
    columns: { id: string; header: string }[];
    rows: Record<string, string>[];
  };
};

const THEME_VARS = [
  "--background", "--foreground",
  "--card", "--card-foreground",
  "--primary", "--primary-foreground",
  "--secondary", "--secondary-foreground",
  "--muted", "--muted-foreground",
  "--accent", "--accent-foreground",
  "--destructive", "--border", "--radius",
];

const RESIZE_SCRIPT = `<script>
  function notifyHeight() {
    var h = document.documentElement.scrollHeight;
    window.parent.postMessage({ type: 'custom-viz-height', height: h }, '*');
  }
  window.addEventListener('load', notifyHeight);
  new MutationObserver(notifyHeight).observe(document.body, {
    childList: true, subtree: true, attributes: true
  });
</script>`;

export function CustomVizBlock({ custom_markup, data }: Props) {
  const [height, setHeight] = useState(400);
  const [themeStyle, setThemeStyle] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Read CSS custom properties from the host document and inject them into the iframe
  useEffect(() => {
    const computed = window.getComputedStyle(document.documentElement);
    const vars = THEME_VARS.map(
      (v) => `${v}: ${computed.getPropertyValue(v).trim()};`
    ).join(" ");
    setThemeStyle(`:root { ${vars} } html, body { background-color: var(--background); color: var(--foreground); margin: 0; padding: 0; }`);
  }, []);

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

  const tableData = data.rows.map((row) =>
    Object.fromEntries(data.columns.map((col) => [col.header, row[col.id]]))
  );

  const srcdoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>${themeStyle}</style>
</head>
<body>
  <script>window.__tableData = ${JSON.stringify(tableData)};</script>
  ${RESIZE_SCRIPT}
  ${custom_markup}
</body>
</html>`;

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

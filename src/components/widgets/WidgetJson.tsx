"use client";

import React from "react";

interface WidgetJsonProps {
  data: Record<string, unknown>;
}

export default function WidgetJson({ data }: WidgetJsonProps) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
        </div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
          Widget JSON
        </span>
      </div>

      {/* JSON Content */}
      <div className="flex-1 overflow-auto p-4">
        <pre className="text-xs font-mono text-muted-foreground leading-relaxed whitespace-pre-wrap break-words">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
}

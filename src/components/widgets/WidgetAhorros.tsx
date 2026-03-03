"use client";

import React from "react";
import { PiggyBank } from "lucide-react";

interface WidgetAhorrosProps {
  data: Record<string, unknown>;
}

export default function WidgetAhorros({ data }: WidgetAhorrosProps) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/10 shrink-0">
          <PiggyBank className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
          Widget Ahorros
        </span>
        <span className="ml-auto px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800">
          En desarrollo
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

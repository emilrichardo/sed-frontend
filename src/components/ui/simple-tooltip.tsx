"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SimpleTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  className?: string;
}

export function SimpleTooltip({
  children,
  content,
  className,
}: SimpleTooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={() => setIsVisible(!isVisible)}
    >
      <div
        className={cn(
          "cursor-pointer border-b border-dotted border-primary/50 hover:border-primary transition-colors",
          className,
        )}
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-popover text-popover-foreground text-xs rounded-md border shadow-md z-50 animate-in fade-in zoom-in-95 duration-200">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-popover" />
        </div>
      )}
    </div>
  );
}

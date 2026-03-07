import React from "react";
import { Isotipo } from "./Isotipo";
import { Wordmark } from "./Wordmark";

interface IsologotipoProps {
  height?: number;
  animated?: boolean;
  className?: string;
}

export function Isologotipo({ height = 40, animated = true, className }: IsologotipoProps) {
  return (
    <div className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <Isotipo size={height} animated={animated} />
      <Wordmark height={height} />
    </div>
  );
}

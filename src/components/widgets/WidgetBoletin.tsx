"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, ArrowUpRight, Newspaper } from "lucide-react";

interface Boletin {
  id: string;
  numero: number;
  slug: string;
  fecha_publicacion: string;
  año_edicion: string;
  cantidad_paginas: number;
}

type Variant = "xs" | "sm" | "md" | "lg" | "xl";

interface Props {
  variant?: Variant;
}

function fmt(date: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(date).toLocaleDateString("es-AR", opts);
}

// ── XS — línea inline ─────────────────────────────────────────────────────────

function VariantXS({ b }: { b: Boletin }) {
  return (
    <Link
      href={`/boletines/${b.slug}`}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors text-xs group"
    >
      <Newspaper className="h-3 w-3 text-muted-foreground shrink-0" />
      <span className="font-semibold">Boletín Nº {b.numero}</span>
      <span className="text-muted-foreground">·</span>
      <span className="text-muted-foreground tabular-nums">
        {fmt(b.fecha_publicacion, { day: "numeric", month: "short", year: "numeric" })}
      </span>
      <span className="font-mono font-bold text-primary">{b.año_edicion}</span>
      <ArrowUpRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
    </Link>
  );
}

// ── SM — tarjeta compacta (actual) ────────────────────────────────────────────

function VariantSM({ b }: { b: Boletin }) {
  return (
    <Link
      href={`/boletines/${b.slug}`}
      className="group bg-card border border-border rounded-xl overflow-hidden hover:bg-muted/50 transition-colors"
    >
      <div className="px-4 py-3 flex items-center justify-between border-b border-border/50">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            Último Boletín Oficial
          </p>
          <p className="text-sm font-bold mt-0.5">
            Nº {b.numero}
            <span className="text-muted-foreground font-normal ml-1.5 text-xs">
              · {fmt(b.fecha_publicacion, { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold font-mono rounded-full border border-primary">
            {b.año_edicion}
          </span>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>
      <div className="px-4 py-2.5 flex items-center gap-2">
        <BookOpen className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
        <span className="text-xs text-muted-foreground tabular-nums">
          {b.cantidad_paginas} páginas
        </span>
      </div>
    </Link>
  );
}

// ── MD — tarjeta media ────────────────────────────────────────────────────────

function VariantMD({ b }: { b: Boletin }) {
  return (
    <Link
      href={`/boletines/${b.slug}`}
      className="group bg-card border border-border rounded-xl overflow-hidden hover:bg-muted/50 transition-colors"
    >
      <div className="px-4 py-3 flex items-center justify-between border-b border-border/50">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
          Último Boletín Oficial
        </p>
        <Newspaper className="h-4 w-4 text-muted-foreground/40 shrink-0" />
      </div>

      <div className="px-4 py-4">
        <p className="text-2xl font-bold font-mono tabular-nums">
          Nº {b.numero}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {fmt(b.fecha_publicacion, { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      <div className="px-4 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
          <span className="text-xs text-muted-foreground tabular-nums">
            {b.cantidad_paginas} páginas
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold font-mono rounded-full border border-primary">
            {b.año_edicion}
          </span>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>
    </Link>
  );
}

// ── LG — tarjeta grande ───────────────────────────────────────────────────────

function VariantLG({ b }: { b: Boletin }) {
  return (
    <Link
      href={`/boletines/${b.slug}`}
      className="group bg-card border border-border rounded-xl overflow-hidden hover:bg-muted/50 transition-colors"
    >
      <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            Último Boletín Oficial
          </p>
          <p className="text-base font-bold mt-0.5">
            {fmt(b.fecha_publicacion, { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <Newspaper className="h-5 w-5 text-muted-foreground/40 shrink-0 mt-0.5" />
      </div>

      <div className="px-5 py-6 border-y border-border/50 bg-muted/10 text-center">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2">
          Número de edición
        </p>
        <p className="text-4xl font-bold font-mono tabular-nums tracking-tight">
          Nº {b.numero}
        </p>
      </div>

      <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <BookOpen className="h-4 w-4 text-muted-foreground/60 shrink-0" />
          <span className="text-sm text-muted-foreground tabular-nums">
            {b.cantidad_paginas} páginas
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-primary text-primary-foreground text-xs font-bold font-mono rounded-full border border-primary">
            {b.año_edicion}
          </span>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>
    </Link>
  );
}

// ── XL — tarjeta completa ─────────────────────────────────────────────────────

function VariantXL({ b }: { b: Boletin }) {
  return (
    <Link
      href={`/boletines/${b.slug}`}
      className="group bg-card border border-border rounded-xl overflow-hidden hover:bg-muted/50 transition-colors"
    >
      <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            Último Boletín Oficial
          </p>
          <p className="text-xl font-bold mt-1">
            {fmt(b.fecha_publicacion, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-muted shrink-0">
          <Newspaper className="h-5 w-5 text-muted-foreground/60" />
        </div>
      </div>

      <div className="mx-6 mb-4 rounded-xl bg-muted/30 border border-border/50 px-5 py-5 text-center">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
          Número de edición
        </p>
        <p className="text-5xl font-bold font-mono tabular-nums tracking-tight">
          Nº {b.numero}
        </p>
      </div>

      <div className="mx-6 mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground/60 shrink-0" />
          <span className="text-sm text-muted-foreground tabular-nums">
            {b.cantidad_paginas} páginas
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold font-mono rounded-full border border-primary">
            {b.año_edicion}
          </span>
          <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>
    </Link>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────

export default function WidgetBoletin({ variant = "sm" }: Props) {
  const [boletin, setBoletin] = useState<Boletin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api-proxy/boletines?limit=1&sort=-fecha_publicacion&depth=0")
      .then((r) => r.json())
      .then((data) => {
        setBoletin(data.docs?.[0] ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    const heights: Record<Variant, string> = {
      xs: "h-9",
      sm: "h-[88px]",
      md: "h-36",
      lg: "h-52",
      xl: "h-64",
    };
    return (
      <div
        className={`bg-card border border-border rounded-xl animate-pulse ${heights[variant]}`}
      />
    );
  }

  if (!boletin) return null;

  if (variant === "xs") return <VariantXS b={boletin} />;
  if (variant === "md") return <VariantMD b={boletin} />;
  if (variant === "lg") return <VariantLG b={boletin} />;
  if (variant === "xl") return <VariantXL b={boletin} />;
  return <VariantSM b={boletin} />;
}

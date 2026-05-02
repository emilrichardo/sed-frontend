"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FileText, ArrowUpRight } from "lucide-react";
import { API_URL } from "@/lib/api";

interface Publicacion {
  id: number;
  titulo: string;
  slug: string;
  publishedDate?: string;
  createdAt?: string;
  fijado?: boolean;
}

interface Props {
  /** Optional fixed slug; when omitted, shows a slider of recent pinned publications. */
  slug?: string;
}

const TWO_MONTHS_MS = 1000 * 60 * 60 * 24 * 60;
const ROTATE_MS = 5000;

export default function WidgetPublicacion({ slug }: Props) {
  const [pubs, setPubs] = useState<Publicacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const url = slug
      ? `${API_URL}/publicaciones?where[slug][equals]=${slug}&limit=1&depth=0`
      : `${API_URL}/publicaciones?where[fijado][equals]=true&limit=10&sort=-publishedDate,-createdAt&depth=0`;

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        const docs: Publicacion[] = data.docs ?? [];
        if (slug) {
          setPubs(docs.slice(0, 1));
        } else {
          const cutoff = Date.now() - TWO_MONTHS_MS;
          const recent = docs
            .filter((p) => {
              const d = p.publishedDate || p.createdAt;
              return d ? new Date(d).getTime() >= cutoff : false;
            })
            .slice(0, 3);
          setPubs(recent);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (pubs.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % pubs.length);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [pubs.length]);

  const current = useMemo(() => pubs[index] ?? null, [pubs, index]);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl animate-pulse h-[72px]" />
    );
  }

  if (!current) return null;

  const dateLabel = current.publishedDate || current.createdAt;
  const formattedDate = dateLabel
    ? new Date(dateLabel).toLocaleDateString("es-AR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="relative">
      <Link
        key={current.id}
        href={`/publicaciones/${current.slug}`}
        className="group block bg-card border border-border rounded-xl overflow-hidden hover:bg-muted/50 transition-colors animate-in fade-in duration-500"
      >
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              Publicación{pubs.length > 1 ? " fija" : ""}
            </p>
            <p className="text-sm font-bold mt-0.5 line-clamp-1">
              {current.titulo}
            </p>
            {formattedDate && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {formattedDate}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <FileText className="h-4 w-4 text-muted-foreground/40" />
            <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>
      </Link>

      {pubs.length > 1 && (
        <div className="absolute bottom-1.5 right-3 flex items-center gap-1">
          {pubs.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setIndex(i);
              }}
              aria-label={`Mostrar publicación ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === index
                  ? "w-4 bg-primary"
                  : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

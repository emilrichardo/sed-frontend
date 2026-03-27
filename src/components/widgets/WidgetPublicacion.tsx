"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, ArrowUpRight } from "lucide-react";
import { API_URL } from "@/lib/api";

interface Publicacion {
  id: number;
  titulo: string;
  slug: string;
  publishedDate?: string;
  createdAt?: string;
}

interface Props {
  slug: string;
}

export default function WidgetPublicacion({ slug }: Props) {
  const [pub, setPub] = useState<Publicacion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(
      `${API_URL}/publicaciones?where[slug][equals]=${slug}&limit=1&depth=0`,
    )
      .then((r) => r.json())
      .then((data) => {
        setPub(data.docs?.[0] ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl animate-pulse h-[72px]" />
    );
  }

  if (!pub) return null;

  const dateLabel = pub.publishedDate || pub.createdAt;
  const formattedDate = dateLabel
    ? new Date(dateLabel).toLocaleDateString("es-AR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <Link
      href={`/publicaciones/${pub.slug}`}
      className="group bg-card border border-border rounded-xl overflow-hidden hover:bg-muted/50 transition-colors"
    >
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            Publicación
          </p>
          <p className="text-sm font-bold mt-0.5 line-clamp-1">{pub.titulo}</p>
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
  );
}

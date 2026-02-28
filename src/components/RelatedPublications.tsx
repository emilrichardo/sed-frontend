"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import type { ReportItem } from "@/lib/api";
import { LayoutGrid } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface RelatedPublicationsProps {
  currentId: string | number;
  tipoId?: string | number;
}

export function RelatedPublications({
  currentId,
  tipoId,
}: RelatedPublicationsProps) {
  const [related, setRelated] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRelated() {
      if (!tipoId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Fetch publications of the same tipo, excluding the current one
        const res = await fetch(
          `/api-proxy/publicaciones?where[tipo_publicacion][equals]=${tipoId}&where[id][not_equals]=${currentId}&limit=3&sort=-createdAt&depth=1`,
        );
        const data = await res.json();
        setRelated(data.docs || []);
      } catch (error) {
        console.error("Error fetching related publications:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRelated();
  }, [currentId, tipoId]);

  if (!tipoId) return null;

  if (loading) {
    return (
      <div className="mt-16 pt-8 border-t border-border">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-muted-foreground" />
          Más publicaciones relacionadas
        </h3>
        <div className="space-y-6">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (related.length === 0) {
    return null;
  }

  return (
    <div className="mt-16 pt-8 border-t border-border">
      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
        <LayoutGrid className="h-5 w-5 text-muted-foreground" />
        Más publicaciones relacionadas
      </h3>
      <div className="space-y-4">
        {related.map((pub) => (
          <Link
            key={pub.id}
            href={`/publicaciones/${pub.slug}`}
            className="block p-5 border bg-card hover:bg-muted/50 transition-colors group rounded-lg"
          >
            <h4 className="font-bold text-lg group-hover:text-primary leading-tight">
              {pub.titulo}
            </h4>
            {pub.publishedDate && (
              <p className="mt-2 text-xs text-muted-foreground">
                {new Date(pub.publishedDate).toLocaleDateString("es-AR", {
                  year: "numeric",
                  month: "long",
                })}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Bookmark, BookmarkX, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ResponsivePublicationCard } from "@/components/PublicationCard";
import type { ReportItem } from "@/lib/api";
import { API_URL } from "@/lib/api";

const FAVORITES_KEY = "sed_favorites";

function getFavorites(): string[] {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
  } catch {
    return [];
  }
}

export default function FavoritosPage() {
  const [ids, setIds] = useState<string[]>([]);
  const [items, setItems] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback((favIds: string[]) => {
    if (favIds.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }
    const params = favIds
      .map((id, i) => `where[id][in][${i}]=${id}`)
      .join("&");
    fetch(`${API_URL}/publicaciones?${params}&limit=${favIds.length}&depth=2`)
      .then((r) => r.json())
      .then((data) => setItems(data.docs || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const favs = getFavorites();
    setIds(favs);
    fetchFavorites(favs);
  }, [fetchFavorites]);

  const handleRemove = (publicationId: string | number) => {
    const id = String(publicationId);
    const favs = getFavorites();
    const idx = favs.indexOf(id);
    if (idx !== -1) {
      favs.splice(idx, 1);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
      setIds(favs);
      setItems((prev) => prev.filter((item) => String(item.id) !== id));
    }
  };

  const handleClearAll = () => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([]));
    setIds([]);
    setItems([]);
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto py-8 md:py-12 space-y-8">
      <PageHeader
        title={`Favoritos${ids.length > 0 ? ` (${ids.length})` : ""}`}
        description="Publicaciones que guardaste como favoritas."
        icon={Bookmark}
        actions={
          items.length > 0 ? (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Limpiar todo
            </button>
          ) : undefined
        }
      />

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[110px] md:h-[320px] rounded-xl bg-muted animate-pulse"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
          <Bookmark
            className="h-16 w-16 text-muted-foreground/30"
            strokeWidth={1}
          />
          <div className="space-y-2">
            <h2 className="text-xl font-bold">
              No tenés publicaciones guardadas
            </h2>
            <p className="text-muted-foreground max-w-sm">
              Guardá publicaciones como favoritas para encontrarlas fácilmente
              acá.
            </p>
          </div>
          <Link
            href="/publicaciones"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Explorar publicaciones
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="relative group/fav">
              <ResponsivePublicationCard item={item} />
              <button
                onClick={() => handleRemove(item.id)}
                className="absolute top-3 right-3 z-10 opacity-0 group-hover/fav:opacity-100 transition-opacity p-1.5 rounded-md bg-background/80 border border-border text-muted-foreground hover:text-destructive hover:border-destructive/50 hover:bg-destructive/5"
                title="Quitar de favoritos"
              >
                <BookmarkX className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

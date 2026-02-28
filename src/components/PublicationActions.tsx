"use client";

import React, { useState, useEffect } from "react";
import { Send, Bookmark, BookmarkCheck, Link as LinkIcon, Check } from "lucide-react";

interface PublicationActionsProps {
  title: string;
  publicationId: string | number;
}

const FAVORITES_KEY = "sed_favorites";

function getFavorites(): string[] {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
  } catch {
    return [];
  }
}

export function PublicationActions({ title, publicationId }: PublicationActionsProps) {
  const [copied, setCopied] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const favs = getFavorites();
    setIsFavorite(favs.includes(String(publicationId)));
  }, [publicationId]);

  const handleSend = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title, url });
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleToggleFavorite = () => {
    const favs = getFavorites();
    const id = String(publicationId);
    const idx = favs.indexOf(id);
    if (idx === -1) {
      favs.push(id);
    } else {
      favs.splice(idx, 1);
    }
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
    setIsFavorite(idx === -1);
  };

  const btnBase =
    "flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-muted transition-all shrink-0";

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button onClick={handleSend} className={btnBase} title="Enviar publicación">
        <Send className="h-4 w-4" />
        Enviar
      </button>

      <button onClick={handleCopyLink} className={btnBase} title="Copiar enlace">
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <LinkIcon className="h-4 w-4" />
        )}
        {copied ? "¡Copiado!" : "Copiar enlace"}
      </button>

      <button
        onClick={handleToggleFavorite}
        className={`${btnBase} ${isFavorite ? "text-primary border-primary/50 bg-primary/5" : ""}`}
        title={isFavorite ? "Quitar de favoritos" : "Guardar como favorita"}
      >
        {isFavorite ? (
          <BookmarkCheck className="h-4 w-4 text-primary" />
        ) : (
          <Bookmark className="h-4 w-4" />
        )}
        {isFavorite ? "Guardada" : "Favorita"}
      </button>
    </div>
  );
}

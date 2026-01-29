"use client";

import React, { useEffect, useState } from "react";
import { getActoByIdentifier, ActoAdministrativo } from "@/lib/api";
import { ActDetailView } from "./ActDetailView";
import Link from "next/link";

interface ClientActoDetailFetcherProps {
  identifier: string;
  slug: string;
  initialError?: string;
}

export default function ClientActoDetailFetcher({
  identifier,
  slug,
  initialError,
}: ClientActoDetailFetcherProps) {
  const [entry, setEntry] = useState<ActoAdministrativo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getActoByIdentifier(identifier);
        setEntry(data);
      } catch (err: any) {
        console.error("Client fetch error:", err);
        setError(err.message || "Failed to load act");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [identifier]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Cargando acto...</p>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold">Error al cargar el acto</h1>
        <p className="text-muted-foreground mt-2">
          {error || initialError || "No se pudo cargar el acto."}
        </p>
        {initialError && error && (
          <p className="text-xs text-red-400 mt-2">
            Server Error: {initialError} <br />
            Client Error: {error}
          </p>
        )}
        <Link
          href={`/boletines/${slug}`}
          className="text-primary hover:underline mt-4 inline-block"
        >
          Volver al boletín
        </Link>
      </div>
    );
  }

  return (
    <ActDetailView
      entry={entry}
      backLink={
        typeof entry.boletin === "object"
          ? `/boletines/${entry.boletin.id}` // Ideally use slug if available
          : "/boletines"
      }
    />
  );
}

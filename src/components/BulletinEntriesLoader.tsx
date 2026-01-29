"use client";

import React, { useState, useEffect } from "react";
import { getActosAdministrativos, ActoAdministrativo } from "@/lib/api";
import BulletinEntriesBySection from "./BulletinEntriesBySection";
import { Loader2, AlertCircle } from "lucide-react";

interface BulletinEntriesLoaderProps {
  bulletinId: string | number;
}

export default function BulletinEntriesLoader({
  bulletinId,
}: BulletinEntriesLoaderProps) {
  const [entries, setEntries] = useState<ActoAdministrativo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEntries() {
      setLoading(true);
      setError(null);
      try {
        const data = await getActosAdministrativos({
          where: { boletin: bulletinId },
          limit: 100,
        });
        setEntries(data.docs.reverse());
      } catch (err: unknown) {
        console.error("Error loading entries for bulletin:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Error al cargar los actos administrativos";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    if (bulletinId) {
      loadEntries();
    }
  }, [bulletinId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-2" />
        <span>Cargando actos administrativos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 border rounded-lg border-red-200 bg-red-50 text-red-600">
        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
        <p className="font-medium">Error al cargar actos</p>
        <p className="text-sm opacity-80">{error}</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg border-dashed">
        <p className="text-muted-foreground">
          No hay actos registrados para este boletín.
        </p>
      </div>
    );
  }

  return <BulletinEntriesBySection entries={entries} />;
}

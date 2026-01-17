"use client";

import React, { useState, useEffect } from "react";
import { Boletin, getBulletins, PayloadResponse } from "@/lib/api";
import Link from "next/link";
import {
  Search,
  LayoutGrid,
  List as ListIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";

interface BulletinArchiveProps {
  filters?: any;
}

export default function BulletinArchive({ filters }: BulletinArchiveProps) {
  const [bulletins, setBulletins] = useState<PayloadResponse<Boletin> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "list">("table");
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadBulletins() {
      setLoading(true);
      try {
        const data = await getBulletins({
          page,
          limit: 10,
          where: {
            ...filters,
            ...(searchQuery ? { numero: searchQuery } : {}),
          },
        });
        setBulletins(data);
      } catch (error) {
        console.error("Error loading bulletins:", error);
      } finally {
        setLoading(false);
      }
    }
    loadBulletins();
  }, [page, filters, searchQuery]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">
          Archivo de Boletines
        </h1>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por número..."
              className="w-full pl-9 pr-4 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex border rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 ${
                  viewMode === "table"
                    ? "bg-accent text-accent-foreground"
                    : "bg-background"
                }`}
                title="Vista Tabla"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 ${
                  viewMode === "list"
                    ? "bg-accent text-accent-foreground"
                    : "bg-background"
                }`}
                title="Vista Lista"
              >
                <ListIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {viewMode === "table" ? (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                  <tr>
                    <th className="px-4 py-3">Número</th>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Año Edición</th>
                    <th className="px-4 py-3">Páginas</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {bulletins?.docs.map((b) => (
                    <tr
                      key={b.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium">{b.numero}</td>
                      <td className="px-4 py-3">
                        {formatDate(b.fecha_publicacion)}
                      </td>
                      <td className="px-4 py-3">{b.año_edicion}</td>
                      <td className="px-4 py-3">{b.cantidad_paginas}</td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/boletines/${b.slug}`}
                          className="text-primary hover:underline font-medium"
                        >
                          Ver Detalle
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid gap-4">
              {bulletins?.docs.map((b) => (
                <Link
                  key={b.id}
                  href={`/boletines/${b.slug}`}
                  className="block p-4 border rounded-lg hover:border-primary transition-colors bg-card"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">
                        Boletín Oficial Nº {b.numero}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Publicado el {formatDate(b.fecha_publicacion)}
                      </p>
                    </div>
                    <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                      {b.año_edicion}
                    </span>
                  </div>
                  <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
                    <span>{b.cantidad_paginas} páginas</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">
              Mostrando {bulletins?.docs.length} de {bulletins?.totalDocs}{" "}
              boletines
            </p>
            <div className="flex gap-2">
              <button
                disabled={!bulletins?.hasPrevPage}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 border rounded-md disabled:opacity-50 hover:bg-muted transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center px-4 text-sm font-medium">
                Página {bulletins?.page} de {bulletins?.totalPages}
              </div>
              <button
                disabled={!bulletins?.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 border rounded-md disabled:opacity-50 hover:bg-muted transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

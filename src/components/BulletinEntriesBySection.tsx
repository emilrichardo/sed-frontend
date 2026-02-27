"use client";

import React, { useState } from "react";
import { ActoAdministrativo } from "@/lib/api";
import EntryExpandedContent from "./EntryExpandedContent";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function BulletinEntriesBySection({
  entries,
}: {
  entries: ActoAdministrativo[];
}) {
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedEntryId(expandedEntryId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Entries List */}
      <div className="grid gap-4">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className={`p-4 border rounded-lg transition-all ${
              expandedEntryId === entry.id
                ? "bg-muted/50 border-input shadow-none"
                : "bg-card border-input shadow-sm hover:shadow-md hover:border-primary/50"
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div
                className="space-y-2 flex-1 cursor-pointer"
                onClick={() => toggleExpand(entry.id)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {entry.tipo_de_acto &&
                    typeof entry.tipo_de_acto === "object"
                      ? entry.tipo_de_acto.nombre
                      : "Acto"}
                  </span>
                  <span className="text-[10px] bg-secondary text-secondary-foreground border border-transparent px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                    {entry.seccion || "Sección"}
                  </span>
                </div>
                <h3 className="font-heading font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                  {entry.identificador_de_acto}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {entry.titulo}
                </p>
                {entry.jurisdiccion && (
                  <div className="text-xs text-muted-foreground">
                    Jurisdicción:{" "}
                    {typeof entry.jurisdiccion === "object"
                      ? entry.jurisdiccion.nombre
                      : entry.jurisdiccion}
                  </div>
                )}
              </div>
              <button
                onClick={() => toggleExpand(entry.id)}
                className="flex items-center gap-1 text-sm font-medium text-primary hover:underline self-start"
              >
                {expandedEntryId === entry.id ? (
                  <>
                    Contraer <ChevronUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Expandir <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>

            {expandedEntryId === entry.id && (
              <EntryExpandedContent entry={entry} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

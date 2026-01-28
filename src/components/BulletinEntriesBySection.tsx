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
  // Group entries by section
  const groupedEntries = entries.reduce(
    (acc, entry) => {
      const sectionName = entry.seccion || "Otras Secciones";
      if (!acc[sectionName]) acc[sectionName] = [];
      acc[sectionName].push(entry);
      return acc;
    },
    {} as Record<string, ActoAdministrativo[]>,
  );

  const allSectionsLabel = "Todas";
  const sections = [allSectionsLabel, ...Object.keys(groupedEntries)];
  const [activeSection, setActiveSection] = useState<string>(allSectionsLabel);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedEntryId(expandedEntryId === id ? null : id);
  };

  const displayedEntries =
    activeSection === allSectionsLabel
      ? entries
      : groupedEntries[activeSection] || [];

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-4">
        {sections.map((section) => (
          <button
            key={section}
            onClick={() => {
              setActiveSection(section);
              setExpandedEntryId(null);
            }}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeSection === section
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {section === allSectionsLabel ? "Todas las secciones" : section}
            <span className="ml-2 opacity-60 text-xs">
              (
              {section === allSectionsLabel
                ? entries.length
                : groupedEntries[section]?.length}
              )
            </span>
          </button>
        ))}
      </div>

      {/* Entries for Active Section */}
      <div className="grid gap-4">
        {displayedEntries.map((entry) => (
          <div
            key={entry.id}
            className={`p-4 border rounded-lg transition-all ${
              expandedEntryId === entry.id
                ? "border-primary ring-1 ring-primary/20 bg-card shadow-md"
                : "border-border bg-card hover:border-primary/50"
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
                  {/* Show section tag if viewing all */}
                  {activeSection === allSectionsLabel && (
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground uppercase">
                      {entry.seccion || "Sección"}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
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

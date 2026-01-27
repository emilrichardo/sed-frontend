"use client";

import React, { useState } from "react";
import BulletinArchive from "./BulletinArchive";
import BulletinFilters from "./BulletinFilters";
import EntriesList from "./EntriesList";
import { FileText, ListFilter } from "lucide-react";

export default function BulletinArchiveContainer() {
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [activeTab, setActiveTab] = useState<"bulletins" | "entries">(
    "bulletins",
  );

  return (
    <div className="space-y-8">
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("bulletins")}
          className={`px-6 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "bulletins"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="h-4 w-4" />
          Boletines
        </button>
        <button
          onClick={() => setActiveTab("entries")}
          className={`px-6 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "entries"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ListFilter className="h-4 w-4" />
          Actos Administrativos
        </button>
      </div>

      <BulletinFilters onFilterChange={setFilters} />

      {activeTab === "bulletins" ? (
        <BulletinArchive filters={filters} />
      ) : (
        <EntriesList filters={filters} />
      )}
    </div>
  );
}

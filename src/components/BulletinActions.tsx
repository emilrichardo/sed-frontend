"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Boletin, deleteBulletin, Procesamiento } from "@/lib/api";
import { Trash2 } from "lucide-react";
import { BulletinProcessingButton } from "./BulletinProcessingButton";

export default function BulletinActions({ bulletin }: { bulletin: Boletin }) {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const handleDelete = async () => {
    if (
      !confirm(
        `¿Estás seguro de que deseas eliminar el boletín Nº ${bulletin.numero}? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }
    try {
      await deleteBulletin(bulletin.id);
      router.push("/boletines");
    } catch {
      alert("Error eliminando el boletín.");
    }
  };

  const getExistingProcessingId = () => {
    if (
      !bulletin.procesamiento_asociado ||
      !Array.isArray(bulletin.procesamiento_asociado)
    )
      return null;
    const reversed = [...bulletin.procesamiento_asociado].reverse();
    for (const p of reversed) {
      if (typeof p === "object" && p !== null && "agente" in p) {
        const proc = p as Procesamiento;
        const agentId =
          typeof proc.agente === "object" && proc.agente !== null
            ? (proc.agente as { id?: string | number }).id
            : proc.agente;
        if (String(agentId) === "5") return proc.id;
      }
    }
    return null;
  };

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      <BulletinProcessingButton
        bulletin={bulletin}
        existingProcessingId={getExistingProcessingId()}
        requiredBoletinAgentId="5"
        className="bg-zinc-800 text-white hover:bg-zinc-700"
      />
      <button
        onClick={handleDelete}
        className="flex items-center gap-2 px-4 py-2 border border-destructive/50 text-destructive bg-background hover:bg-destructive/10 rounded-md text-sm font-medium transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        Eliminar
      </button>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import {
  FileText,
  FileCheck,
  Scale,
  BrainCircuit,
  Users,
  Link as LinkIcon,
} from "lucide-react";
import { getBulletins, getActosAdministrativos } from "@/lib/api";

type StatValue = number | string;

interface StatItem {
  label: string;
  value: StatValue;
  icon: React.ElementType;
  color: string;
}

export function Stats() {
  const [stats, setStats] = useState<StatItem[]>([
    {
      label: "Boletines Cargados",
      value: "-",
      icon: FileText,
      color: "text-blue-600",
    },
    {
      label: "Boletines Procesados",
      value: "-",
      icon: BrainCircuit,
      color: "text-purple-600",
    },
    {
      label: "Total Actos",
      value: "-",
      icon: Scale,
      color: "text-slate-600",
    },
    {
      label: "Actos Analizados",
      value: "-",
      icon: FileCheck,
      color: "text-green-600",
    },
    {
      label: "Entidades Detectadas",
      value: "15.4k", // Estimate
      icon: Users,
      color: "text-orange-600",
    },
    {
      label: "Referencias Cruzadas",
      value: "8.2k", // Estimate
      icon: LinkIcon,
      color: "text-pink-600",
    },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          bulletins,
          processedBulletins,
          // Acts fetches might fail if not authenticated
        ] = await Promise.all([
          getBulletins({ limit: 1 }).catch(() => ({ totalDocs: 0 })),
          getBulletins({
            limit: 1,
            where: { status_procesamiento: { not_equals: null } },
          }).catch(() => ({ totalDocs: 0 })),
        ]);

        // Attempt to fetch acts - might 403 if guest
        let actsTotal: number | string = "-";
        let processedActsTotal: number | string = "-";

        try {
          const acts = await getActosAdministrativos({ limit: 1 });
          actsTotal = acts.totalDocs;

          const processedActs = await getActosAdministrativos({
            limit: 1,
            where: {
              titulo_periodistico: { exists: true },
              nota_periodistica: { exists: true },
            },
          });
          processedActsTotal = processedActs.totalDocs;
        } catch (err) {
          console.warn(
            "Stats: Failed to fetch acts (likely unauthorized)",
            err,
          );
          // Keep as "-" or set to 0? "-" implies unknown/hidden
        }

        setStats((prev) => [
          { ...prev[0], value: bulletins.totalDocs || 0 },
          { ...prev[1], value: processedBulletins.totalDocs || 0 },
          { ...prev[2], value: actsTotal },
          { ...prev[3], value: processedActsTotal },
          prev[4],
          prev[5],
        ]);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="bg-card border p-4 flex flex-col items-center justify-center text-center rounded-lg shadow-sm hover:shadow-md transition-all"
          >
            <Icon className={`w-6 h-6 mb-2 ${stat.color}`} />
            <span className="text-2xl font-bold font-mono tracking-tighter">
              {loading && stat.value === "-" ? (
                <div className="h-8 w-12 bg-muted animate-pulse rounded" />
              ) : typeof stat.value === "number" ? (
                stat.value.toLocaleString("es-AR")
              ) : (
                stat.value
              )}
            </span>
            <span className="text-[10px] uppercase font-bold text-muted-foreground mt-1 tracking-normal leading-tight">
              {stat.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

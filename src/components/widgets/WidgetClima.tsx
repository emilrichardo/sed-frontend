"use client";

import React, { useEffect, useState } from "react";
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
} from "lucide-react";

interface WeatherData {
  temperature: number;
  windspeed: number;
  weathercode: number;
}

const CITY = "Santiago del Estero";
const LAT = -27.7951;
const LON = -64.2615;
const API_URL = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weathercode,windspeed_10m&timezone=America%2FArgentina%2FBuenos_Aires`;

function weatherInfo(code: number) {
  if (code === 0)
    return { label: "Despejado", Icon: Sun, color: "text-yellow-500" };
  if (code <= 3)
    return {
      label: "Parcialmente nublado",
      Icon: Cloud,
      color: "text-slate-400",
    };
  if (code <= 48)
    return { label: "Nublado", Icon: Cloud, color: "text-slate-500" };
  if (code <= 67)
    return { label: "Lluvia", Icon: CloudRain, color: "text-blue-500" };
  if (code <= 77)
    return { label: "Nieve", Icon: CloudSnow, color: "text-blue-300" };
  if (code <= 82)
    return { label: "Llovizna", Icon: CloudRain, color: "text-blue-400" };
  if (code <= 99)
    return {
      label: "Tormenta",
      Icon: CloudLightning,
      color: "text-purple-500",
    };
  return { label: "Variable", Icon: Cloud, color: "text-slate-400" };
}

function useWeather() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(API_URL)
      .then((r) => r.json())
      .then((d) =>
        setData({
          temperature: Math.round(d.current.temperature_2m),
          windspeed: Math.round(d.current.windspeed_10m),
          weathercode: d.current.weathercode,
        }),
      )
      .catch(() => setError(true));
  }, []);

  return { data, error };
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function Pulse({ w, h = "h-3" }: { w: string; h?: string }) {
  return <div className={`${h} ${w} bg-muted rounded animate-pulse`} />;
}

// ── XS — pill compacto ────────────────────────────────────────────────────────

function VariantXS() {
  const { data, error } = useWeather();
  if (error) return null;
  const info = data ? weatherInfo(data.weathercode) : null;

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-card text-xs">
      {info ? (
        <info.Icon className={`h-3.5 w-3.5 shrink-0 ${info.color}`} />
      ) : (
        <Pulse w="w-3.5" h="h-3.5" />
      )}
      {data ? (
        <span className="font-bold tabular-nums">{data.temperature}°C</span>
      ) : (
        <Pulse w="w-8" />
      )}
    </div>
  );
}

// ── SM — pill con ciudad ──────────────────────────────────────────────────────

function VariantSM() {
  const { data, error } = useWeather();
  if (error) return null;
  const info = data ? weatherInfo(data.weathercode) : null;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card text-xs">
      {info ? (
        <info.Icon className={`h-3.5 w-3.5 shrink-0 ${info.color}`} />
      ) : (
        <Pulse w="w-3.5" h="h-3.5" />
      )}
      <span className="text-muted-foreground font-medium">{CITY}</span>
      {data ? (
        <>
          <span className="text-muted-foreground">·</span>
          <span className="font-bold tabular-nums">{data.temperature}°C</span>
          <span className="text-muted-foreground hidden sm:inline">
            · {info?.label}
          </span>
        </>
      ) : (
        <Pulse w="w-12" />
      )}
    </div>
  );
}

// ── MD — tarjeta compacta ─────────────────────────────────────────────────────

function VariantMD() {
  const { data, error } = useWeather();
  if (error) return null;
  const info = data ? weatherInfo(data.weathercode) : null;

  return (
    <div className="bg-card border border-border rounded-xl px-4 py-4 flex items-center gap-4">
      <div className="shrink-0">
        {info ? (
          <info.Icon className={`h-10 w-10 ${info.color}`} />
        ) : (
          <Pulse w="w-10" h="h-10" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-0.5">
          {CITY}
        </p>
        {data ? (
          <>
            <p className="text-2xl font-bold tabular-nums leading-none">
              {data.temperature}°C
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {info?.label} · 💨 {data.windspeed} km/h
            </p>
          </>
        ) : (
          <div className="space-y-1.5 mt-1">
            <Pulse w="w-20" h="h-6" />
            <Pulse w="w-28" />
          </div>
        )}
      </div>
    </div>
  );
}

// ── LG — tarjeta centrada ─────────────────────────────────────────────────────

function VariantLG() {
  const { data, error } = useWeather();
  if (error) return null;
  const info = data ? weatherInfo(data.weathercode) : null;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
      <div className="px-5 pt-5 pb-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
          Clima actual
        </p>
        <p className="text-sm font-bold mt-0.5">{CITY}</p>
      </div>

      <div className="flex flex-col items-center justify-center py-6 px-5 gap-3">
        {info ? (
          <info.Icon className={`h-14 w-14 ${info.color}`} />
        ) : (
          <Pulse w="w-14" h="h-14" />
        )}
        {data ? (
          <>
            <p className="text-5xl font-bold tabular-nums tracking-tight">
              {data.temperature}°
              <span className="text-2xl text-muted-foreground">C</span>
            </p>
            <p className="text-sm text-muted-foreground font-medium">
              {info?.label}
            </p>
          </>
        ) : (
          <div className="space-y-2 items-center flex flex-col">
            <Pulse w="w-24" h="h-12" />
            <Pulse w="w-20" />
          </div>
        )}
      </div>

      {data && (
        <div className="border-t border-border/50 px-5 py-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Wind className="h-3.5 w-3.5 shrink-0" />
          <span>Viento {data.windspeed} km/h</span>
        </div>
      )}
    </div>
  );
}

// ── XL — tarjeta con fondo de color ───────────────────────────────────────────

function VariantXL() {
  const { data, error } = useWeather();
  if (error) return null;
  const info = data ? weatherInfo(data.weathercode) : null;

  const isSunny = data && data.weathercode === 0;
  const isRainy = data && data.weathercode >= 51 && data.weathercode <= 82;
  const gradientClass = isSunny
    ? "from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20"
    : isRainy
      ? "from-blue-50 to-slate-50 dark:from-blue-950/30 dark:to-slate-950/20"
      : "from-muted/30 to-muted/10";

  return (
    <div
      className={`bg-gradient-to-br ${gradientClass} border border-border rounded-xl overflow-hidden flex flex-col`}
    >
      <div className="px-6 pt-5 pb-2 flex items-start justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            Clima actual
          </p>
          <p className="text-base font-bold mt-0.5">{CITY}</p>
          <p className="text-[10px] text-muted-foreground">
            Santiago del Estero, Argentina
          </p>
        </div>
        {info && <info.Icon className={`h-8 w-8 ${info.color} opacity-60`} />}
      </div>

      <div className="px-6 py-6 flex items-end gap-4">
        {info ? (
          <info.Icon className={`h-16 w-16 ${info.color} shrink-0`} />
        ) : (
          <Pulse w="w-16" h="h-16" />
        )}
        <div>
          {data ? (
            <>
              <p className="text-6xl font-bold tabular-nums leading-none">
                {data.temperature}°
              </p>
              <p className="text-sm text-muted-foreground font-medium mt-1">
                {info?.label}
              </p>
            </>
          ) : (
            <div className="space-y-2">
              <Pulse w="w-28" h="h-14" />
              <Pulse w="w-20" />
            </div>
          )}
        </div>
      </div>

      {data && (
        <div className="border-t border-border/40 px-6 py-3 flex items-center gap-4 text-xs text-muted-foreground bg-background/20">
          <span className="flex items-center gap-1.5">
            <Wind className="h-3.5 w-3.5 shrink-0" />
            Viento {data.windspeed} km/h
          </span>
          <span className="text-muted-foreground/50">·</span>
          <span>
            {new Date().toLocaleTimeString("es-AR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Export — variant via data._variant ("xs"|"sm"|"md"|"lg"|"xl") ─────────────

export default function WidgetClima({
  data,
  variant,
}: {
  data: Record<string, unknown>;
  variant?: "xs" | "sm" | "md" | "lg" | "xl";
}) {
  const finalVariant = (
    variant ??
    (data._variant as string) ??
    "md"
  ).toLowerCase();

  if (finalVariant === "xs") return <VariantXS />;
  if (finalVariant === "sm") return <VariantSM />;
  if (finalVariant === "lg") return <VariantLG />;
  if (finalVariant === "xl") return <VariantXL />;
  return <VariantMD />;
}

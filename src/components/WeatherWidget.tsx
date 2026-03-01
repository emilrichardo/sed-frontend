"use client";

import { useEffect, useState } from "react";
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning } from "lucide-react";

interface WeatherData {
  temperature: number;
  windspeed: number;
  weathercode: number;
}

function getWeatherInfo(code: number): { label: string; Icon: React.ElementType; color: string } {
  if (code === 0) return { label: "Despejado", Icon: Sun, color: "text-yellow-500" };
  if (code <= 3) return { label: "Parcialmente nublado", Icon: Cloud, color: "text-gray-400" };
  if (code <= 48) return { label: "Nublado", Icon: Cloud, color: "text-gray-500" };
  if (code <= 67) return { label: "Lluvia", Icon: CloudRain, color: "text-blue-500" };
  if (code <= 77) return { label: "Nieve", Icon: CloudSnow, color: "text-blue-300" };
  if (code <= 82) return { label: "Llovizna", Icon: CloudRain, color: "text-blue-400" };
  if (code <= 99) return { label: "Tormenta", Icon: CloudLightning, color: "text-purple-500" };
  return { label: "Variable", Icon: Cloud, color: "text-gray-400" };
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=-27.7951&longitude=-64.2615&current=temperature_2m,weathercode,windspeed_10m&timezone=America%2FArgentina%2FBuenos_Aires"
    )
      .then((r) => r.json())
      .then((data) => {
        setWeather({
          temperature: Math.round(data.current.temperature_2m),
          windspeed: Math.round(data.current.windspeed_10m),
          weathercode: data.current.weathercode,
        });
      })
      .catch(() => setError(true));
  }, []);

  if (error) return null;

  const info = weather ? getWeatherInfo(weather.weathercode) : null;

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded border bg-card text-[10px] shrink-0">
      {info ? (
        <info.Icon className={`h-3 w-3 shrink-0 ${info.color}`} />
      ) : (
        <div className="h-3 w-3 bg-muted rounded-full animate-pulse shrink-0" />
      )}
      <span className="font-semibold text-muted-foreground">Sgo. del Estero</span>
      {weather ? (
        <>
          <span className="text-muted-foreground">·</span>
          <span className="font-bold">{weather.temperature}°C</span>
          <span className="text-muted-foreground hidden sm:inline">· {info?.label}</span>
        </>
      ) : (
        <div className="h-2.5 w-8 bg-muted rounded animate-pulse" />
      )}
    </div>
  );
}

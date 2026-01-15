import React from "react";
import BulletinArchiveContainer from "@/components/BulletinArchiveContainer";

export const metadata = {
  title: "Archivo de Boletines Oficiales | Santiago en Datos",
  description:
    "Consulta el archivo histórico de boletines oficiales y actos administrativos.",
};

export default function BoletinPage() {
  return (
    <main className="container mx-auto px-4 py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
          Boletín Oficial
        </h1>
        <p className="text-xl text-muted-foreground">
          Acceso centralizado a la normativa y actos administrativos oficiales.
        </p>
      </div>

      <BulletinArchiveContainer />
    </main>
  );
}

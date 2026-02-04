import React from "react";
import BulletinArchiveContainer from "@/components/BulletinArchiveContainer";
import { PageHeader } from "@/components/PageHeader";
import { FileText } from "lucide-react";

export const metadata = {
  title: "Archivo de Boletines Oficiales | Santiago en Datos",
  description:
    "Consulta el archivo histórico de boletines oficiales y actos administrativos.",
};

export default function BoletinPage() {
  return (
    <main className="container mx-auto px-4 py-8 md:py-12 space-y-8">
      <PageHeader
        title="Boletín Oficial"
        description="Acceso centralizado a la normativa y actos administrativos oficiales."
        icon={FileText}
      />

      <BulletinArchiveContainer />
    </main>
  );
}

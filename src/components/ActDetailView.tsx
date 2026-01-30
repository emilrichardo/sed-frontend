"use client";

import Link from "next/link";
import {
  ChevronLeft,
  Building2,
  FileTextIcon,
  Star,
  PenTool,
  Info,
  User,
  Briefcase,
} from "lucide-react";
import { ActoAdministrativo, updateActoAdministrativo } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { SimpleTooltip } from "@/components/ui/simple-tooltip";
import { ProcessingButton } from "@/components/ProcessingButton";

interface ActDetailViewProps {
  entry: ActoAdministrativo;
  backLink: string;
}

export function ActDetailView({ entry, backLink }: ActDetailViewProps) {
  const { isEditing } = useAuth();
  const [isDestacado, setIsDestacado] = useState(entry.destacado || false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const toggleDestacado = async () => {
    const newState = !isDestacado;
    setIsDestacado(newState); // Optimistic
    try {
      await updateActoAdministrativo(entry.id, { destacado: newState });
    } catch (error) {
      console.error("Failed to update destacado:", error);
      setIsDestacado(!newState); // Revert
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in duration-500">
      <div className="mb-6">
        <Link
          href={backLink}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver al Boletín
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Main Content Column */}
        <div className="lg:col-span-8 space-y-10">
          {/* Header Section */}
          <section className="space-y-6">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-4 w-full">
                {/* Journalistic Title or Fallback */}
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
                  {entry.titulo_periodistico ||
                    entry.titulo ||
                    "Acto Administrativo"}
                </h1>

                {/* Tags row */}
                <div className="flex flex-wrap gap-2">
                  <span className="px-2.5 py-0.5 bg-primary text-primary-foreground text-xs font-bold border-2 border-primary uppercase tracking-wide">
                    {entry.seccion}
                  </span>
                  {entry.tipo_de_acto && (
                    <span className="px-2.5 py-0.5 bg-muted text-muted-foreground text-xs font-bold border-2 border-transparent uppercase tracking-wide">
                      {typeof entry.tipo_de_acto === "object"
                        ? entry.tipo_de_acto.nombre
                        : "Acto"}
                    </span>
                  )}
                  {isEditing && (
                    <button
                      onClick={toggleDestacado}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-0.5 border-2 border-black text-xs font-bold transition-all hover:bg-black hover:text-white uppercase tracking-wider",
                        isDestacado
                          ? "bg-black text-white"
                          : "bg-white text-black",
                      )}
                    >
                      <Star
                        className={cn("h-3 w-3", isDestacado && "fill-current")}
                      />
                      {isDestacado ? "Destacado" : "Destacar"}
                    </button>
                  )}
                  {isEditing && (
                    <div className="ml-2">
                      <ProcessingButton
                        relationTo="actos-administrativos"
                        relatedId={entry.id}
                        existingProcessingId={
                          entry.procesamiento_asociado &&
                          entry.procesamiento_asociado.length > 0
                            ? typeof entry.procesamiento_asociado[0] ===
                              "string"
                              ? entry.procesamiento_asociado[0]
                              : entry.procesamiento_asociado[0].id
                            : undefined
                        }
                        className="h-7 text-xs px-3"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Resume / Summary */}
            {entry.resumen && (
              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed font-serif border-l-4 border-primary/20 pl-4 py-1">
                {entry.resumen}
              </p>
            )}
          </section>

          {/* Journalistic Note */}
          {entry.nota_periodistica && (
            <section className="bg-muted p-6 border-2 border-black">
              <h3 className="text-lg font-bold flex items-center gap-2 text-foreground mb-4 uppercase tracking-tight">
                <PenTool className="h-5 w-5" />
                Análisis Periodístico
              </h3>
              <div className="prose prose-neutral dark:prose-invert max-w-none font-mono leading-relaxed text-sm">
                <div className="whitespace-pre-wrap">
                  {entry.nota_periodistica}
                </div>
              </div>
            </section>
          )}

          {/* Full Text / Cuerpo */}
          <section className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-foreground/80 border-b pb-2">
              <FileTextIcon className="h-5 w-5" />
              Texto Oficial Completo
            </h3>

            <div className="prose prose-gray md:prose-lg max-w-none text-foreground/90 font-serif">
              {entry.cuerpo ? (
                <div className="whitespace-pre-line leading-relaxed">
                  {(() => {
                    // Fix line breaks: replace single newlines with space, keep double newlines
                    const text = entry.cuerpo;
                    return text.replace(/(?<!\n)\n(?!\n)/g, " ");
                  })()}
                </div>
              ) : (
                <div className="p-8 text-center bg-muted/20 rounded-lg border border-dashed">
                  <span className="text-muted-foreground italic">
                    Sin contenido de texto completo disponible.
                  </span>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar Column */}
        <aside className="lg:col-span-4 space-y-8">
          {/* Metadata Card */}
          <div className="bg-card border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <div className="bg-muted/30 px-4 py-3 border-b flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Información del Acto</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">
                  Identificador
                </label>
                <code className="text-xs bg-muted px-2 py-1 block w-full break-all font-mono border border-black/10">
                  {entry.identificador_de_acto}
                </code>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">
                    Fecha
                  </label>
                  <span className="text-sm font-medium block">
                    {typeof entry.boletin === "object"
                      ? formatDate(entry.boletin.fecha_publicacion)
                      : "N/A"}
                  </span>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">
                    Páginas
                  </label>
                  <span className="text-sm font-medium block">
                    {entry.paginas || "-"}
                  </span>
                </div>
              </div>

              {entry.jurisdiccion && (
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">
                    Jurisdicción
                  </label>
                  <span className="text-sm font-medium block">
                    {typeof entry.jurisdiccion === "object"
                      ? entry.jurisdiccion.nombre
                      : entry.jurisdiccion}
                  </span>
                </div>
              )}

              {entry.nivel_opacidad !== undefined && (
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">
                    Nivel de Opacidad
                  </label>
                  <span
                    className={`inline-flex items-center px-2 py-1 text-xs font-bold border-2 ${
                      entry.nivel_opacidad === "Transparente"
                        ? "bg-white text-black border-black"
                        : entry.nivel_opacidad === "Parcial"
                          ? "bg-gray-200 text-black border-black"
                          : "bg-black text-white border-black"
                    }`}
                  >
                    {entry.nivel_opacidad}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Related Entities Tables - Split by Type */}
          {entry.entidades_relacionadas &&
            entry.entidades_relacionadas.length > 0 && (
              <>
                {/* Organismos */}
                {(() => {
                  const items = entry.entidades_relacionadas?.filter(
                    (e) => e.tipo?.toLowerCase() === "organismo",
                  );
                  if (!items || items.length === 0) return null;
                  return (
                    <div className="bg-card border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden mb-4">
                      <div className="bg-muted/30 px-4 py-3 border-b flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold text-sm">
                          Organismos Relacionados
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <tbody className="divide-y">
                            {items.map((entidad, idx) => (
                              <tr
                                key={entidad.id || idx}
                                className="hover:bg-muted/10"
                              >
                                <td className="px-3 py-2 font-medium truncate max-w-[200px]">
                                  <SimpleTooltip
                                    content={
                                      <div className="space-y-1">
                                        <p className="font-bold text-sm border-b pb-1 mb-1">
                                          {entidad.nombre}
                                        </p>
                                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
                                          <span className="text-muted-foreground">
                                            Tipo:
                                          </span>
                                          <span className="capitalize">
                                            {entidad.tipo}
                                          </span>
                                          <span className="text-muted-foreground">
                                            ID:
                                          </span>
                                          <span className="font-mono">
                                            {entidad.id}
                                          </span>
                                        </div>
                                      </div>
                                    }
                                  >
                                    {entidad.nombre}
                                  </SimpleTooltip>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}

                {/* Personas / Humanos */}
                {(() => {
                  const items = entry.entidades_relacionadas?.filter(
                    (e) =>
                      e.tipo?.toLowerCase() === "humano" ||
                      e.tipo?.toLowerCase() === "persona",
                  );
                  if (!items || items.length === 0) return null;
                  return (
                    <div className="bg-card border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden mb-4">
                      <div className="bg-muted/30 px-4 py-3 border-b flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold text-sm">
                          Personas Relacionadas
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <tbody className="divide-y">
                            {items.map((entidad, idx) => (
                              <tr
                                key={entidad.id || idx}
                                className="hover:bg-muted/10"
                              >
                                <td className="px-3 py-2 font-medium truncate max-w-[200px]">
                                  <SimpleTooltip
                                    content={
                                      <div className="space-y-1">
                                        <p className="font-bold text-sm border-b pb-1 mb-1">
                                          {entidad.nombre}
                                        </p>
                                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
                                          <span className="text-muted-foreground">
                                            Tipo:
                                          </span>
                                          <span className="capitalize">
                                            {entidad.tipo}
                                          </span>
                                          <span className="text-muted-foreground">
                                            ID:
                                          </span>
                                          <span className="font-mono">
                                            {entidad.id}
                                          </span>
                                        </div>
                                      </div>
                                    }
                                  >
                                    {entidad.nombre}
                                  </SimpleTooltip>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}

                {/* Empresas */}
                {(() => {
                  const items = entry.entidades_relacionadas?.filter(
                    (e) => e.tipo?.toLowerCase() === "empresa",
                  );
                  if (!items || items.length === 0) return null;
                  return (
                    <div className="bg-card border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden mb-4">
                      <div className="bg-muted/30 px-4 py-3 border-b flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold text-sm">
                          Empresas Relacionadas
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <tbody className="divide-y">
                            {items.map((entidad, idx) => (
                              <tr
                                key={entidad.id || idx}
                                className="hover:bg-muted/10"
                              >
                                <td className="px-3 py-2 font-medium truncate max-w-[200px]">
                                  <SimpleTooltip
                                    content={
                                      <div className="space-y-1">
                                        <p className="font-bold text-sm border-b pb-1 mb-1">
                                          {entidad.nombre}
                                        </p>
                                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
                                          <span className="text-muted-foreground">
                                            Tipo:
                                          </span>
                                          <span className="capitalize">
                                            {entidad.tipo}
                                          </span>
                                          <span className="text-muted-foreground">
                                            ID:
                                          </span>
                                          <span className="font-mono">
                                            {entidad.id}
                                          </span>
                                        </div>
                                      </div>
                                    }
                                  >
                                    {entidad.nombre}
                                  </SimpleTooltip>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}

                {/* Otros - Fallback for any leftovers */}
                {(() => {
                  const knownTypes = [
                    "organismo",
                    "humano",
                    "persona",
                    "empresa",
                  ];
                  const items = entry.entidades_relacionadas?.filter(
                    (e) => !knownTypes.includes(e.tipo?.toLowerCase() || ""),
                  );
                  if (!items || items.length === 0) return null;
                  return (
                    <div className="bg-card border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden mb-4">
                      <div className="bg-muted/30 px-4 py-3 border-b flex items-center gap-2">
                        <Info className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold text-sm">
                          Otras Entidades
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <tbody className="divide-y">
                            {items.map((entidad, idx) => (
                              <tr
                                key={entidad.id || idx}
                                className="hover:bg-muted/10"
                              >
                                <td className="px-3 py-2 font-medium truncate max-w-[200px]">
                                  {entidad.nombre}
                                </td>
                                <td className="px-3 py-2 text-muted-foreground capitalize">
                                  {entidad.tipo}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </>
            )}

          {/* Related References Table */}
          {entry.referencias_relacionadas &&
            entry.referencias_relacionadas.length > 0 && (
              <div className="bg-card border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                <div className="bg-muted/30 px-4 py-3 border-b flex items-center gap-2">
                  <FileTextIcon className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold text-sm">
                    Normativa Referenciada
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/20 text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">
                          Valor
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          Tipo
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {entry.referencias_relacionadas.map((ref, idx) => (
                        <tr key={ref.id || idx} className="hover:bg-muted/10">
                          <td className="px-3 py-2 font-mono text-muted-foreground truncate max-w-[150px]">
                            <SimpleTooltip
                              content={
                                <div className="space-y-1">
                                  <p className="font-bold text-xs border-b pb-1 mb-1 break-all">
                                    {ref.valor}
                                  </p>
                                  <div className="space-y-1 text-[10px]">
                                    <div className="flex gap-2">
                                      <span className="text-muted-foreground">
                                        Tipo:
                                      </span>
                                      <span className="capitalize">
                                        {ref.tipo}
                                      </span>
                                    </div>
                                    {typeof ref.descripcion === "string" && (
                                      <div>
                                        <span className="text-muted-foreground block">
                                          Descripción:
                                        </span>
                                        <p className="italic text-foreground/80">
                                          {ref.descripcion}
                                        </p>
                                      </div>
                                    )}
                                    <div className="pt-2">
                                      <Link
                                        href={`/boletines?search=${ref.valor}`}
                                        className="text-blue-500 hover:underline flex items-center gap-1"
                                      >
                                        <Info className="h-3 w-3" />
                                        Buscar Referencia
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              }
                            >
                              {ref.valor}
                            </SimpleTooltip>
                          </td>
                          <td className="px-3 py-2 capitalize">{ref.tipo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
        </aside>
      </div>
    </main>
  );
}

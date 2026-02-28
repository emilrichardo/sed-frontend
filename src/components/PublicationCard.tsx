"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ChevronRight,
  type LucideIcon,
  BarChart2,
  Newspaper,
  TrendingUp,
  FileText,
  BookOpen,
} from "lucide-react";
import type { ReportItem } from "@/lib/api";
import { PublicationTableSlider } from "@/components/PublicationTableSlider";
import { extractAllTablaBlocks, shouldShowChart } from "@/utils/publicacion";

// ── Helpers ──────────────────────────────────────────────────────────────────

type TaxItem = { id: string | number; nombre: string; slug?: string };

function getTipoIcon(tp: ReportItem["tipo_publicacion"]): {
  Icon: LucideIcon;
  label: string;
} {
  const obj = tp && typeof tp === "object" ? tp : null;
  const text = (obj?.slug ?? obj?.nombre ?? "").toLowerCase();
  if (text.includes("estadistica") || text.includes("estadística"))
    return { Icon: BarChart2, label: obj!.nombre };
  if (text.includes("boletin") || text.includes("boletín"))
    return { Icon: Newspaper, label: obj!.nombre };
  if (text.includes("analisis") || text.includes("análisis"))
    return { Icon: TrendingUp, label: obj!.nombre };
  if (text.includes("informe")) return { Icon: FileText, label: obj!.nombre };
  if (obj?.nombre) return { Icon: BookOpen, label: obj.nombre };
  return { Icon: BookOpen, label: "Publicación" };
}

function getDescription(item: ReportItem): string {
  const contenido = item.contenido as {
    root?: {
      children?: Array<{
        children?: Array<{ text?: string }>;
      }>;
    };
  };
  if (contenido?.root?.children) {
    const firstParagraph = contenido.root.children.find(
      (child) =>
        child.children && child.children.length > 0 && child.children[0]?.text,
    );
    if (firstParagraph) return firstParagraph.children![0].text || "";
  }
  return "";
}

function getItemTags(item: ReportItem) {
  const cats = (item.categorias as TaxItem[]) || [];
  const tags = (item.tags as TaxItem[]) || [];
  const taxs = (item.taxonomias as TaxItem[]) || [];
  return [...cats, ...tags, ...taxs];
}

// ── Component ────────────────────────────────────────────────────────────────

export interface PublicationCardProps {
  item: ReportItem & { parentTitle?: string };
  /** "wide" = desktop large, "compact" = mobile small, "link" = text-only link */
  variant?: "wide" | "compact" | "link";
  showParent?: boolean;
}

/**
 * Unified publication card used across the entire app.
 * - `wide`: Full horizontal card (text left, image/chart right). Default on desktop.
 * - `compact`: Reduced row (text left, small image right). Default on mobile.
 * - `link`: Text-only link with date. Used for related publications.
 */
export function PublicationCard({
  item,
  variant = "wide",
  showParent = true,
}: PublicationCardProps) {
  if (variant === "link") return <LinkVariant item={item} />;
  if (variant === "compact")
    return <CompactVariant item={item} showParent={showParent} />;
  return <WideVariant item={item} showParent={showParent} />;
}

// ── Link variant ─────────────────────────────────────────────────────────────

function LinkVariant({ item }: { item: ReportItem }) {
  const date = item.publishedDate || item.createdAt;
  return (
    <Link
      href={`/publicaciones/${item.slug}`}
      className="block p-4 border bg-card hover:bg-muted/50 transition-colors group rounded-lg"
    >
      <h4 className="font-bold text-base group-hover:text-primary leading-tight line-clamp-2">
        {item.titulo}
      </h4>
      {date && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          {new Date(date).toLocaleDateString("es-AR", {
            year: "numeric",
            month: "long",
          })}
        </p>
      )}
    </Link>
  );
}

// ── Compact variant (mobile) ─────────────────────────────────────────────────

function CompactVariant({
  item,
  showParent,
}: {
  item: ReportItem & { parentTitle?: string };
  showParent: boolean;
}) {
  const date = item.publishedDate || item.createdAt;
  const img = item.imagen_destacada as
    | { url?: string; alt?: string }
    | undefined;
  const tags = getItemTags(item);

  return (
    <Link
      href={`/publicaciones/${item.slug}`}
      className="group flex items-stretch gap-3 rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-all"
    >
      {/* Text side */}
      <div className="flex-1 p-3 flex flex-col justify-center min-w-0">
        {showParent && item.parentTitle && (
          <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-0.5 truncate">
            <span className="truncate">{item.parentTitle}</span>
            <ChevronRight className="h-2.5 w-2.5 shrink-0" />
          </p>
        )}

        <h3 className="font-bold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
          {item.titulo}
        </h3>

        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
          {tags.slice(0, 2).map((t) => (
            <span
              key={t.id}
              className="px-1.5 py-0.5 bg-muted rounded text-[9px] text-muted-foreground"
            >
              {t.nombre}
            </span>
          ))}
          {date && (
            <span className="text-[10px] text-muted-foreground">
              {new Date(date).toLocaleDateString("es-AR", {
                year: "numeric",
                month: "short",
              })}
            </span>
          )}
        </div>
      </div>

      {/* Image side */}
      <div className="w-24 shrink-0 relative bg-muted overflow-hidden">
        {img?.url ? (
          <Image
            src={img.url}
            alt={img.alt || item.titulo}
            fill
            unoptimized
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="96px"
          />
        ) : (
          (() => {
            const { Icon, label } = getTipoIcon(item.tipo_publicacion);
            return (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-muted/60">
                <Icon
                  className="h-8 w-8 text-muted-foreground/25"
                  strokeWidth={1}
                />
                <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-muted-foreground/40">
                  {label}
                </span>
              </div>
            );
          })()
        )}
      </div>
    </Link>
  );
}

// ── Wide variant (desktop) ───────────────────────────────────────────────────

function WideVariant({
  item,
  showParent,
}: {
  item: ReportItem & { parentTitle?: string };
  showParent: boolean;
}) {
  const description = getDescription(item);
  const date = item.publishedDate || item.createdAt;
  const img = item.imagen_destacada as
    | { url?: string; alt?: string }
    | undefined;
  const tags = getItemTags(item);

  const useChart = shouldShowChart(item);
  const tablaBlocks = useChart ? extractAllTablaBlocks(item.contenido) : [];
  const hasTables = tablaBlocks.length > 0;

  return (
    <div className="group rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-all">
      <div className="flex flex-col lg:flex-row min-h-[320px]">
        {/* Content (Left) */}
        <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
          {showParent && item.parentTitle && (
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <span className="truncate">{item.parentTitle}</span>
              <ChevronRight className="h-3 w-3 shrink-0" />
            </p>
          )}

          <h3 className="font-bold text-xl md:text-2xl lg:text-4xl leading-tight group-hover:text-primary transition-colors">
            <Link
              href={`/publicaciones/${item.slug}`}
              className="hover:underline"
            >
              {item.titulo}
            </Link>
          </h3>

          {description && (
            <p className="mt-4 text-sm md:text-base text-muted-foreground line-clamp-4 leading-relaxed">
              {description}
            </p>
          )}

          <div className="mt-6 flex items-center justify-between gap-4">
            <div className="flex gap-1.5 flex-wrap">
              {tags.slice(0, 3).map((t) => (
                <span
                  key={t.id}
                  className="px-2 py-0.5 bg-muted rounded text-[11px] font-medium text-muted-foreground"
                >
                  {t.nombre}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-4">
              {date && (
                <span className="text-xs text-muted-foreground whitespace-nowrap border-l pl-4 border-border hidden sm:block">
                  {new Date(date).toLocaleDateString("es-AR", {
                    year: "numeric",
                    month: "long",
                  })}
                </span>
              )}
              <Link
                href={`/publicaciones/${item.slug}`}
                className="text-sm font-bold text-primary flex items-center gap-1 group/link"
              >
                Ver más
                <ChevronRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>

        {/* Media (Right) */}
        <div className="lg:w-[45%] xl:w-[50%] shrink-0 bg-background border-t lg:border-t-0 lg:border-l border-border relative overflow-hidden flex items-center justify-center h-[260px] lg:h-auto lg:self-stretch">
          {!useChart && img?.url ? (
            <>
              <div className="absolute inset-0">
                <Image
                  src={img.url}
                  alt={img.alt || item.titulo}
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              <Link
                href={`/publicaciones/${item.slug}`}
                className="absolute inset-0 z-10"
                aria-label={`Ver ${item.titulo}`}
              />
            </>
          ) : hasTables ? (
            <div className="w-full h-full p-4">
              <PublicationTableSlider blocks={tablaBlocks.slice(0, 1)} />
            </div>
          ) : (
            (() => {
              const { Icon, label } = getTipoIcon(item.tipo_publicacion);
              return (
                <div className="flex flex-col items-center justify-center gap-4 p-12 bg-muted/20">
                  <Icon
                    className="h-20 w-20 text-muted-foreground/20"
                    strokeWidth={1}
                  />
                  <span className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground/30">
                    {label}
                  </span>
                </div>
              );
            })()
          )}
        </div>
      </div>
    </div>
  );
}

// ── Responsive card — auto-selects compact on mobile, wide on desktop ────────

export function ResponsivePublicationCard(props: PublicationCardProps) {
  return (
    <>
      {/* Mobile: compact */}
      <div className="block md:hidden">
        <PublicationCard {...props} variant="compact" />
      </div>
      {/* Desktop: wide */}
      <div className="hidden md:block">
        <PublicationCard {...props} variant={props.variant ?? "wide"} />
      </div>
    </>
  );
}

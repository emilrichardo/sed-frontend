"use client";

// Re-export from the unified PublicationCard for backwards compatibility
import { ResponsivePublicationCard } from "@/components/PublicationCard";
import type { PublicationCardProps } from "@/components/PublicationCard";

export type WideCardProps = PublicationCardProps;

/**
 * @deprecated Use `PublicationCard` or `ResponsivePublicationCard` directly.
 * This wrapper is kept for backwards compatibility.
 */
export function WideCard(props: WideCardProps) {
  return <ResponsivePublicationCard {...props} />;
}

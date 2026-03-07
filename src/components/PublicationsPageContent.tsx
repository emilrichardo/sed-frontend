"use client";

import { FeaturedPublicationsSlider } from "@/components/FeaturedPublicationsSlider";
import type { FeaturedPublicationNode } from "@/components/FeaturedPublicationsSlider";
import { PublicationsList } from "@/components/PublicationsList";
import type { FlatPublication } from "@/components/PublicationsList";

type TaxItem = { id: string | number; nombre: string; slug?: string };

interface Props {
  featuredItems: FeaturedPublicationNode[];
  flatItems: FlatPublication[];
  allCategories: TaxItem[];
}

export function PublicationsPageContent({ featuredItems, flatItems, allCategories }: Props) {
  return (
    <div className="max-w-[960px] mx-auto space-y-8">
      {featuredItems.length > 0 && (
        <section className="animate-in fade-in slide-in-from-top-4 duration-700">
          <FeaturedPublicationsSlider items={featuredItems} />
        </section>
      )}

      <PublicationsList items={flatItems} allCategories={allCategories} />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  CategoryBrowser,
  type CategoryWithChildren,
} from "@/components/CategoryBrowser";
import type { Category } from "@/lib/api";

interface Props {
  /** Root categories (may not have children yet) */
  rootCategories: Category[];
}

export function HomeCategoriesSection({ rootCategories }: Props) {
  const [categoryTree, setCategoryTree] = useState<CategoryWithChildren[]>([]);
  const [openCat, setOpenCat] = useState<CategoryWithChildren | null>(null);

  // Fetch full tree with children on mount
  useEffect(() => {
    fetch(
      "/api-proxy/taxonomias?limit=100&depth=1&where[tipo][equals]=categoria&sort=nombre",
    )
      .then((r) => r.json())
      .then((data) => {
        const all: Category[] = data.docs || [];
        const roots = all.filter((c) => !c.parent);
        const childrenList = all.filter((c) => c.parent);
        const tree: CategoryWithChildren[] = roots.map((root) => ({
          ...root,
          children: childrenList.filter((c) => {
            const pid =
              typeof c.parent === "object"
                ? (c.parent as Category)?.id
                : c.parent;
            return String(pid) === String(root.id);
          }),
        }));
        setCategoryTree(tree);
      })
      .catch(() => {
        // Fallback: use rootCategories without children
        setCategoryTree(rootCategories.map((c) => ({ ...c, children: [] })));
      });
  }, [rootCategories]);

  // Display list (use rootCategories while tree is loading for instant render)
  const displayList =
    categoryTree.length > 0
      ? categoryTree
      : rootCategories.map((c) => ({ ...c, children: [] }));

  return (
    <>
      <nav
        className="-mx-4 md:-mx-8 border-b border-border"
        aria-label="Categorías principales"
      >
        {displayList.map((cat) => (
          <div
            key={cat.id}
            className="border-t border-border flex items-stretch"
          >
            {/* Category name → opens preview overlay */}
            <button
              onClick={() => {
                const full = categoryTree.find((c) => String(c.id) === String(cat.id));
                setOpenCat(full ?? cat);
              }}
              className="flex-1 flex items-center px-4 md:px-8 py-5 hover:bg-muted/50 transition-colors group text-left min-w-0"
            >
              <span className="text-2xl md:text-3xl font-heading font-bold tracking-tight group-hover:text-primary transition-colors">
                {cat.nombre}
              </span>
            </button>

            {/* Arrow → navigates directly to category page */}
            <Link
              href={`/categorias/${cat.slug}`}
              className="flex items-center justify-center px-5 md:px-8 border-l border-border hover:bg-muted/50 transition-colors shrink-0 group"
              title={`Ir a ${cat.nombre}`}
            >
              <ArrowUpRight className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          </div>
        ))}
      </nav>

      {/* Full-screen overlay when a category row is clicked */}
      {openCat && (
        <CategoryBrowser
          categories={categoryTree}
          initialCategory={openCat}
          onClose={() => setOpenCat(null)}
        />
      )}
    </>
  );
}

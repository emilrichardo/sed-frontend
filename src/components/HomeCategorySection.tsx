"use client";

import { CategoryMenu } from "@/components/CategoryMenu";
import type { CategoryWithChildren } from "@/components/CategoryMenu";

interface Props {
  categories: CategoryWithChildren[];
}

/**
 * Thin client wrapper so the shared CategoryMenu can be used
 * inside the server-rendered Home page.
 */
export function HomeCategorySection({ categories }: Props) {
  return <CategoryMenu categories={categories} isDrawer={false} />;
}

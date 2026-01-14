import { notFound } from "next/navigation";

const API_URL = "http://localhost:3000/api";

export interface PayloadBlock {
  blockType: string;
  id: string;
  [key: string]: any;
}

export interface NewsItem {
  id: number;
  titulo: string;
  slug: string;
  publishedDate?: string;
  layout?: PayloadBlock[];
  contenido?: any;
  [key: string]: any;
}

export interface PayloadResponse<T> {
  docs: T[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
}

export async function getNews(): Promise<PayloadResponse<NewsItem>> {
  try {
    const res = await fetch(`${API_URL}/noticias?depth=1&draft=false`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch news");
    }

    return res.json();
  } catch (error) {
    console.error("Error fetching news:", error);
    return {
      docs: [],
      totalDocs: 0,
      limit: 10,
      totalPages: 0,
      page: 1,
      pagingCounter: 0,
      hasPrevPage: false,
      hasNextPage: false,
      prevPage: null,
      nextPage: null,
    };
  }
}

export async function getNewsItem(slug: string): Promise<NewsItem | null> {
  try {
    // Search by slug
    const res = await fetch(
      `${API_URL}/noticias?where[slug][equals]=${slug}&depth=2&draft=false`,
      {
        next: { revalidate: 60 },
      }
    );

    if (!res.ok) {
      return null;
    }

    const data: PayloadResponse<NewsItem> = await res.json();

    if (data.docs.length === 0) {
      return null;
    }

    return data.docs[0];
  } catch (error) {
    console.error(`Error fetching news item ${slug}:`, error);
    return null;
  }
}

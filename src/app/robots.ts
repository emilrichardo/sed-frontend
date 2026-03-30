import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
  "https://santiagoendatos.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // All crawlers (including AI agents like GPTBot, Claude-Web, Googlebot)
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/"],
      },
      {
        // Explicitly allow AI crawlers to consume the Markdown endpoints
        userAgent: [
          "GPTBot",
          "Claude-Web",
          "anthropic-ai",
          "Google-Extended",
          "PerplexityBot",
          "YouBot",
          "CCBot",
          "cohere-ai",
        ],
        allow: ["/publicaciones/", "/publicaciones/*/md"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

import type { NextConfig } from "next";

// If NEXT_PUBLIC_PAYLOAD_API_URL points to an external domain, the browser needs
// to be allowed to connect to it (client components fetch actos, etc.)
const payloadPublicUrl = process.env.NEXT_PUBLIC_PAYLOAD_API_URL
  ? process.env.NEXT_PUBLIC_PAYLOAD_API_URL.replace(/\/+$/, "")
  : null;

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      `connect-src 'self' https://api.open-meteo.com https://dolarapi.com${payloadPublicUrl ? ` ${payloadPublicUrl}` : ""}`,
      "frame-src 'self' blob: https: http://127.0.0.1:54321",
      "worker-src 'self' blob: https://unpkg.com",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/storage/**",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  async rewrites() {
    return [
      {
        source: "/api-proxy/:path*",
        destination: `${(process.env.PAYLOAD_API_URL || "http://localhost:3000").replace(/\/+$/, "")}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api-proxy/:path*",
        destination: `${process.env.NEXT_PUBLIC_PAYLOAD_API_URL || "http://localhost:3000"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

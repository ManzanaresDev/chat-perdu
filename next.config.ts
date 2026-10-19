// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
images: {
  // Autorise les adresses non classiques (NAT64, IPv6) uniquement en local
  dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
  remotePatterns: [
    { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
  ],
},
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
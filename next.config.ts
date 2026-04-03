import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "8v6qfutk2bxqslae.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "7lisadzjl63dspu3.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "relaxproperties.sk",
      },
    ],
  },
  experimental: {
    staleTimes: {
      dynamic: 300,
      static: 600,
    },
  },
};

export default nextConfig;

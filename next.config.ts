import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Vercel Blob serves images from this host; allow them through next/image
    // (we mostly use plain <img>, but this keeps next/image usable too).
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;

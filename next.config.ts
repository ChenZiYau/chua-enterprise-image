import type { NextConfig } from "next";

// Baseline security headers for every response.
const securityHeaders = [
  // Never render inside someone else's frame (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Don't sniff content types.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send no referrer to other origins.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // This app needs none of these browser features.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  images: {
    // Vercel Blob serves images from this host; allow them through next/image
    // (we mostly use plain <img>, but this keeps next/image usable too).
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;

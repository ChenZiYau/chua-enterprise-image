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

// The dashboard's Share page previews galleries inside an iframe, so /p/*
// allows framing by the dashboard origin (MAIN_APP_URL) and local dev only.
// frame-ancestors supersedes X-Frame-Options in every modern browser.
const dashboardOrigin = (process.env.MAIN_APP_URL ?? "").replace(/\/+$/, "");
const galleryHeaders = [
  ...securityHeaders.filter((h) => h.key !== "X-Frame-Options"),
  {
    key: "Content-Security-Policy",
    value: `frame-ancestors 'self' ${dashboardOrigin} http://localhost:3000`.replace(/\s+/g, " "),
  },
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
    return [
      { source: "/p/:path*", headers: galleryHeaders },
      { source: "/((?!p/).*)", headers: securityHeaders },
    ];
  },
};

export default nextConfig;

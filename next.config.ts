import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
];

const config: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    // No Next image optimizer: Cloudflare transforms in production, raw URLs locally.
    loader: "custom",
    loaderFile: "./src/lib/images/loader.ts",
    // Few widths → few unique transformations at the edge.
    deviceSizes: [320, 480, 640, 960, 1280, 1920],
    imageSizes: [160, 240],
    qualities: [75],
  },
  experimental: {
    globalNotFound: true,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default config;

import { createRequire } from "module";
import type { NextConfig } from "next";

const require = createRequire(import.meta.url);
const { version } = require("./package.json") as { version: string };

const isDev = process.env.NODE_ENV === "development";

// Content-Security-Policy for Next.js App Router (no nonces).
// 'unsafe-inline' on script-src/style-src is required by the App Router's
// inline hydration scripts and Tailwind's runtime styles.
// 'unsafe-eval' is added in development only — React needs it for stack
// reconstruction and hot-module replacement; it is never present in production.
// connect-src covers fetch/XHR beacons; script-src covers the injected <script> tags.
// VERCEL_PREVIEW_HOSTS are only needed in non-production deployments (preview toolbar).
const VERCEL_HOSTS = "https://vitals.vercel-insights.com https://va.vercel-scripts.com";
const VERCEL_PREVIEW_HOSTS = "https://vercel.live https://vercel.com";
const isProduction = process.env.VERCEL_ENV === "production";
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} ${VERCEL_HOSTS}${!isProduction ? ` ${VERCEL_PREVIEW_HOSTS}` : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data: blob:",
  `connect-src 'self' ${VERCEL_HOSTS}${!isProduction ? ` ${VERCEL_PREVIEW_HOSTS}` : ""}`,
  `frame-src 'none'${!isProduction ? " https://vercel.live" : ""}`,
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: `v${version}`,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

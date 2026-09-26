import path from "node:path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
const CANONICAL_SITE_URL = "https://bctcare.net";

const nextConfig: NextConfig = {
  // Pin the workspace root explicitly — an unrelated package-lock.json in
  // ~/ was otherwise being picked up as the inferred root.
  turbopack: {
    root: path.join(__dirname),
  },
  // These ship platform binaries (the headless Chromium build used for
  // server-side PDF generation) that must be copied into the serverless
  // function as-is, not bundled/tree-shaken by Next.js.
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium"],
  // serverExternalPackages alone keeps the package's JS from being bundled,
  // but Next's file tracer only follows require()/import() calls — it never
  // sees @sparticuz/chromium's bin/*.br binaries (loaded via fs, not
  // require), so without this the deployed function is missing them
  // entirely ("input directory .../chromium/bin does not exist").
  outputFileTracingIncludes: {
    "/api/documents/pdf": ["./node_modules/@sparticuz/chromium/bin/**/*"],
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "managed-it.vercel.app" }],
        destination: `${CANONICAL_SITE_URL}/:path*`,
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);

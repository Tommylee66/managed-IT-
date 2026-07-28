import path from "node:path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

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
};

export default withNextIntl(nextConfig);

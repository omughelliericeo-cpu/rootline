// Next.js configuration.
// Cache Components / partial prefetching are deliberately OFF: they stream
// page sections in with JavaScript, and the public story page must show its
// core content with JavaScript disabled. See docs/DECISIONS.md.
import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

// Story-page images come from the public Supabase storage bucket.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const nextConfig: NextConfig = {
  // Browser tests build into their own folder (scripts/e2e-server.mjs) so they
  // can run while `npm run dev` is using .next.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  logging: {
    // Off on purpose: with it on (Next 16.4.3, Windows), every page load in
    // `next dev` triggered a recompile and a full reload, so pages reloaded
    // in a loop and forms lost what was typed. See docs/DECISIONS.md.
    browserToTerminal: false,
  },
  images: {
    remotePatterns: supabaseUrl ? [new URL(`${supabaseUrl}/storage/v1/object/public/**`)] : [],
  },
  experimental: {
    // Off on purpose. Next 16's dev-only MCP endpoint (for AI coding tools)
    // writes every log line to .next/dev/logs/next-development.log. On this
    // Windows setup the dev watcher reacts to that file, so each write
    // triggered a rebuild and full page reload: pages reloaded in a loop and
    // forms (e.g. login) never submitted. Rootline does not use the endpoint.
    mcpServer: false,
    serverActions: {
      // Photo uploads go through server actions: 4 MB images plus form overhead.
      // (Vercel itself caps request bodies at 4.5 MB.)
      bodySizeLimit: "4.5mb",
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withSentryConfig(nextConfig, {
  // Source maps are uploaded only when SENTRY_AUTH_TOKEN is set (on Vercel).
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
});

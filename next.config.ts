import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Auth-aware pages read cookies on every request, so we use the classic
  // per-request SSR model instead of the strict Cache Components model.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

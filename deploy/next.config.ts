import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // We import the parent `pruva-mcp` package directly from its built `../dist`,
  // which lives outside this Next app's directory. `externalDir` lets Next
  // resolve those out-of-tree JS files.
  experimental: {
    externalDir: true,
  },
};

export default nextConfig;

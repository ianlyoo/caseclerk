import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bryntum ships one large ESM bundle; keep it out of server bundles (the board is client-only).
  serverExternalPackages: ["@bryntum/scheduler"],
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "/logistics",
  assetPrefix: (process.env.NEXT_PUBLIC_BASE_PATH || "/logistics") + "/",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

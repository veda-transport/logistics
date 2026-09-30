import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/veda-transport",
  assetPrefix: "/veda-transport/",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

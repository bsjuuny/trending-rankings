import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',
  reactCompiler: true,
  basePath: '/trendingrankings',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

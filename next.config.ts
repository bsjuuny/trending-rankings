import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',
  generateBuildId: async () => 'my-build-id',
  basePath: '/trendingrankings',
  images: {
    unoptimized: true,
  },
  experimental: {
    reactCompiler: true,
    turbo: {
      rules: {},
    },
  },
};

export default nextConfig;

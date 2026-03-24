import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* static export options for Cafe24 */
  output: 'export',
  trailingSlash: true,
  basePath: '/trendingrankings',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

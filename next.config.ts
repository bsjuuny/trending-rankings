import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* static export options for Cafe24 */
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // If you are deploying to a specific subdirectory, uncomment the following:
  // basePath: '/trendingrankings',
};

export default nextConfig;

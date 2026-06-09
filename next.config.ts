import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  distDir: '.next',
  cacheMaxMemorySize: 250,
};

export default nextConfig;

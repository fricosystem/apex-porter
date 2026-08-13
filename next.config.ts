import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  distDir: '.next',
  cacheMaxMemorySize: 250,
  allowedDevOrigins: ['*.monkeycode-ai.live'],
};

export default nextConfig;

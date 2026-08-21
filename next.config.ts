import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  distDir: '.next',
  cacheMaxMemorySize: 250,
  allowedDevOrigins: ['*.monkeycode-ai.live', '3000-iqhfx18be7ijkh3oxne8n-e0f50562.us4.manus.computer'],
};

export default nextConfig;

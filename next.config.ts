import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: { root: process.cwd() },
  agentRules: false,
  devIndicators: false,
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Auth-aware pages read cookies on every request, so keep them dynamic.
  reactStrictMode: true,
};

export default nextConfig;

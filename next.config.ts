import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Auth-aware pages read cookies on every request, so keep them dynamic.
  reactStrictMode: true,

  // A small, static set of hardening headers. No CSP here: Next's dev overlay
  // and the Supabase browser client both need inline/eval in development, and a
  // broken CSP is worse than none. Add one deliberately, in report-only mode,
  // when there is a place to read the reports.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

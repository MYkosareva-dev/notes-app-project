import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `next dev` otherwise appends its own rules block to CLAUDE.md, which this
  // project's rules declare off-limits. Keep the project's CLAUDE.md untouched.
  agentRules: false,
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow dev-mode access to /_next/* resources (HMR, client chunks) from the
  // Tailscale IP so login works from the phone. Dev-only; no effect on build.
  allowedDevOrigins: ["100.121.112.48", "192.168.4.3", "*.ts.net"],
};

export default nextConfig;

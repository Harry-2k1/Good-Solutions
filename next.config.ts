import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['mongoose', 'bcryptjs'],
  allowedDevOrigins: ["10.10.19.179"],
};

export default nextConfig;

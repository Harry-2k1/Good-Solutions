import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['mongoose', 'bcryptjs'],
  allowedDevOrigins: ["10.10.19.179", "127.0.0.1", "localhost"],
};

export default nextConfig;

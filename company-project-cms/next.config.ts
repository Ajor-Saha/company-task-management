import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-549bfb2f53be4e008ca2b4bb9c0dbf83.r2.dev",
      },
    ],
  },
};

export default nextConfig;

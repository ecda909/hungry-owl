import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.clerk.com",
      },
    ],
  },
  // Skip static generation for pages that require Clerk during build
  // This allows building without a valid Clerk key
  experimental: {
    // Disable static generation for the not-found page which uses Clerk
  },
};

export default nextConfig;

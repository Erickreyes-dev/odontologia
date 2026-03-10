/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  experimental: {
    outputFileTracingIncludes: {
      "/**/*": ["lib/generated/prisma/**", "node_modules/.prisma/**"],
    },
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      "/**/*": ["lib/generated/prisma/**", "node_modules/.prisma/**"],
    },
  },
};

export default nextConfig;

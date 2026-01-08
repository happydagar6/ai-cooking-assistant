/** @type {import('next').NextConfig} */
const nextConfig = {
  // Proxy authentication to Clerk using the new Next.js 16 proxy pattern
  experimental: {
    authInterrupts: true,
  },
};

export default nextConfig;

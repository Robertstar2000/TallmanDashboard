/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    domains: ['localhost'],
    unoptimized: true 
  },
};

module.exports = nextConfig;

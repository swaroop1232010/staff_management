const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  eslint: {
    // Avoid deployment crashes due to lint rules during Vercel build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // TypeScript type-checking is performed via `tsc --noEmit`
    ignoreBuildErrors: false,
  },
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname)
    return config
  },
}

module.exports = nextConfig

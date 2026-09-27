/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Prevent stale Webpack HMR filesystem cache corruption on Windows in dev mode
      config.cache = false;
    }
    return config;
  },
  async rewrites() {
    const backendUrl =
      process.env.NEXT_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'https://recallradar-api-upim.onrender.com';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;

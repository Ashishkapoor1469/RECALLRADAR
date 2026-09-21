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
};

module.exports = nextConfig;

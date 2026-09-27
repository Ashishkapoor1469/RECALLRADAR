/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [],
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'https://recallradar-api-upim.onrender.com'}/api/v1/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: [
    '192.168.1.7',
    '192.168.1.7:3000',
    '192.168.1.5',
    '192.168.1.5:3000',
    'localhost',
    'localhost:3000',
    '0.0.0.0'
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
}

module.exports = nextConfig
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow raw body for Stripe webhook signature verification
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

module.exports = nextConfig


/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Required for static site generation
  basePath: process.env.NODE_ENV === 'development' ? '' : '/chef3', // Only use basePath in production
  images: {
    unoptimized: true, // Required for static export
  },
}

module.exports = nextConfig 
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Required for static site generation
  basePath: '/chef3', // Replace 'chef3' with your repository name
  images: {
    unoptimized: true, // Required for static export
  },
}

module.exports = nextConfig 
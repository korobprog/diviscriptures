/** @type {import('next').NextConfig} */
const nextConfig = {
  // Убираем output: 'export' для поддержки API routes
  // output: 'export', // Outputs a Single-Page Application (SPA).
  // distDir: './dist', // Changes the build output directory to `./dist/`.
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
}

export default nextConfig

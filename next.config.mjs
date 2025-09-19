/** @type {import('next').NextConfig} */
const nextConfig = {
  // Убираем output: 'export' для поддержки API routes
  // output: 'export', // Outputs a Single-Page Application (SPA).
  // distDir: './dist', // Changes the build output directory to `./dist/`.
  trailingSlash: false,
  images: {
    unoptimized: true
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Отключаем stack frames в режиме разработки для уменьшения ошибок
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // Отключаем source maps в production
  productionBrowserSourceMaps: false,
}

export default nextConfig

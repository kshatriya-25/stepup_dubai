/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  // Static export: `next build` emits ./out, which Apache serves directly.
  // No Node process, no PM2, no reverse proxy. The site is 100% static.
  output: 'export',
  // We use plain <img>, so the optimizer is unused — mark unoptimized for export.
  images: { unoptimized: true },
  // Emits /page/index.html rather than /page.html — matches Apache dir resolution.
  trailingSlash: true,
};

export default nextConfig;

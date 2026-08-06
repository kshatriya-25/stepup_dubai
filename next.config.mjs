/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  // NOTE: `output: 'export'` was removed when /api/register was added — a static
  // export cannot run route handlers, and the SMTP password must never reach the
  // browser bundle. The site now runs as a Node process behind Apache; see
  // HOSTING.md "Option B".
  //
  // We use plain <img> everywhere, so the optimizer buys us nothing and costs
  // sharp + CPU on the box. Keep it off.
  images: { unoptimized: true },
  // Page URLs keep their trailing slash so existing links and SEO don't churn.
  // `skipTrailingSlashRedirect` stops Next from bouncing POST /api/register
  // through a redirect on its way to the handler.
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
};

export default nextConfig;

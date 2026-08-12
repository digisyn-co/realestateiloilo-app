/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Design/seed photos are served locally from /public/property-images.
    // Remote patterns are declared so imported-listing images (behind a rights check)
    // can render once approved. Add real CDN hosts here in production.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
};

export default nextConfig;

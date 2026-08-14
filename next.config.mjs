/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/**",
      },
    ],
  },

  async rewrites() {
    return [
      {
        source: "/images/:filename",
        destination:
          "https://firebasestorage.googleapis.com/v0/b/tndrbtns.appspot.com/o/images%2F:filename?alt=media",
      },
    ];
  },
};

export default nextConfig;

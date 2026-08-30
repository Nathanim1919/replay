import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://replay-backend-dq8p.onrender.com";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 100],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

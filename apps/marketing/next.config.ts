import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/login",
        destination: "https://app.familytable.me/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

const nextConfig = {
  async redirects() {
    return [
      {
        source: "/login",
        destination: "https://app.familytable.me/",
        permanent: true,
      },
      {
        source: "/about-us",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/contact-us",
        destination: "/contact",
        permanent: true,
      },
      {
        source: "/faq",
        destination: "/",
        permanent: true,
      },
      {
        source: "/team",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/single-team",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/service",
        destination: "/features",
        permanent: true,
      },
      {
        source: "/single-service",
        destination: "/features",
        permanent: true,
      },
      {
        source: "/portfolio",
        destination: "/",
        permanent: true,
      },
      {
        source: "/single-portfolio",
        destination: "/",
        permanent: true,
      },
      {
        source: "/home-2",
        destination: "/",
        permanent: true,
      },
      {
        source: "/home-3",
        destination: "/",
        permanent: true,
      },
      {
        source: "/sign-in",
        destination: "https://app.familytable.me/",
        permanent: true,
      },
      {
        source: "/sign-up",
        destination: "https://app.familytable.me/",
        permanent: true,
      },
      {
        source: "/reset-password",
        destination: "https://app.familytable.me/",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/assets/recipe_animation/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  eslint: {
    // Allow production builds to succeed even if there are ESLint errors
    ignoreDuringBuilds: true,
  },
  env: {
    SANITY_PROJECT_ID: process.env.SANITY_PROJECT_ID,
    SANITY_DATASET: process.env.SANITY_DATASET,
    SANITY_API_VERSION: process.env.SANITY_API_VERSION,
  },
};

export default nextConfig;

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

  eslint: {
    // Allow production builds to succeed even if there are ESLint errors
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

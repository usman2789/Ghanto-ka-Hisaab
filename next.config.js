const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: false, // Changed to false to prevent cache conflicts
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
        },
      },
    },
  ],
  buildExcludes: [/middleware-manifest\.json$/],
});

const nextConfig = {
  reactStrictMode: true,
};

module.exports = withPWA(nextConfig);

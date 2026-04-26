type RuntimeCachingContext = {
  sameOrigin: boolean;
  request: Request;
  url: URL;
};

const runtimeCaching = [
  {
    urlPattern: ({ sameOrigin, request }: RuntimeCachingContext) =>
      sameOrigin && request.destination === 'document',
    handler: 'NetworkFirst',
    options: {
      cacheName: 'app-pages',
      networkTimeoutSeconds: 3,
      expiration: {
        maxEntries: 32,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      },
    },
  },
  {
    urlPattern: ({ sameOrigin, url }: RuntimeCachingContext) =>
      sameOrigin && url.pathname.startsWith('/_next/static/'),
    handler: 'CacheFirst',
    options: {
      cacheName: 'next-static-assets',
      expiration: {
        maxEntries: 64,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      },
    },
  },
  {
    urlPattern: ({ sameOrigin, request }: RuntimeCachingContext) =>
      sameOrigin && ['style', 'script', 'worker', 'font', 'image'].includes(request.destination),
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'app-static-assets',
      expiration: {
        maxEntries: 128,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      },
    },
  },
];

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  cacheStartUrl: true,
  dynamicStartUrl: false,
  fallbacks: {
    document: '/_offline',
  },
  runtimeCaching,
  buildExcludes: [/middleware-manifest\.json$/],
});

const nextConfig = {
  reactStrictMode: true,
};

module.exports = withPWA(nextConfig);

// This is a custom service worker with better lifecycle handling

// Listen for SKIP_WAITING message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Remove old caches
              return cacheName.startsWith('workbox-') || cacheName.startsWith('next-');
            })
            .map((cacheName) => caches.delete(cacheName))
        );
      }),
      // Claim all clients
      self.clients.claim(),
    ])
  );
});

// Log service worker lifecycle events
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // Let the default fetch handler take care of requests
  return;
});

console.log('Custom service worker loaded');

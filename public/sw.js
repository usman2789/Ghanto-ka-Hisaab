// Simple service worker for basic PWA functionality
const CACHE_NAME = 'ghanto-v1';

self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Skip chrome-extension and non-http requests
  if (!event.request.url.startsWith('http')) {
    return;
  }
  
  // Let all requests pass through without interception
  event.respondWith(
    fetch(event.request).catch(() => {
      // Return a basic response if fetch fails
      return new Response('Offline', {
        status: 503,
        statusText: 'Service Unavailable'
      });
    })
  );
});

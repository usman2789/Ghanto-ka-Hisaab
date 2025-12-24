self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('tracker-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/login',
      ])
    })
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request)
    })
  )
})

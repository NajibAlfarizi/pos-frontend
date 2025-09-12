/* eslint-disable @typescript-eslint/no-unused-vars */
self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function(event) {
  // Network-only strategy: always fetch from network, never cache
  event.respondWith(
    fetch(event.request)
  );
});
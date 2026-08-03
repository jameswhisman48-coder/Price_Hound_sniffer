const CACHE_VERSION = "pricehound-static-v1";
const STATIC_CACHE = CACHE_VERSION;

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(STATIC_CACHE));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== STATIC_CACHE).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // APIs contain live prices, submissions, and analytics: always use the network.
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    // SSR HTML must remain fresh; fall back only when offline.
    event.respondWith(fetch(request).catch(() => caches.match("/")));
    return;
  }

  // Static assets are immutable build outputs, so serve cache-first and fill on miss.
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok && request.method === "GET") {
        const copy = response.clone();
        caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
      }
      return response;
    }))
  );
});

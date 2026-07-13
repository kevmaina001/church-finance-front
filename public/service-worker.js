/* Church Finance service worker — app-shell offline support.
   Bump CACHE_VERSION to force clients onto new assets after a deploy. */
const CACHE_VERSION = 'v1';
const CACHE_NAME = `church-finance-${CACHE_VERSION}`;

// Minimal app shell precached on install. Hashed JS/CSS bundles are cached at
// runtime (stale-while-revalidate) as they're first requested.
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './favicon.png',
  './logo192.png',
  './logo512.png',
  './apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return; // never touch writes

  const url = new URL(request.url);

  // Only handle our own origin. API calls (onrender) and other cross-origin
  // requests go straight to the network so financial data is never stale.
  if (url.origin !== self.location.origin) return;

  // SPA navigations: network-first, fall back to the cached app shell offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Static same-origin assets: stale-while-revalidate.
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      const network = fetch(request)
        .then((response) => {
          if (response && response.status === 200) cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

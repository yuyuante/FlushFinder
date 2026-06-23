const CACHE_NAME = 'flushfinder-v41';
const ASSETS = [
  './',
  './index.html',
  './style.css?v=41',
  './app.js?v=41',
  './icon-192.jpg',
  './icon-512.jpg',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/lucide@latest'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Only intercept GET requests and bypass proxy API requests (both toilets and osm backend)
  if (e.request.method !== 'GET' || e.request.url.includes('/api/toilets') || e.request.url.includes('/api/osm')) {
    return;
  }
  
  // Network-First Strategy: always try to fetch fresh content first, fallback to cache if offline
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // Only cache successful basic responses
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network is unavailable (offline mode)
        return caches.match(e.request);
      })
  );
});

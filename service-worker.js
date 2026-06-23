const CACHE_NAME = 'flushfinder-v37';
const ASSETS = [
  './',
  './index.html',
  './style.css?v=37',
  './app.js?v=37',
  './icon-192.jpg',
  './icon-512.jpg',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/lucide@latest',
  './data/taipei.json',
  './data/new_taipei.json',
  './data/taoyuan.json',
  './data/taichung.json',
  './data/tainan.json',
  './data/kaohsiung.json',
  './data/keelung.json',
  './data/hsinchu_city.json',
  './data/hsinchu_county.json',
  './data/miaoli.json',
  './data/changhua.json',
  './data/nantou.json',
  './data/yunlin.json',
  './data/chiayi_city.json',
  './data/chiayi_county.json',
  './data/pingtung.json',
  './data/yilan.json',
  './data/hualien.json',
  './data/taitung.json',
  './data/penghu.json',
  './data/kinmen.json',
  './data/lienchiang.json'
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
  // Only intercept GET requests and bypass proxy API requests
  if (e.request.method !== 'GET' || e.request.url.includes('/api/toilets')) {
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

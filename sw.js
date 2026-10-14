// Offline support: precache the app shell, then serve from cache while
// refreshing it in the background (stale-while-revalidate).
const CACHE = 'brain-games-v2';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/styles.css',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png',
  'js/app.js', 'js/chart.js',
  'js/core/dates.js', 'js/core/streak.js', 'js/core/schedule.js', 'js/core/adaptive.js', 'js/core/store.js',
  'js/data/words.js',
  'js/games/index.js', 'js/games/kit.js',
  'js/games/grid-recall.js', 'js/games/sequence-echo.js', 'js/games/color-clash.js', 'js/games/odd-one-out.js',
  'js/games/quick-math.js', 'js/games/number-pattern.js', 'js/games/anagram-rush.js', 'js/games/synonym-match.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(e.request, { ignoreSearch: true });
      const fresh = fetch(e.request)
        .then((res) => { if (res.ok) cache.put(e.request, res.clone()); return res; })
        .catch(() => cached);
      return cached || fresh;
    }),
  );
});

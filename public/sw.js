/* Service worker : réseau d’abord (on voit toujours la dernière version), cache en secours si la connexion tombe
   ou répond trop lentement (4 s) : en cabine, un réseau à moitié mort est plus fréquent qu’un réseau absent. */
const CACHE = 'memo-__BUILD__';
const SLOW_MS = 4000;
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon.svg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.endsWith('version.json')) return;
  const cached = () => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html'));
  const net = fetch(e.request).then(r => {
    if (r.ok && r.type === 'basic') { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return r;
  });
  const slow = new Promise((_, no) => setTimeout(() => no(new Error('lent')), SLOW_MS));
  e.respondWith(Promise.race([net, slow]).catch(() => cached().then(r => r || net)));
});

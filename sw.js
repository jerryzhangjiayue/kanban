const CACHE_NAME = 'kanban-v11';
const ASSETS = ['./', './index.html', './manifest.json', './kanban-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first 策略：优先从网络获取最新版本，网络失败才用缓存
// 这样部署新版本后用户能立即拿到，不会卡在旧缓存上
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(resp => {
      if (resp && resp.status === 200 && resp.type === 'basic') {
        const clone = resp.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
      }
      return resp;
    }).catch(() => {
      return caches.match(e.request).then(cached => cached || caches.match('./'));
    })
  );
});

const CACHE_NAME = 'engineering-mgmt-v1';
const ASSETS = [
  '/',
  '/index.html'
];

// 安裝：快取核心檔案
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// 啟動：清除舊快取
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// 攔截請求：網路優先，失敗才用快取（確保資料永遠最新）
self.addEventListener('fetch', function(e) {
  // GAS API 請求不快取，直接走網路
  if (e.request.url.includes('script.google.com') ||
      e.request.url.includes('generativelanguage.googleapis.com')) {
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then(function(response) {
        // 成功時更新快取
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, clone);
        });
        return response;
      })
      .catch(function() {
        // 網路失敗時用快取
        return caches.match(e.request);
      })
  );
});

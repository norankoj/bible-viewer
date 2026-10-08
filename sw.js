// 설치형 웹앱: 인터넷이 없어도 뷰어 화면이 열리도록 화면 파일만 보관.
// (성경·주석·사전 데이터는 브라우저 저장소(IndexedDB)에 따로 있음)
const CACHE = 'viewer-v2';
const SHELL = ['./', 'index.html', 'decode.js', 'manifest.webmanifest', 'vendor/sql-wasm.js', 'vendor/sql-wasm-bin.js', 'vendor/pretendard.css', 'icons/icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

// 인터넷이 되면 항상 새 파일(업데이트가 바로 반영), 안 되면 보관본
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api/')) return; // ESV 등은 그대로
  if (!/(\/|\.(html|js|css|png|webmanifest))$/.test(u.pathname)) return; // 화면 파일만
  e.respondWith(
    fetch(e.request)
      .then(r => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return r; })
      // 보관본이 없을 때 화면 주소만 index.html로 (스크립트 자리에 HTML을 주면 깨짐)
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || (e.request.mode === 'navigate' ? caches.match('index.html') : Response.error())))
  );
});

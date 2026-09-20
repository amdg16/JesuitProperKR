// 최소한의 서비스 워커: 설치 가능(installable) 조건 충족 + 오프라인 시 기본 캐시 제공
const CACHE_NAME = "jesuitproperkr-v1";
const CORE_ASSETS = ["./", "./index.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // 구글 시트 CSV는 항상 최신 데이터를 받아야 하므로 캐시하지 않고 그대로 통과
  if (event.request.url.includes("docs.google.com")) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request)
          .then((response) => {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
            return response;
          })
          .catch(() => cached)
      );
    })
  );
});

// 서비스 워커: 본문(HTML)은 항상 최신을 먼저 받아오고(네트워크 우선),
// 오프라인일 때만 저장해 둔 화면을 보여준다. 이미지 등은 캐시 우선으로 속도만 챙긴다.
const CACHE_NAME = "jesuitproperkr-v2"; // 버전 올림: 예전 캐시를 정리하기 위함
const CORE_ASSETS = ["./", "./index.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // 구글 시트 CSV는 항상 최신 데이터를 받아야 하므로 서비스 워커가 손대지 않는다
  if (req.url.includes("docs.google.com")) return;

  var isPage =
    req.mode === "navigate" ||
    (req.method === "GET" && (req.headers.get("accept") || "").indexOf("text/html") !== -1);

  if (isPage) {
    // 페이지(HTML)는 네트워크 우선: 수정사항이 바로 반영되도록
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // 이미지 등 나머지 자산은 캐시 우선(속도), 없으면 받아와서 캐시에 저장
  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
    )
  );
});

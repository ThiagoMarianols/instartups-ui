// Service worker do InStartups: offline básico.
//  - navegação sem rede        -> /offline.html
//  - /_next/static e /icons    -> cache-first (arquivos com hash ou imutáveis)
//  - /api, /_next/image e resto -> rede, sem cache (dados nunca ficam guardados)
// Trocar a versão de CACHE descarta os caches antigos no activate.
const CACHE = "instartups-v1";
const PRECACHE = ["/offline.html", "/icons/logo.svg", "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((nomes) => Promise.all(nomes.filter((nome) => nome !== CACHE).map((nome) => caches.delete(nome))))
      .then(() => self.clients.claim()),
  );
});

async function cachePrimeiro(request) {
  const cache = await caches.open(CACHE);
  const guardado = await cache.match(request);
  if (guardado) return guardado;
  const resposta = await fetch(request);
  if (resposta.ok) cache.put(request, resposta.clone());
  return resposta;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/image")) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/offline.html")));
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(cachePrimeiro(request));
  }
});

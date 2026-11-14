/* Carretel — service worker (app shell + fallback offline).
 * Navegações: network-first com cópia em cache (as telas já visitadas abrem sem sinal).
 * Estáticos do Next (/_next/static, ícones, fontes): cache-first.
 * API e POST nunca são cacheados: a fila offline (IndexedDB) cuida das mutações.
 */
const VERSION = "carretel-v1";
const SHELL = ["/es/hoy", "/pt-BR/hoy", "/icons/icon-192.png", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((c) => Promise.allSettled(SHELL.map((u) => c.add(new Request(u, { credentials: "same-origin" })))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  // links públicos de prova/recibo: sempre da rede (registro de visualização)
  if (/^\/(es|pt-BR)\/(c|r)\//.test(url.pathname)) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || /\.(svg|png|ico|woff2)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(VERSION).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok && res.type === "basic") {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(async () => {
          const hit = await caches.match(req);
          if (hit) return hit;
          const lang = url.pathname.startsWith("/pt-BR") ? "/pt-BR/hoy" : "/es/hoy";
          return (await caches.match(lang)) || new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
        }),
    );
  }
});

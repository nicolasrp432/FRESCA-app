/* FRESCA · service worker: app disponible sin internet + avisos diarios */
const VERSION = "fresca-v1";
const SHELL = ["/", "/index.html", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== "fresca-meta").map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.pathname.startsWith("/api/")) return; // la IA siempre en vivo
  // Navegación: red primero, si no hay internet la app guardada
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match("/index.html")));
    return;
  }
  // Recursos (JS, CSS, fuentes): caché primero y se actualiza por detrás
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req)
        .then((res) => {
          if (res.ok && (url.origin === location.origin || url.hostname.endsWith("gstatic.com") || url.hostname.endsWith("googleapis.com"))) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => hit);
      return hit || net;
    }),
  );
});

async function dailyFromCache() {
  const c = await caches.open("fresca-meta");
  const r = await c.match("/__daily");
  if (!r) return;
  const snap = await r.json();
  const today = new Date().toISOString().slice(0, 10);
  if (!snap.msg || snap.lastDay === today || new Date().getHours() < snap.hour) return;
  await self.registration.showNotification(snap.msg.title, {
    body: snap.msg.body,
    icon: "/icon.svg",
    badge: "/icon.svg",
    tag: "fresca-diario",
    data: { url: snap.msg.url },
    actions: [{ action: "ver", title: "Ver la idea" }],
  });
  await c.put("/__daily", new Response(JSON.stringify({ ...snap, lastDay: today }), { headers: { "content-type": "application/json" } }));
}

self.addEventListener("periodicsync", (e) => {
  if (e.tag === "fresca-diario") e.waitUntil(dailyFromCache());
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const target = "/" + ((e.notification.data && e.notification.data.url) || "#/hoy");
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ("focus" in c) {
          c.navigate(target).catch(() => undefined);
          return c.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});

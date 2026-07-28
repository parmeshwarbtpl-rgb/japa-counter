const CACHE_NAME =
  "naam-jaap-counter-v2-9-15-header-layout-fix";

const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css?v=2915",
  "./mala-goal.css?v=2915",
  "./background-music.css?v=2915",
  "./config.js?v=2915",
  "./offline.js?v=2915",
  "./api.js?v=2915",
  "./auth.js?v=2915",
  "./trusted-device.js?v=2915",
  "./profile.js?v=2915",
  "./settings.js?v=2915",
  "./history.js?v=2915",
  "./ui.js?v=2915",
  "./reminder.js?v=2915",
  "./app.js?v=2915",
  "./custom-mantras.js?v=2915",
  "./ecosystem.js?v=2915",
  "./app-updates.js?v=2915",
  "./dashboard-polish.js?v=2915",
  "./mobile-ui-fix.js?v=2915",
  "./sync-settings.js?v=2915",
  "./background-music.js?v=2915",
  "./temple-music.mp3?v=2915",
  "./reminder-temple-bell.wav?v=2915",
  "./reminder-morning-chime.wav?v=2915",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl =
    new URL(event.request.url);

  if (
    requestUrl.origin !==
    self.location.origin
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse?.status === 200) {
            const copy =
              networkResponse.clone();

            caches
              .open(CACHE_NAME)
              .then((cache) =>
                cache.put("./index.html", copy)
              );
          }

          return networkResponse;
        })
        .catch(() => caches.match("./index.html"))
    );

    return;
  }

  if (
    requestUrl.pathname.endsWith(
      "/ecosystem.js"
    )
  ) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse?.status === 200) {
            const copy =
              networkResponse.clone();

            caches
              .open(CACHE_NAME)
              .then((cache) =>
                cache.put(event.request, copy)
              );
          }

          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );

    return;
  }

  event.respondWith(
    caches
      .match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then((networkResponse) => {
            if (
              !networkResponse ||
              networkResponse.status !== 200
            ) {
              return networkResponse;
            }

            const copy =
              networkResponse.clone();

            caches
              .open(CACHE_NAME)
              .then((cache) =>
                cache.put(event.request, copy)
              );

            return networkResponse;
          });
      })
  );
});

self.addEventListener(
  "notificationclick",
  (event) => {
    event.notification.close();

    const targetUrl = new URL(
      event.notification.data?.url || "./",
      self.location.href
    ).href;

    event.waitUntil(
      clients
        .matchAll({
          type: "window",
          includeUncontrolled: true
        })
        .then((windowClients) => {
          for (const client of windowClients) {
            if (
              client.url.startsWith(
                self.location.origin
              ) &&
              "focus" in client
            ) {
              client.navigate(targetUrl);
              return client.focus();
            }
          }

          return clients.openWindow
            ? clients.openWindow(targetUrl)
            : undefined;
        })
    );
  }
);

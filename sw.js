const CACHE_NAME = "naam-jaap-counter-v2-9-0-daily-mala-goals";
const APP_SHELL = [
    "./",
    "./index.html",
    "./style.css?v=290",
    "./mala-goal.css?v=290",
    "./config.js?v=290",
    "./offline.js?v=290",
    "./api.js?v=290",
    "./auth.js?v=290",
    "./settings.js?v=290",
    "./history.js?v=290",
    "./ui.js?v=290",
    "./reminder.js?v=290",
    "./app.js?v=290",
    "./custom-mantras.js?v=290",
    "./manifest.json",
    "./icon-192.png",
    "./icon-512.png"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", event => {
    const requestUrl = new URL(event.request.url);

    if (event.request.method !== "GET") return;

    if (requestUrl.origin !== self.location.origin) {
        event.respondWith(fetch(event.request));
        return;
    }

    if (event.request.mode === "navigate") {
        event.respondWith(
            fetch(event.request)
                .then(networkResponse => {
                    if (networkResponse && networkResponse.status === 200) {
                        const clone = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put("./index.html", clone));
                    }
                    return networkResponse;
                })
                .catch(() => caches.match("./index.html"))
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) return cachedResponse;

            return fetch(event.request).then(networkResponse => {
                if (!networkResponse || networkResponse.status !== 200) {
                    return networkResponse;
                }

                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
                return networkResponse;
            });
        })
    );
});

self.addEventListener("notificationclick", event => {
    event.notification.close();
    const targetUrl = new URL(event.notification.data?.url || "./", self.location.href).href;

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then(windowClients => {
            for (const client of windowClients) {
                if (client.url.startsWith(self.location.origin) && "focus" in client) {
                    client.navigate(targetUrl);
                    return client.focus();
                }
            }
            return clients.openWindow ? clients.openWindow(targetUrl) : undefined;
        })
    );
});

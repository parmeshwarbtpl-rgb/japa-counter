const CACHE_NAME = "naam-jaap-counter-v2-4-0-fast-tap-sync";
const APP_SHELL = [
    "./",
    "./index.html",
    "./style.css?v=240",
    "./config.js?v=240",
    "./api.js?v=240",
    "./auth.js?v=240",
    "./settings.js?v=240",
    "./history.js?v=240",
    "./ui.js?v=240",
    "./app.js?v=240",
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

    // Authentication, Google APIs, and Apps Script always use the network.
    if (requestUrl.origin !== self.location.origin) {
        event.respondWith(fetch(event.request));
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

const STATIC_CACHE = "birthday-reminder-static-v5.1";

const REMINDER_SCRIPT =
  "./birthday-reminders.js?v=1";

const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  REMINDER_SCRIPT
];

function injectBirthdayReminderEnhancement(html) {
  const text = String(html || "");

  if (
    text.includes(
      "birthday-reminders.js"
    )
  ) {
    return text;
  }

  const scriptTag =
    `<script src="${REMINDER_SCRIPT}"></script>`;

  if (
    text.includes(
      "</body>"
    )
  ) {
    return text.replace(
      "</body>",
      `  ${scriptTag}\n</body>`
    );
  }

  return (
    text +
    "\n" +
    scriptTag
  );
}

async function enhancedHtmlResponse(
  response
) {
  if (!response) {
    return response;
  }

  const contentType =
    response.headers.get(
      "content-type"
    ) || "";

  if (
    !contentType.includes(
      "text/html"
    )
  ) {
    return response;
  }

  const html =
    await response.text();

  const headers =
    new Headers(
      response.headers
    );

  headers.delete(
    "content-length"
  );

  return new Response(
    injectBirthdayReminderEnhancement(
      html
    ),
    {
      status:
        response.status,
      statusText:
        response.statusText,
      headers
    }
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener("message", (event) => {
  if (
    event.data &&
    event.data.type === "SKIP_WAITING"
  ) {
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
            .filter((key) => key !== STATIC_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Never intercept or cache Google OAuth, People API,
  // or any other cross-origin request.
  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.method !== "GET") {
    return;
  }

  // Navigation stays network-first. The reminder enhancement
  // is injected locally into the HTML response.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(
          enhancedHtmlResponse
        )
        .catch(async () => {
          const cached =
            await caches.match(
              "./index.html"
            );

          return cached
            ? enhancedHtmlResponse(
                cached
              )
            : cached;
        })
    );
    return;
  }

  // Same-origin public static app files only.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(request).then((response) => {
        const pathname =
          url.pathname.toLowerCase();

        const isStatic =
          pathname.endsWith(".png") ||
          pathname.endsWith(".webmanifest") ||
          pathname.endsWith(".html") ||
          pathname.endsWith(".js");

        if (
          isStatic &&
          response.ok
        ) {
          const copy =
            response.clone();

          caches
            .open(STATIC_CACHE)
            .then(
              (cache) =>
                cache.put(
                  request,
                  copy
                )
            );
        }

        return response;
      });
    })
  );
});

self.addEventListener(
  "notificationclick",
  (event) => {
    event.notification.close();

    const targetUrl =
      new URL(
        event.notification.data?.url || "./",
        self.location.href
      ).href;

    event.waitUntil(
      self.clients
        .matchAll({
          type: "window",
          includeUncontrolled: true
        })
        .then((clients) => {
          for (const client of clients) {
            if (
              client.url.startsWith(
                self.location.origin
              )
            ) {
              if (
                "navigate" in client
              ) {
                client.navigate(
                  targetUrl
                );
              }

              if (
                "focus" in client
              ) {
                return client.focus();
              }
            }
          }

          return self.clients.openWindow
            ? self.clients.openWindow(
                targetUrl
              )
            : undefined;
        })
    );
  }
);
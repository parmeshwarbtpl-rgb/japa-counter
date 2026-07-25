const STATIC_CACHE =
  "birthday-reminder-static-v5.2";

const REMINDER_SCRIPT =
  "./birthday-reminders.js?v=5.2";

const ENHANCEMENT_SCRIPT =
  "./app-v52-enhancements.js?v=5.2";

const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  REMINDER_SCRIPT,
  ENHANCEMENT_SCRIPT
];

function upgradeBirthdayReminderHtml(
  html
) {
  let text =
    String(html || "");

  // Upgrade the embedded app version labels/constants without
  // requiring a large replacement of the current index.html.
  text =
    text
      .replaceAll(
        "Private Device v5.1",
        "Private Device v5.2"
      )
      .replaceAll(
        "Birthday Reminder v5.1",
        "Birthday Reminder v5.2"
      )
      .replaceAll(
        "Build: v5.1 · Duplicates + Settings + Privacy",
        "Build: v5.2 · Reminders + Install + Profile"
      )
      .replaceAll(
        "privacy-first-device-v5.1-duplicates-settings-privacy",
        "privacy-first-device-v5.2-reminders-install-profile"
      )
      .replaceAll(
        '"5.1"',
        '"5.2"'
      )
      .replaceAll(
        "./sw.js?v=5.1",
        "./sw.js?v=5.2"
      )
      .replaceAll(
        "birthday-reminder-static-v5.1",
        "birthday-reminder-static-v5.2"
      );

  const scripts = [];

  if (
    !text.includes(
      "birthday-reminders.js"
    )
  ) {
    scripts.push(
      `<script src="${REMINDER_SCRIPT}"></script>`
    );
  }

  if (
    !text.includes(
      "app-v52-enhancements.js"
    )
  ) {
    scripts.push(
      `<script src="${ENHANCEMENT_SCRIPT}"></script>`
    );
  }

  if (!scripts.length) {
    return text;
  }

  const block =
    scripts
      .map((item) => `  ${item}`)
      .join("\n");

  if (
    text.includes(
      "</body>"
    )
  ) {
    return text.replace(
      "</body>",
      `${block}\n</body>`
    );
  }

  return (
    text +
    "\n" +
    block
  );
}

async function upgradedHtmlResponse(
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
    upgradeBirthdayReminderHtml(
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

self.addEventListener(
  "install",
  (event) => {
    event.waitUntil(
      caches
        .open(
          STATIC_CACHE
        )
        .then(
          (cache) =>
            cache.addAll(
              STATIC_ASSETS
            )
        )
    );
  }
);

self.addEventListener(
  "message",
  (event) => {
    if (
      event.data &&
      event.data.type ===
        "SKIP_WAITING"
    ) {
      self.skipWaiting();
    }
  }
);

self.addEventListener(
  "activate",
  (event) => {
    event.waitUntil(
      caches
        .keys()
        .then(
          (keys) =>
            Promise.all(
              keys
                .filter(
                  (key) =>
                    key !==
                    STATIC_CACHE
                )
                .map(
                  (key) =>
                    caches.delete(
                      key
                    )
                )
            )
        )
        .then(
          () =>
            self.clients.claim()
        )
    );
  }
);

self.addEventListener(
  "fetch",
  (event) => {
    const request =
      event.request;

    const url =
      new URL(
        request.url
      );

    // Never intercept Google OAuth/People API
    // or other cross-origin requests.
    if (
      url.origin !==
      self.location.origin
    ) {
      return;
    }

    if (
      request.method !==
      "GET"
    ) {
      return;
    }

    // Navigation is network-first, then upgraded locally
    // with v5.2 modules and version labels.
    if (
      request.mode ===
      "navigate"
    ) {
      event.respondWith(
        fetch(request)
          .then(
            upgradedHtmlResponse
          )
          .catch(
            async () => {
              const cached =
                await caches.match(
                  "./index.html"
                );

              return cached
                ? upgradedHtmlResponse(
                    cached
                  )
                : cached;
            }
          )
      );

      return;
    }

    event.respondWith(
      caches
        .match(
          request
        )
        .then(
          (cached) => {
            if (cached) {
              return cached;
            }

            return fetch(
              request
            ).then(
              (response) => {
                const pathname =
                  url.pathname
                    .toLowerCase();

                const isStatic =
                  pathname.endsWith(
                    ".png"
                  ) ||
                  pathname.endsWith(
                    ".webmanifest"
                  ) ||
                  pathname.endsWith(
                    ".html"
                  ) ||
                  pathname.endsWith(
                    ".js"
                  );

                if (
                  isStatic &&
                  response.ok
                ) {
                  const copy =
                    response.clone();

                  caches
                    .open(
                      STATIC_CACHE
                    )
                    .then(
                      (cache) =>
                        cache.put(
                          request,
                          copy
                        )
                    );
                }

                return response;
              }
            );
          }
        )
    );
  }
);

self.addEventListener(
  "notificationclick",
  (event) => {
    event.notification.close();

    const targetUrl =
      new URL(
        event.notification
          .data?.url ||
          "./",
        self.location.href
      ).href;

    event.waitUntil(
      self.clients
        .matchAll({
          type:
            "window",
          includeUncontrolled:
            true
        })
        .then(
          (windowClients) => {
            for (
              const client of
              windowClients
            ) {
              if (
                client.url.startsWith(
                  self.location.origin
                )
              ) {
                if (
                  "navigate" in
                  client
                ) {
                  client.navigate(
                    targetUrl
                  );
                }

                if (
                  "focus" in
                  client
                ) {
                  return client.focus();
                }
              }
            }

            return self.clients
              .openWindow
              ? self.clients
                  .openWindow(
                    targetUrl
                  )
              : undefined;
          }
        )
    );
  }
);
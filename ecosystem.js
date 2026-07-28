(() => {
  "use strict";

  if (!document.getElementById("personalAppsHomeStyles")) {
    const style = document.createElement("style");
    style.id = "personalAppsHomeStyles";
    style.textContent = "\n/* Personal Apps Home */\n.embedded-suite-screen[hidden] {\n  display: none !important;\n}\n\n.embedded-suite-screen {\n  position: fixed;\n  inset: 0;\n  z-index: 30000;\n  overflow-y: auto;\n  overscroll-behavior: contain;\n  background:\n    radial-gradient(circle at 10% -5%, #fff2df 0, transparent 30%),\n    #f6f7fb;\n  color: #1f2937;\n  font-family:\n    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,\n    \"Segoe UI\", sans-serif;\n}\n\n.embedded-suite-screen * {\n  box-sizing: border-box;\n}\n\n.embedded-suite-shell {\n  width: min(760px, 100%);\n  min-height: 100%;\n  margin: 0 auto;\n  padding-bottom: calc(32px + env(safe-area-inset-bottom));\n}\n\n.embedded-suite-hero {\n  position: relative;\n  overflow: hidden;\n  padding:\n    calc(24px + env(safe-area-inset-top))\n    22px\n    28px;\n  border-radius: 0 0 30px 30px;\n  background: linear-gradient(135deg, #ff6600, #ff9200);\n  color: #ffffff;\n  box-shadow: 0 14px 34px rgba(217, 95, 0, .16);\n}\n\n.embedded-suite-hero::before,\n.embedded-suite-hero::after {\n  content: \"\";\n  position: absolute;\n  border: 2px solid rgba(255, 255, 255, .14);\n  border-radius: 50%;\n  pointer-events: none;\n}\n\n.embedded-suite-hero::before {\n  width: 145px;\n  height: 145px;\n  left: -82px;\n  top: -72px;\n}\n\n.embedded-suite-hero::after {\n  width: 190px;\n  height: 190px;\n  right: -75px;\n  bottom: -100px;\n}\n\n.embedded-suite-personal-header {\n  position: relative;\n  z-index: 1;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 18px;\n}\n\n.embedded-suite-personal-copy {\n  min-width: 0;\n}\n\n.embedded-suite-greeting,\n.embedded-suite-personal-copy h1,\n.embedded-suite-profile-status {\n  margin: 0;\n}\n\n.embedded-suite-greeting {\n  color: rgba(255, 255, 255, .84);\n  font-size: 12px;\n  font-weight: 750;\n  letter-spacing: .02em;\n}\n\n.embedded-suite-personal-copy h1 {\n  max-width: 520px;\n  overflow: hidden;\n  margin-top: 3px;\n  color: #ffffff;\n  font-size: clamp(28px, 7vw, 42px);\n  font-weight: 900;\n  letter-spacing: -.045em;\n  line-height: 1.08;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.embedded-suite-status-row {\n  display: inline-flex;\n  align-items: center;\n  max-width: 100%;\n  gap: 7px;\n  margin-top: 10px;\n  border: 1px solid rgba(255, 255, 255, .27);\n  border-radius: 999px;\n  padding: 7px 10px;\n  background: rgba(255, 255, 255, .11);\n  backdrop-filter: blur(5px);\n}\n\n.embedded-suite-status-dot {\n  width: 8px;\n  height: 8px;\n  flex: 0 0 8px;\n  border-radius: 50%;\n  background: #c8ffdb;\n  box-shadow: 0 0 0 3px rgba(200, 255, 219, .16);\n}\n\n.embedded-suite-profile-status {\n  overflow: hidden;\n  color: rgba(255, 255, 255, .94);\n  font-size: 9.5px;\n  font-weight: 750;\n  line-height: 1.25;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.embedded-suite-profile-avatar {\n  display: grid;\n  width: 74px;\n  height: 74px;\n  flex: 0 0 74px;\n  place-items: center;\n  overflow: hidden;\n  border: 3px solid rgba(255, 255, 255, .92);\n  border-radius: 23px;\n  background:\n    linear-gradient(145deg, rgba(255, 255, 255, .98), #fff1df);\n  background-position: center;\n  background-size: cover;\n  color: #d95f00;\n  font-size: 29px;\n  font-weight: 950;\n  box-shadow: 0 12px 28px rgba(145, 58, 0, .2);\n}\n\n.embedded-suite-profile-avatar.has-photo {\n  color: transparent;\n}\n\n.embedded-suite-content {\n  padding: 20px 18px;\n}\n\n.embedded-suite-welcome {\n  margin-bottom: 14px;\n}\n\n.embedded-suite-welcome h2,\n.embedded-suite-welcome p {\n  margin: 0;\n}\n\n.embedded-suite-welcome h2 {\n  color: #1f2937;\n  font-size: 19px;\n}\n\n.embedded-suite-welcome p {\n  margin-top: 4px;\n  color: #6b7280;\n  font-size: 11px;\n  line-height: 1.5;\n}\n\n.embedded-suite-grid {\n  display: grid;\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n  gap: 14px;\n}\n\n.embedded-suite-card {\n  position: relative;\n  display: grid;\n  width: 100%;\n  min-height: 222px;\n  overflow: hidden;\n  border: 1px solid #eadfd2;\n  border-radius: 24px;\n  padding: 18px;\n  background: #ffffff;\n  color: inherit;\n  text-align: left;\n  text-decoration: none;\n  font: inherit;\n  box-shadow: 0 10px 28px rgba(38, 33, 27, .06);\n  cursor: pointer;\n  transition:\n    transform .16s ease,\n    box-shadow .16s ease;\n}\n\n.embedded-suite-card:hover,\n.embedded-suite-card:focus-visible {\n  transform: translateY(-3px);\n  box-shadow: 0 16px 34px rgba(38, 33, 27, .1);\n  outline: none;\n}\n\n.embedded-suite-card:active {\n  transform: scale(.985);\n}\n\n.embedded-suite-current-badge {\n  position: absolute;\n  top: 15px;\n  right: 15px;\n  border-radius: 999px;\n  padding: 5px 8px;\n  background: #fff1e3;\n  color: #d95f00;\n  font-size: 8px;\n  font-weight: 900;\n}\n\n.embedded-suite-app-icon {\n  display: grid;\n  width: 62px;\n  height: 62px;\n  place-items: center;\n  border-radius: 19px;\n  background: #fff0e0;\n  font-size: 31px;\n}\n\n.embedded-suite-card.japa .embedded-suite-app-icon {\n  background: #fff5e8;\n  color: #d95f00;\n  font-size: 35px;\n  font-weight: 900;\n}\n\n.embedded-suite-card h3 {\n  margin: 14px 0 0;\n  color: #1f2937;\n  font-size: 19px;\n  letter-spacing: -.02em;\n}\n\n.embedded-suite-card p {\n  margin: 7px 0 0;\n  color: #6b7280;\n  font-size: 10.5px;\n  line-height: 1.5;\n}\n\n.embedded-suite-tags {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 6px;\n  margin-top: 12px;\n}\n\n.embedded-suite-tag {\n  border-radius: 999px;\n  padding: 5px 8px;\n  background: #f6f7f9;\n  color: #596170;\n  font-size: 8px;\n  font-weight: 800;\n}\n\n.embedded-suite-open-row {\n  align-self: end;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 10px;\n  margin-top: 18px;\n  color: #d95f00;\n  font-size: 10px;\n  font-weight: 950;\n}\n\n.embedded-suite-arrow {\n  font-size: 22px;\n  line-height: 1;\n}\n\n.embedded-suite-privacy {\n  display: grid;\n  gap: 8px;\n  margin-top: 16px;\n  border: 1px solid #cce7d8;\n  border-radius: 18px;\n  padding: 14px 16px;\n  background: #f3fbf6;\n}\n\n.embedded-suite-privacy strong {\n  color: #17824f;\n  font-size: 11px;\n}\n\n.embedded-suite-privacy span {\n  color: #4e6d5e;\n  font-size: 9.5px;\n  line-height: 1.5;\n}\n\n.embedded-suite-footer {\n  padding: 4px 18px 0;\n  color: #6b7280;\n  text-align: center;\n  font-size: 8.5px;\n  line-height: 1.5;\n}\n\n.app-switcher-layer {\n  display: none !important;\n}\n\n.embedded-suite-settings-button {\n  width: 100%;\n}\n\n.header-app-switcher-button {\n  display: grid;\n  width: 42px;\n  height: 42px;\n  flex: 0 0 42px;\n  place-items: center;\n  margin-left: auto;\n  margin-right: 8px;\n  border: 1px solid rgba(255, 255, 255, .78);\n  border-radius: 13px;\n  background: rgba(255, 255, 255, .96);\n  color: #d95f00;\n  font: inherit;\n  font-size: 21px;\n  font-weight: 900;\n  line-height: 1;\n  cursor: pointer;\n  box-shadow: 0 5px 14px rgba(165, 71, 0, .12);\n}\n\n@media (max-width: 560px) {\n  .embedded-suite-hero {\n    padding:\n      calc(21px + env(safe-area-inset-top))\n      17px\n      23px;\n    border-radius: 0 0 24px 24px;\n  }\n\n  .embedded-suite-personal-header {\n    gap: 12px;\n  }\n\n  .embedded-suite-personal-copy h1 {\n    font-size: clamp(25px, 8vw, 34px);\n  }\n\n  .embedded-suite-profile-avatar {\n    width: 62px;\n    height: 62px;\n    flex-basis: 62px;\n    border-radius: 19px;\n    font-size: 25px;\n  }\n\n  .embedded-suite-status-row {\n    max-width: min(100%, 245px);\n  }\n\n  .embedded-suite-content {\n    padding: 17px 14px;\n  }\n\n  .embedded-suite-grid {\n    grid-template-columns: 1fr;\n    gap: 11px;\n  }\n\n  .embedded-suite-card {\n    min-height: 195px;\n    border-radius: 20px;\n    padding: 16px;\n  }\n\n  .header-app-switcher-button {\n    width: 38px;\n    height: 38px;\n    flex-basis: 38px;\n    margin-right: 6px;\n    border-radius: 11px;\n    font-size: 19px;\n  }\n}\n\n@media (max-width: 370px) {\n  .embedded-suite-profile-avatar {\n    width: 56px;\n    height: 56px;\n    flex-basis: 56px;\n    border-radius: 17px;\n  }\n\n  .embedded-suite-profile-status {\n    max-width: 185px;\n  }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .embedded-suite-card {\n    transition: none;\n  }\n}\n\n.unified-safety-card {\n  overflow: hidden;\n}\n\n.unified-safety-heading {\n  display: flex;\n  align-items: flex-start;\n  justify-content: space-between;\n  gap: 12px;\n  margin-bottom: 12px;\n}\n\n.unified-safety-heading h3 {\n  margin: 0;\n}\n\n.unified-safety-badge {\n  flex: 0 0 auto;\n  border: 1px solid #bce8d5;\n  border-radius: 999px;\n  padding: 6px 9px;\n  background: #e8f8f1;\n  color: #147a52;\n  font-size: .72rem;\n  font-weight: 800;\n  white-space: nowrap;\n}\n\n.unified-safety-list {\n  overflow: hidden;\n  border: 1px solid #e1e5ea;\n  border-radius: 14px;\n  background: #fafbfd;\n}\n\n.unified-safety-row {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 12px;\n  padding: 10px 12px;\n  border-bottom: 1px solid #e1e5ea;\n  font-size: .83rem;\n}\n\n.unified-safety-row:last-child {\n  border-bottom: 0;\n}\n\n.unified-safety-row span {\n  color: #6f7379;\n}\n\n.unified-safety-row strong {\n  color: #147a52;\n  text-align: right;\n}\n\n.unified-safety-note {\n  margin-top: 12px;\n  padding: 11px 12px;\n  border: 1px solid #c8d9ee;\n  border-radius: 14px;\n  background: #f7fbff;\n  color: #656b73;\n  font-size: .82rem;\n  line-height: 1.55;\n}\n\n.unified-safety-note strong {\n  color: #20252b;\n}\n\n.trusted-device-status {\n  margin-top: 10px;\n  padding: 10px 12px;\n  border-radius: 12px;\n  background: #fff8ef;\n  color: #7b4b18;\n  font-size: .8rem;\n  line-height: 1.5;\n}\n";
    document.head.appendChild(style);
  }
})();

(() => {
  "use strict";

  const BIRTHDAY_URL = "https://parmjee2026.github.io/Birthday-Reminder-Web-App/";
  const JAPA_URL = "https://parmeshwarbtpl-rgb.github.io/japa-counter/";

  const path = window.location.pathname.toLowerCase();
  const title = document.title.toLowerCase();

  const current =
    path.includes("japa-counter") ||
    title.includes("naam jaap")
      ? "japa"
      : "birthday";

  const SHARED_IDENTITY_KEY =
    "myApps.displayIdentity.v1";

  function readSharedIdentity() {
    try {
      const value = JSON.parse(
        localStorage.getItem(
          SHARED_IDENTITY_KEY
        ) || "{}"
      );

      return {
        name: usableName(value.name)
      };
    } catch (error) {
      console.warn(
        "Shared display identity could not be read:",
        error
      );

      return {
        name: ""
      };
    }
  }

  function saveSharedIdentity(name) {
    const safeName =
      usableName(name).slice(0, 80);

    if (!safeName) return;

    try {
      localStorage.setItem(
        SHARED_IDENTITY_KEY,
        JSON.stringify({
          name: safeName,
          savedAt: Date.now()
        })
      );
    } catch (error) {
      console.warn(
        "Shared display identity could not be saved:",
        error
      );
    }
  }

  function saveBirthdayIdentity(name) {
    if (current !== "birthday") return;

    const safeName =
      usableName(name).slice(0, 80);

    if (!safeName) return;

    try {
      const key =
        "birthdayReminder.profile.v1";

      const profile = JSON.parse(
        localStorage.getItem(key) || "{}"
      );

      localStorage.setItem(
        key,
        JSON.stringify({
          name: safeName,
          status:
            String(
              profile.status || ""
            ).trim()
        })
      );

      if (
        typeof state !== "undefined" &&
        state
      ) {
        state.userName = safeName;

        if (
          typeof saveDevicePreferences ===
          "function"
        ) {
          saveDevicePreferences();
        }

        if (
          typeof renderUserName ===
          "function"
        ) {
          renderUserName();
        }
      }
    } catch (error) {
      console.warn(
        "Birthday display identity could not be saved:",
        error
      );
    }
  }

  function consumeIdentityHandoff() {
    const raw =
      window.location.hash
        .replace(/^#/, "");

    if (!raw) return;

    const params =
      new URLSearchParams(raw);

    const incomingName =
      usableName(
        params.get("suite_name")
      );

    if (incomingName) {
      saveSharedIdentity(incomingName);
      saveBirthdayIdentity(incomingName);
    }

    if (
      params.has("suite_name") ||
      params.has("suite_enter")
    ) {
      params.delete("suite_name");
      params.delete("suite_enter");

      const cleanHash =
        params.toString();

      window.history.replaceState(
        null,
        "",
        window.location.pathname +
          window.location.search +
          (
            cleanHash
              ? `#${cleanHash}`
              : ""
          )
      );
    }
  }

  function switchWithIdentity(link) {
    const identity =
      readIdentity();

    const safeName =
      usableName(identity.name);

    if (safeName) {
      saveSharedIdentity(safeName);
    }

    const target =
      new URL(
        link.href,
        window.location.href
      );

    target.searchParams.set(
      "enter",
      "1"
    );

    const fragment =
      new URLSearchParams();

    if (safeName) {
      fragment.set(
        "suite_name",
        safeName
      );
    }

    fragment.set(
      "suite_enter",
      "1"
    );

    target.hash =
      fragment.toString();

    window.location.assign(
      target.toString()
    );
  }

  function cleanText(value) {
    return String(value || "")
      .replace(/^welcome\s*,?\s*/i, "")
      .trim();
  }

  function usableName(value) {
    const name = cleanText(value);

    if (
      !name ||
      /^google user$/i.test(name) ||
      /^user$/i.test(name)
    ) {
      return "";
    }

    return name;
  }

  function firstInitial(name) {
    const clean = cleanText(name);
    return clean ? clean.charAt(0).toUpperCase() : "G";
  }

  function textFrom(selectors) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      const text = element?.textContent?.trim();

      if (text) return text;
    }

    return "";
  }

  function birthdayIdentity() {
    let profile = {};

    try {
      profile = JSON.parse(
        localStorage.getItem("birthdayReminder.profile.v1") || "{}"
      );
    } catch (error) {
      console.warn("Birthday profile could not be read:", error);
    }

    const name =
      usableName(profile.name) ||
      usableName(
        readSharedIdentity().name
      ) ||
      usableName(
        textFrom([
          "#sidebarUserName",
          "#dashboardWelcome"
        ])
      ) ||
      "Guest";

    const status =
      String(profile.status || "").trim() ||
      textFrom([
        "#topUserStatus",
        "#sidebarUserStatus"
      ]) ||
      (
        name === "Guest"
          ? "Choose an app to continue"
          : "Private Google Contacts"
      );

    return {
      name,
      status,
      avatarSource: document.getElementById("topProfileCircle")
    };
  }

  function japaIdentity() {
    const name =
      usableName(
        textFrom([
          "#accountButton [data-user-name]",
          ".account-card [data-user-name]",
          "[data-user-name]"
        ])
      ) ||
      usableName(
        readSharedIdentity().name
      ) ||
      "User";

    const status =
      textFrom([
        "#accountButton [data-local-profile-status]",
        ".account-card [data-local-profile-status]",
        "[data-local-profile-status]"
      ]) ||
      (
        name === "Guest"
          ? "Choose an app to continue"
          : "Naam Jaap · Trusted Device"
      );

    return {
      name,
      status,
      avatarSource:
        document.querySelector(
          "#accountButton img, " +
          "img[data-user-photo], " +
          ".account-avatar img"
        ),
      initialSource:
        textFrom([
          "#accountButton [data-user-initial]",
          ".account-avatar",
          "[data-user-initial]"
        ])
    };
  }

  function readIdentity() {
    return current === "birthday"
      ? birthdayIdentity()
      : japaIdentity();
  }

  function applyAvatar(avatar, identity) {
    if (!avatar) return;

    let backgroundImage = "";
    let imageSource = "";

    const source = identity.avatarSource;

    if (source) {
      if (source instanceof HTMLImageElement) {
        imageSource =
          source.currentSrc ||
          source.src ||
          "";
      } else {
        backgroundImage =
          source.style.backgroundImage ||
          getComputedStyle(source).backgroundImage ||
          "";
      }
    }

    if (
      imageSource &&
      !imageSource.endsWith("#")
    ) {
      avatar.style.backgroundImage =
        `url("${imageSource.replace(/"/g, "%22")}")`;

      avatar.textContent = "";
      avatar.classList.add("has-photo");
      return;
    }

    if (
      backgroundImage &&
      backgroundImage !== "none" &&
      !backgroundImage.includes('url("")')
    ) {
      avatar.style.backgroundImage = backgroundImage;
      avatar.textContent = "";
      avatar.classList.add("has-photo");
      return;
    }

    avatar.style.backgroundImage = "";

    avatar.textContent =
      identity.initialSource?.trim()?.charAt(0)?.toUpperCase() ||
      firstInitial(identity.name);

    avatar.classList.remove("has-photo");
  }

  function updatePersonalHeader() {
    const identity = readIdentity();

    const nameElement =
      document.getElementById("embeddedSuiteUserName");

    const statusElement =
      document.getElementById("embeddedSuiteUserStatus");

    const avatar =
      document.getElementById("embeddedSuiteUserAvatar");

    if (nameElement) {
      nameElement.textContent = identity.name;
      nameElement.title = identity.name;
    }

    if (statusElement) {
      statusElement.textContent = identity.status;
      statusElement.title = identity.status;
    }

    applyAvatar(avatar, identity);
  }

  function card(kind) {
    const isBirthday = kind === "birthday";
    const isCurrent = kind === current;

    const tag = isCurrent ? "button" : "a";

    const attrs = isCurrent
      ? 'type="button" data-enter-current-app'
      : `href="${isBirthday ? BIRTHDAY_URL : JAPA_URL}?enter=1" data-switch-to-app`;

    const icon = isBirthday ? "🎂" : "ॐ";

    const name = isBirthday
      ? "Birthday Reminder"
      : "Naam Jaap Counter";

    const description = isBirthday
      ? "Privately manage birthdays, wishes, calendar exports, backups and your local contact copy."
      : "Continue your mantra counting, goals, history and secure account synchronization.";

    const tags = isBirthday
      ? `
        <span class="embedded-suite-tag">Contacts Read Only</span>
        <span class="embedded-suite-tag">Device Privacy</span>
        <span class="embedded-suite-tag">Calendar</span>
      `
      : `
        <span class="embedded-suite-tag">Jaap Counter</span>
        <span class="embedded-suite-tag">History</span>
        <span class="embedded-suite-tag">Secure Sync</span>
      `;

    return `
      <${tag}
        class="embedded-suite-card ${kind === "japa" ? "japa" : "birthday"}"
        ${attrs}
      >
        ${
          isCurrent
            ? '<span class="embedded-suite-current-badge">Current App</span>'
            : ""
        }

        <div class="embedded-suite-app-icon" aria-hidden="true">
          ${icon}
        </div>

        <h3>${name}</h3>

        <p>${description}</p>

        <div class="embedded-suite-tags">
          ${tags}
        </div>

        <div class="embedded-suite-open-row">
          <span>Open ${name}</span>
          <span class="embedded-suite-arrow" aria-hidden="true">→</span>
        </div>
      </${tag}>
    `;
  }

  function markup() {
    return `
      <section
        id="embeddedSuiteLauncher"
        class="embedded-suite-screen"
        aria-label="Your apps"
      >
        <div class="embedded-suite-shell">
          <header class="embedded-suite-hero">
            <div class="embedded-suite-personal-header">
              <div class="embedded-suite-personal-copy">
                <p class="embedded-suite-greeting">Welcome</p>

                <h1 id="embeddedSuiteUserName">Guest</h1>

                <div class="embedded-suite-status-row">
                  <span
                    class="embedded-suite-status-dot"
                    aria-hidden="true"
                  ></span>

                  <p
                    id="embeddedSuiteUserStatus"
                    class="embedded-suite-profile-status"
                  >
                    Choose an app to continue
                  </p>
                </div>
              </div>

              <div
                id="embeddedSuiteUserAvatar"
                class="embedded-suite-profile-avatar"
                aria-label="User profile"
              >
                G
              </div>
            </div>
          </header>

          <main class="embedded-suite-content">
            <section class="embedded-suite-welcome">
              <h2>Your Apps</h2>

              <p>
                Choose an app. Login, permissions and stored data remain separate.
              </p>
            </section>

            <section class="embedded-suite-grid" aria-label="Your apps">
              ${card("birthday")}
              ${card("japa")}
            </section>

            <section class="embedded-suite-privacy">
              <strong>🔒 Separate apps, separate data</strong>

              <span>
                Birthday Reminder contacts and Naam Jaap activity are never combined or transferred between apps.
              </span>
            </section>
          </main>

          <footer class="embedded-suite-footer">
            Choose an app to continue
          </footer>
        </div>
      </section>
    `;
  }

  function setup() {
    consumeIdentityHandoff();

    document.getElementById("headerAppSwitcherButton")?.remove();
    document.getElementById("myAppSwitcherLayer")?.remove();

    if (!document.getElementById("embeddedSuiteLauncher")) {
      document.body.insertAdjacentHTML(
        "afterbegin",
        markup()
      );
    }

    const launcher =
      document.getElementById("embeddedSuiteLauncher");

    const birthdayHeaderButton =
      document.getElementById("appSwitcherButton");

    function show() {
      const oldLayer =
        document.getElementById("appSwitcherLayer");

      if (oldLayer) oldLayer.hidden = true;

      launcher.hidden = false;
      document.body.style.overflow = "hidden";
      launcher.scrollTop = 0;

      birthdayHeaderButton?.setAttribute(
        "aria-expanded",
        "true"
      );

      document
        .getElementById("embeddedSuiteHeaderButton")
        ?.setAttribute("aria-expanded", "true");

      updatePersonalHeader();
    }

    function hide() {
      launcher.hidden = true;
      document.body.style.overflow = "";

      birthdayHeaderButton?.setAttribute(
        "aria-expanded",
        "false"
      );

      document
        .getElementById("embeddedSuiteHeaderButton")
        ?.setAttribute("aria-expanded", "false");
    }

    launcher
      .querySelectorAll("[data-enter-current-app]")
      .forEach((button) => {
        button.addEventListener("click", hide);
      });

    launcher
      .querySelectorAll("[data-switch-to-app]")
      .forEach((link) => {
        link.removeAttribute("target");
        link.removeAttribute("rel");

        link.addEventListener(
          "click",
          (event) => {
            event.preventDefault();
            switchWithIdentity(link);
          }
        );
      });

    if (birthdayHeaderButton) {
      birthdayHeaderButton.addEventListener(
        "click",
        (event) => {
          event.preventDefault();
          event.stopImmediatePropagation();
          show();
        },
        true
      );
    }

    if (current === "japa") {
      const header =
        document.querySelector(".app-header");

      const account =
        document.getElementById("accountButton");

      if (
        header &&
        account &&
        !document.getElementById("embeddedSuiteHeaderButton")
      ) {
        const button = document.createElement("button");

        button.id = "embeddedSuiteHeaderButton";
        button.className = "header-app-switcher-button";
        button.type = "button";
        button.title = "Your Apps";
        button.setAttribute("aria-label", "Open Your Apps");
        button.setAttribute("aria-haspopup", "dialog");
        button.setAttribute("aria-expanded", "false");
        button.innerHTML =
          '<span aria-hidden="true">▦</span>';

        header.insertBefore(button, account);
        button.addEventListener("click", show);
      }

      const authCard =
        document.querySelector("#authGate .auth-card");

      if (
        authCard &&
        !document.getElementById("embeddedSuiteAuthButton")
      ) {
        const button = document.createElement("button");

        button.id = "embeddedSuiteAuthButton";
        button.className = "secondary-btn full-width";
        button.type = "button";
        button.textContent = "▦ Your Apps";
        button.addEventListener("click", show);

        const privacy =
          authCard.querySelector(".privacy-note");

        authCard.insertBefore(
          button,
          privacy || null
        );
      }
    } else {
      const actions =
        document.querySelector(".login-secondary-actions");

      if (
        actions &&
        !document.getElementById("loginEmbeddedSuiteButton")
      ) {
        const button = document.createElement("button");

        button.id = "loginEmbeddedSuiteButton";
        button.className =
          "secondary-button login-install-button";

        button.type = "button";
        button.textContent = "▦ Your Apps";
        button.addEventListener("click", show);

        actions.appendChild(button);
      }
    }

    const moreAppsCard =
      document.querySelector(".more-apps-card");

    if (moreAppsCard) {
      const buttonClass =
        current === "japa"
          ? "primary-btn full-width"
          : "orange-action-button";

      moreAppsCard.innerHTML = `
        <h3>App Switcher</h3>

        <p>
          Open Birthday Reminder or Naam Jaap Counter from one screen.
          Their data remains separate.
        </p>

        <button
          class="${buttonClass} embedded-suite-settings-button"
          type="button"
          data-open-embedded-suite
        >
          ▦ Open Your Apps
        </button>
      `;

      moreAppsCard
        .querySelector("[data-open-embedded-suite]")
        ?.addEventListener("click", show);
    }

    updatePersonalHeader();

    window.setInterval(
      updatePersonalHeader,
      1200
    );

    window.addEventListener(
      "storage",
      updatePersonalHeader
    );

    document.addEventListener(
      "visibilitychange",
      () => {
        if (!document.hidden) updatePersonalHeader();
      }
    );

    const url = new URL(window.location.href);

    if (url.searchParams.get("enter") === "1") {
      hide();
      url.searchParams.delete("enter");

      window.history.replaceState(
        null,
        "",
        url.pathname +
          (url.search ? url.search : "") +
          url.hash
      );
    } else {
      show();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      setup,
      { once: true }
    );
  } else {
    setup();
  }
})();


(() => {
  "use strict";

  function buildSafetyCard() {
    if (document.getElementById("unifiedDataSafetyCard")) return;

    const settingsView = document.querySelector(
      '#settingsView, [data-view="settings"]'
    );

    const accountCard =
      settingsView?.querySelector(".account-card");

    if (!settingsView || !accountCard) return;

    const card = document.createElement("section");

    card.id = "unifiedDataSafetyCard";
    card.className = "card unified-safety-card";

    card.innerHTML = `
      <div class="unified-safety-heading">
        <div>
          <p class="eyebrow">Data Safety</p>
          <h3>App Data Safety</h3>
        </div>

        <span class="unified-safety-badge">
          Privacy First
        </span>
      </div>

      <div class="unified-safety-list">
        <div class="unified-safety-row">
          <span>Google password / client secret</span>
          <strong>Never stored</strong>
        </div>

        <div class="unified-safety-row">
          <span>Analytics / advertising SDK</span>
          <strong>Not used</strong>
        </div>

        <div class="unified-safety-row">
          <span>Birthday Reminder data received</span>
          <strong>None</strong>
        </div>
      </div>

      <div class="unified-safety-note">
        <strong>Naam Jaap data flow:</strong>
        verified Google account details and jaap activity sync through
        Google Apps Script to Google Sheets. Birthday Reminder contacts
        are not transferred to this app.
      </div>

      <div
        id="trustedDeviceStatus"
        class="trusted-device-status"
      >
        Trusted device access: checking…
      </div>
    `;

    accountCard.parentElement.insertBefore(
      card,
      accountCard
    );
  }

  function updateTrustedStatus() {
    const status =
      document.getElementById("trustedDeviceStatus");

    if (!status) return;

    const hasUser =
      typeof authState !== "undefined" &&
      Boolean(authState.user);

    const live =
      typeof isAuthenticated === "function" &&
      isAuthenticated();

    if (live) {
      status.textContent =
        "Trusted Device: active · Cloud sync is connected.";
      return;
    }

    if (hasUser) {
      status.textContent =
        "Trusted Device: local mode active · Reconnect only when cloud sync is needed.";
      return;
    }

    status.textContent =
      "Trusted Device: sign in once to verify this device.";
  }

  function initialize() {
    buildSafetyCard();
    updateTrustedStatus();

    const reconnect =
      document.getElementById("reconnectBtn");

    if (reconnect) {
      reconnect.textContent = "Reconnect Sync";
    }

    window.setInterval(
      updateTrustedStatus,
      3000
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initialize,
      { once: true }
    );
  } else {
    initialize();
  }
})();

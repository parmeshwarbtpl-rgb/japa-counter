(() => {
  const BUILD_VERSION = "5.2";
  const BUILD_LABEL = "Reminders + Install + Profile";

  function byId(id) {
    return document.getElementById(id);
  }

  function isStandaloneAppV52() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    );
  }

  function updateVersionUi() {
    document
      .querySelectorAll(".sidebar-brand small")
      .forEach((node) => {
        if (/Private Device v/i.test(node.textContent || "")) {
          node.textContent = `Private Device v${BUILD_VERSION}`;
        }
      });

    const appVersionText = byId("appVersionText");
    if (appVersionText) {
      appVersionText.textContent = `Birthday Reminder v${BUILD_VERSION}`;
    }

    const updateCard = appVersionText?.closest(".app-update-card");
    const helper = updateCard?.querySelector(".settings-helper-text");
    if (helper) {
      helper.textContent = `Build: v${BUILD_VERSION} · ${BUILD_LABEL}`;
    }

    const meta = document.querySelector('meta[name="app-build"]');
    if (meta) {
      meta.setAttribute(
        "content",
        "privacy-first-device-v5.2-reminders-install-profile"
      );
    }
  }

  function improveProfileUi() {
    const form = byId("profileSettingsForm");
    if (!form) return;

    const submit = form.querySelector('button[type="submit"]');
    if (submit) {
      submit.textContent = "Save Profile & Status";
    }

    const status = byId("settingsStatus");
    if (status) {
      status.placeholder = "e.g. Remember every special day 🎂";
      status.setAttribute(
        "aria-label",
        "Profile status"
      );
    }

    const photoInput = byId("profilePhotoInput");
    const photoEditor = photoInput?.closest(".profile-photo-editor");

    if (
      photoEditor &&
      !photoEditor.querySelector(".v52-profile-helper")
    ) {
      const helper = document.createElement("small");
      helper.className = "v52-profile-helper";
      helper.textContent =
        "Your profile photo, name and status stay only on this device.";
      photoEditor.appendChild(helper);
    }
  }

  function findAppMoreLabel() {
    const labels = Array.from(
      document.querySelectorAll(
        "#privacyView .settings-section-label"
      )
    );

    return labels.find((item) => {
      const text =
        item.querySelector("span")?.textContent?.trim() || "";
      return text === "App & More";
    }) || null;
  }

  function insertInstallWebAppCard() {
    if (byId("installWebAppSettingsCard")) {
      renderInstallState();
      return;
    }

    const privacyGrid =
      document.querySelector("#privacyView .privacy-grid");

    if (!privacyGrid) return;

    const appMoreLabel =
      findAppMoreLabel();

    const card =
      document.createElement("article");

    card.id =
      "installWebAppSettingsCard";

    card.className =
      "privacy-card settings-card install-web-app-card";

    card.innerHTML = `
      <div class="install-web-app-heading">
        <div>
          <h3>Install Web App</h3>
          <p>
            Install Birthday Reminder on your phone or computer for an app-like experience.
          </p>
        </div>
        <span id="installWebAppBadge" class="install-web-app-badge"></span>
      </div>

      <button
        id="installWebAppSettingsButton"
        class="orange-action-button"
        type="button"
      >
        ⬇ Install Birthday Reminder
      </button>

      <small id="installWebAppHelp" class="settings-helper-text">
        Works as a Progressive Web App (PWA).
      </small>
    `;

    if (appMoreLabel) {
      const next =
        appMoreLabel.nextElementSibling;

      if (next) {
        privacyGrid.insertBefore(
          card,
          next
        );
      } else {
        privacyGrid.appendChild(
          card
        );
      }
    } else {
      privacyGrid.appendChild(card);
    }

    byId("installWebAppSettingsButton")
      ?.addEventListener(
        "click",
        handleSettingsInstall
      );

    window.addEventListener(
      "appinstalled",
      renderInstallState
    );

    window
      .matchMedia(
        "(display-mode: standalone)"
      )
      .addEventListener?.(
        "change",
        renderInstallState
      );

    renderInstallState();
  }

  async function handleSettingsInstall() {
    if (isStandaloneAppV52()) {
      if (typeof showToast === "function") {
        showToast(
          "Birthday Reminder is already installed."
        );
      }
      renderInstallState();
      return;
    }

    try {
      if (
        typeof handleInstallApp ===
        "function"
      ) {
        await handleInstallApp();
        return;
      }

      const existing =
        byId("installButton");

      if (existing) {
        existing.click();
        return;
      }
    } catch (error) {
      console.warn(
        "Install action failed:",
        error
      );
    }

    if (typeof showToast === "function") {
      showToast(
        "Use your browser menu and choose Install app or Add to Home Screen.",
        true
      );
    }
  }

  function renderInstallState() {
    const badge =
      byId("installWebAppBadge");

    const button =
      byId("installWebAppSettingsButton");

    const help =
      byId("installWebAppHelp");

    if (!badge || !button) return;

    const installed =
      isStandaloneAppV52();

    badge.textContent =
      installed
        ? "Installed"
        : "PWA Ready";

    badge.classList.toggle(
      "installed",
      installed
    );

    button.disabled =
      installed;

    button.textContent =
      installed
        ? "✓ Birthday Reminder Installed"
        : "⬇ Install Birthday Reminder";

    if (help) {
      help.textContent =
        installed
          ? "Birthday Reminder is running as an installed web app."
          : "Android/desktop Chrome can show an install prompt. On iPhone/iPad use Share → Add to Home Screen.";
    }
  }

  function installStyles() {
    if (
      byId("birthdayReminderV52Styles")
    ) {
      return;
    }

    const style =
      document.createElement("style");

    style.id =
      "birthdayReminderV52Styles";

    style.textContent = `
      .install-web-app-card {
        gap: 12px;
      }

      .install-web-app-heading {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
      }

      .install-web-app-heading h3 {
        margin: 0;
      }

      .install-web-app-heading p {
        margin: 6px 0 0;
      }

      .install-web-app-badge {
        flex: 0 0 auto;
        border: 1px solid #f5c58e;
        border-radius: 999px;
        padding: 6px 9px;
        background: #fff1e2;
        color: #d95f00;
        font-size: 9px;
        font-weight: 900;
        white-space: nowrap;
      }

      .install-web-app-badge.installed {
        border-color: #bce8d5;
        background: #e8f8f1;
        color: #147a52;
      }

      .v52-profile-helper {
        display: block;
        width: 100%;
        margin-top: 6px;
        color: var(--muted);
        font-size: 9px;
        line-height: 1.45;
      }

      @media (max-width: 650px) {
        .install-web-app-heading {
          flex-direction: column;
        }

        #installWebAppSettingsButton {
          width: 100%;
        }
      }
    `;

    document.head.appendChild(
      style
    );
  }

  function initializeV52Enhancements() {
    installStyles();
    updateVersionUi();
    improveProfileUi();
    insertInstallWebAppCard();
  }

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      initializeV52Enhancements,
      { once: true }
    );
  } else {
    initializeV52Enhancements();
  }
})();
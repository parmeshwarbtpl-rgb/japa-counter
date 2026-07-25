(() => {
  const TRUSTED_DEVICE_KEY = "birthdayReminder.trustedDevice.v1";

  function byId(id) {
    return document.getElementById(id);
  }

  function isStandaloneAppUnified() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    );
  }

  function installUnifiedStyles() {
    if (byId("sharedDataSafetyStyles")) return;

    const style = document.createElement("style");
    style.id = "sharedDataSafetyStyles";
    style.textContent = `
      .shared-safety-card,
      .trusted-device-card {
        gap: 12px;
      }

      .shared-safety-heading,
      .trusted-device-heading {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
      }

      .shared-safety-heading h3,
      .trusted-device-heading h3 {
        margin: 0;
      }

      .shared-safety-badge,
      .trusted-device-badge {
        flex: 0 0 auto;
        border: 1px solid #bce8d5;
        border-radius: 999px;
        padding: 6px 9px;
        background: #e8f8f1;
        color: #147a52;
        font-size: 9px;
        font-weight: 900;
        white-space: nowrap;
      }

      .shared-safety-list {
        overflow: hidden;
        border: 1px solid var(--line);
        border-radius: 15px;
        background: #fafbfd;
      }

      .shared-safety-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        padding: 10px 12px;
        border-bottom: 1px solid var(--line);
      }

      .shared-safety-row:last-child {
        border-bottom: 0;
      }

      .shared-safety-row span {
        color: var(--muted);
        font-size: 10px;
      }

      .shared-safety-row strong {
        color: #14804a;
        font-size: 10px;
        text-align: right;
      }

      .shared-safety-app-note,
      .trusted-device-note {
        border: 1px solid #c8d9ee;
        border-radius: 14px;
        padding: 11px 12px;
        background: #f7fbff;
        color: var(--muted);
        font-size: 10px;
        line-height: 1.55;
      }

      .shared-safety-app-note strong,
      .trusted-device-note strong {
        color: var(--text);
      }

      .app-family-note {
        display: block;
        margin-top: 10px;
        color: var(--muted);
        font-size: 9px;
        line-height: 1.5;
      }

      @media (max-width: 650px) {
        .shared-safety-heading,
        .trusted-device-heading {
          flex-direction: column;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function sectionLabel(title, subtitle) {
    const label = document.createElement("div");
    label.className = "settings-section-label";
    label.innerHTML = `
      <span>${title}</span>
      <small>${subtitle}</small>
    `;
    return label;
  }

  function insertSharedDataSafety() {
    if (byId("sharedDataSafetyCard")) return;

    const grid = document.querySelector("#privacyView .privacy-grid");
    if (!grid) return;

    const dataLabel = Array.from(
      grid.querySelectorAll(".settings-section-label")
    ).find((item) =>
      (item.querySelector("span")?.textContent || "").trim() === "Data & Privacy"
    );

    const label = sectionLabel(
      "Data Safety",
      "The same safety standard used across our web apps"
    );

    const card = document.createElement("article");
    card.id = "sharedDataSafetyCard";
    card.className = "privacy-card settings-card shared-safety-card";
    card.innerHTML = `
      <div class="shared-safety-heading">
        <div>
          <h3>Shared Data Safety Standard</h3>
          <p>Clear controls, minimum access and no hidden cross-app data sharing.</p>
        </div>
        <span class="shared-safety-badge">Privacy First</span>
      </div>

      <div class="shared-safety-list">
        <div class="shared-safety-row">
          <span>Google password / client secret</span>
          <strong>Never stored</strong>
        </div>
        <div class="shared-safety-row">
          <span>Analytics / advertising SDK</span>
          <strong>Not used</strong>
        </div>
        <div class="shared-safety-row">
          <span>User-controlled clear / disconnect</span>
          <strong>Available</strong>
        </div>
        <div class="shared-safety-row">
          <span>Data shared with Naam Jaap Counter</span>
          <strong>None</strong>
        </div>
      </div>

      <div class="shared-safety-app-note">
        <strong>Birthday Reminder data flow:</strong>
        Google Contacts are requested read-only and are shown in this browser/device.
        Profile photo, status, reminder preferences and optional remembered contacts stay
        on this device. No owner-controlled Firebase, Sheets or Apps Script database is
        used for contact storage.
      </div>
    `;

    if (dataLabel) {
      grid.insertBefore(label, dataLabel);
      grid.insertBefore(card, dataLabel);
    } else {
      grid.append(label, card);
    }
  }

  function trustedReady() {
    const remember = byId("rememberContactsToggle");
    const quick = byId("quickReconnectToggle");
    return Boolean(
      isStandaloneAppUnified() &&
      remember?.checked &&
      quick?.checked
    );
  }

  function insertTrustedDeviceCard() {
    if (byId("trustedDeviceCard")) {
      renderTrustedDeviceStatus();
      return;
    }

    const grid = document.querySelector("#privacyView .privacy-grid");
    if (!grid) return;

    const card = document.createElement("article");
    card.id = "trustedDeviceCard";
    card.className = "privacy-card settings-card trusted-device-card";
    card.innerHTML = `
      <div class="trusted-device-heading">
        <div>
          <h3>Trusted Device Mode</h3>
          <p>Open the installed app without being stopped by a login screen.</p>
        </div>
        <span id="trustedDeviceBadge" class="trusted-device-badge">Checking…</span>
      </div>

      <div id="trustedDeviceNote" class="trusted-device-note"></div>

      <button
        id="enableTrustedDeviceButton"
        class="orange-action-button"
        type="button"
      >
        Enable Trusted Device Mode
      </button>
    `;

    const deviceMemoryCard = byId("rememberContactsToggle")?.closest(".privacy-card");
    if (deviceMemoryCard?.parentElement === grid) {
      grid.insertBefore(card, deviceMemoryCard);
    } else {
      grid.appendChild(card);
    }

    byId("enableTrustedDeviceButton")?.addEventListener("click", enableTrustedDevice);

    byId("rememberContactsToggle")?.addEventListener("change", renderTrustedDeviceStatus);
    byId("quickReconnectToggle")?.addEventListener("change", renderTrustedDeviceStatus);

    renderTrustedDeviceStatus();
  }

  function enableTrustedDevice() {
    try {
      localStorage.setItem(TRUSTED_DEVICE_KEY, "1");
    } catch (_error) {}

    const remember = byId("rememberContactsToggle");
    const quick = byId("quickReconnectToggle");

    if (remember && !remember.checked) {
      remember.checked = true;
      remember.dispatchEvent(new Event("change", { bubbles: true }));
    }

    if (quick && !quick.checked) {
      quick.checked = true;
      quick.dispatchEvent(new Event("change", { bubbles: true }));
    }

    if (typeof showToast === "function") {
      showToast(
        isStandaloneAppUnified()
          ? "Trusted Device Mode enabled. The installed app can reopen with saved device data."
          : "Trusted Device Mode enabled. Install the web app for the smoothest no-login opening."
      );
    }

    renderTrustedDeviceStatus();
  }

  function renderTrustedDeviceStatus() {
    const badge = byId("trustedDeviceBadge");
    const note = byId("trustedDeviceNote");
    const button = byId("enableTrustedDeviceButton");
    if (!badge || !note || !button) return;

    const installed = isStandaloneAppUnified();
    const remember = Boolean(byId("rememberContactsToggle")?.checked);
    const quick = Boolean(byId("quickReconnectToggle")?.checked);

    if (installed && remember && quick) {
      badge.textContent = "Ready";
      note.innerHTML = `
        <strong>Trusted device is ready.</strong>
        The installed app opens its saved local view first. Google authorization is
        requested only when a fresh token is needed for a new Contacts sync or when
        access has been revoked/expired.
      `;
      button.textContent = "✓ Trusted Device Enabled";
      button.disabled = true;
      return;
    }

    badge.textContent = installed ? "Setup Needed" : "Install Recommended";
    note.innerHTML = `
      <strong>${installed ? "Finish trusted-device setup." : "Install the PWA for best results."}</strong>
      Keep “Remember contacts on this device” and “Quick Google reconnect” enabled.
      Your Google password is never saved by this app.
    `;
    button.textContent = "Enable Trusted Device Mode";
    button.disabled = false;
  }

  function standardizeAppFamily() {
    const moreAppsCard = document.querySelector(".more-apps-card");
    if (!moreAppsCard) return;

    const heading = moreAppsCard.querySelector("h3");
    if (heading) heading.textContent = "App Family";

    const eyebrow = moreAppsCard.querySelector(".settings-section-label, .eyebrow");
    if (eyebrow?.classList.contains("eyebrow")) {
      eyebrow.textContent = "Integrated Apps";
    }

    if (!moreAppsCard.querySelector(".app-family-note")) {
      const note = document.createElement("small");
      note.className = "app-family-note";
      note.textContent =
        "Opening Naam Jaap Counter only navigates to the other app. Contacts, profile photo, status and birthday data are not transferred.";
      moreAppsCard.appendChild(note);
    }
  }

  function initializeUnifiedBirthdaySafety() {
    installUnifiedStyles();
    insertSharedDataSafety();
    insertTrustedDeviceCard();
    standardizeAppFamily();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializeUnifiedBirthdaySafety,
      { once: true }
    );
  } else {
    initializeUnifiedBirthdaySafety();
  }
})();
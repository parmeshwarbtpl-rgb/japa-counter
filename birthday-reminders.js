(() => {
  const STORAGE_KEY = "birthdayReminder.reminderSettings.v1";
  const FIRED_KEY = "birthdayReminder.reminderFired.v1";
  const VALID_OFFSETS = [0, 1, 3, 7];
  const DEFAULT_SETTINGS = {
    enabled: false,
    offsets: [0, 1, 3, 7]
  };

  let reminderSettings = loadReminderSettings();
  let reminderTimer = null;

  function notifyToast(message, isError = false) {
    if (typeof showToast === "function") {
      showToast(message, isError);
    } else {
      console.log(message);
    }
  }

  function normalizeOffsets(value) {
    const items = Array.isArray(value) ? value : [];
    const unique = [...new Set(
      items
        .map(Number)
        .filter((value) => VALID_OFFSETS.includes(value))
    )];
    return unique.sort((a, b) => a - b);
  }

  function loadReminderSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return {
        enabled: saved.enabled === true,
        offsets: normalizeOffsets(
          Array.isArray(saved.offsets)
            ? saved.offsets
            : DEFAULT_SETTINGS.offsets
        )
      };
    } catch (_error) {
      return { ...DEFAULT_SETTINGS };
    }
  }

  function saveReminderSettings(next = {}) {
    reminderSettings = {
      enabled:
        next.enabled !== undefined
          ? Boolean(next.enabled)
          : reminderSettings.enabled,
      offsets:
        next.offsets !== undefined
          ? normalizeOffsets(next.offsets)
          : reminderSettings.offsets
    };

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(reminderSettings)
      );
    } catch (_error) {
      // In-memory settings still work for the current session.
    }

    renderReminderSettings();
    return reminderSettings;
  }

  function reminderPermission() {
    if (!("Notification" in window)) {
      return "unsupported";
    }
    return Notification.permission;
  }

  function permissionLabel() {
    const permission = reminderPermission();
    if (permission === "granted") return "Notifications enabled";
    if (permission === "denied") return "Notifications blocked";
    if (permission === "unsupported") return "Not supported";
    return "Permission required";
  }

  function buildReminderUi() {
    if (document.getElementById("birthdayReminderSettingsCard")) {
      return;
    }

    const privacyGrid = document.querySelector("#privacyView .privacy-grid");
    if (!privacyGrid) return;

    const labels = Array.from(
      privacyGrid.querySelectorAll(".settings-section-label")
    );

    const dataPrivacyLabel = labels.find((item) => {
      const text = item.querySelector("span")?.textContent?.trim() || "";
      return text === "Data & Privacy";
    });

    const sectionLabel = document.createElement("div");
    sectionLabel.className = "settings-section-label birthday-reminder-section-label";
    sectionLabel.innerHTML = `
      <span>Birthday Reminders</span>
      <small>Local alerts and phone-calendar reminders</small>
    `;

    const card = document.createElement("article");
    card.id = "birthdayReminderSettingsCard";
    card.className = "privacy-card settings-card birthday-reminder-settings-card";
    card.innerHTML = `
      <div class="birthday-reminder-heading">
        <div>
          <h3>Birthday Reminder Alerts</h3>
          <p>
            Choose when you want to be reminded. Settings stay only on this device.
          </p>
        </div>
        <span id="birthdayReminderPermissionBadge" class="birthday-reminder-permission-badge"></span>
      </div>

      <label class="settings-toggle-row birthday-reminder-master-row">
        <div>
          <strong>Enable birthday alerts</strong>
          <span>
            While this app/PWA is open, it checks saved birthdays locally and shows notifications.
          </span>
        </div>
        <input id="birthdayReminderEnabled" type="checkbox">
      </label>

      <div class="birthday-reminder-offsets">
        <span class="birthday-reminder-field-title">Remind me</span>

        <label class="birthday-reminder-choice">
          <input type="checkbox" data-birthday-reminder-offset="0">
          <span>
            <strong>On Birthday</strong>
            <small>Celebrate today</small>
          </span>
        </label>

        <label class="birthday-reminder-choice">
          <input type="checkbox" data-birthday-reminder-offset="1">
          <span>
            <strong>1 Day Before</strong>
            <small>Tomorrow reminder</small>
          </span>
        </label>

        <label class="birthday-reminder-choice">
          <input type="checkbox" data-birthday-reminder-offset="3">
          <span>
            <strong>3 Days Before</strong>
            <small>Plan the wish early</small>
          </span>
        </label>

        <label class="birthday-reminder-choice">
          <input type="checkbox" data-birthday-reminder-offset="7">
          <span>
            <strong>7 Days Before</strong>
            <small>One-week heads-up</small>
          </span>
        </label>
      </div>

      <div class="birthday-reminder-actions">
        <button
          id="enableBirthdayNotificationsButton"
          class="secondary-button"
          type="button"
        >
          Enable Notifications
        </button>

        <button
          id="testBirthdayReminderButton"
          class="secondary-button"
          type="button"
        >
          Test Reminder
        </button>

        <button
          id="exportBirthdayCalendarRemindersButton"
          class="orange-action-button"
          type="button"
        >
          📅 Export Calendar with Reminders
        </button>
      </div>

      <div id="birthdayReminderStatus" class="birthday-reminder-status"></div>

      <small class="birthday-reminder-note">
        Privacy: reminder settings and notification history stay on this device.
        For reliable alerts when the app is fully closed, import the exported .ics
        file into your phone calendar. Existing “Add to Calendar” and “Export All”
        files also use the reminder choices selected here.
      </small>
    `;

    if (dataPrivacyLabel) {
      privacyGrid.insertBefore(sectionLabel, dataPrivacyLabel);
      privacyGrid.insertBefore(card, dataPrivacyLabel);
    } else {
      privacyGrid.append(sectionLabel, card);
    }

    bindReminderUi();
    renderReminderSettings();
  }

  function installReminderStyles() {
    if (document.getElementById("birthdayReminderEnhancementStyles")) return;

    const style = document.createElement("style");
    style.id = "birthdayReminderEnhancementStyles";
    style.textContent = `
      .birthday-reminder-settings-card {
        gap: 14px;
      }

      .birthday-reminder-heading {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
      }

      .birthday-reminder-heading h3 {
        margin: 0;
      }

      .birthday-reminder-heading p {
        margin: 6px 0 0;
      }

      .birthday-reminder-permission-badge {
        flex: 0 0 auto;
        border: 1px solid var(--line);
        border-radius: 999px;
        padding: 6px 9px;
        background: #fafbfd;
        color: var(--muted);
        font-size: 9px;
        font-weight: 900;
        white-space: nowrap;
      }

      .birthday-reminder-permission-badge.granted {
        border-color: #bce8d5;
        background: var(--green-soft);
        color: var(--green);
      }

      .birthday-reminder-permission-badge.denied {
        border-color: #f2c2bd;
        background: var(--red-soft);
        color: var(--red);
      }

      .birthday-reminder-offsets {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 9px;
      }

      .birthday-reminder-field-title {
        grid-column: 1 / -1;
        color: var(--muted);
        font-size: 10px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: .04em;
      }

      .birthday-reminder-choice {
        display: flex;
        align-items: center;
        gap: 10px;
        min-height: 64px;
        border: 1px solid var(--line);
        border-radius: 14px;
        padding: 10px 12px;
        background: #fff;
        cursor: pointer;
      }

      .birthday-reminder-choice:has(input:checked) {
        border-color: var(--orange-border, #f5c58e);
        background: var(--orange-soft, #fff1e2);
      }

      .birthday-reminder-choice input {
        width: 18px;
        height: 18px;
        min-height: 0;
        flex: 0 0 auto;
        accent-color: var(--orange, #ff7a00);
      }

      .birthday-reminder-choice span,
      .birthday-reminder-choice strong,
      .birthday-reminder-choice small {
        display: block;
      }

      .birthday-reminder-choice strong {
        color: var(--text);
        font-size: 11px;
      }

      .birthday-reminder-choice small {
        margin-top: 3px;
        color: var(--muted);
        font-size: 9px;
      }

      .birthday-reminder-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 9px;
      }

      .birthday-reminder-actions .orange-action-button {
        grid-column: 1 / -1;
      }

      .birthday-reminder-status {
        min-height: 20px;
        border-radius: 12px;
        padding: 9px 11px;
        background: #fafbfd;
        color: var(--muted);
        font-size: 10px;
        line-height: 1.5;
      }

      .birthday-reminder-note {
        color: var(--muted);
        font-size: 9px;
        line-height: 1.55;
      }

      @media (max-width: 650px) {
        .birthday-reminder-heading {
          flex-direction: column;
        }

        .birthday-reminder-offsets,
        .birthday-reminder-actions {
          grid-template-columns: 1fr;
        }

        .birthday-reminder-actions .orange-action-button {
          grid-column: auto;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function bindReminderUi() {
    const enabled = document.getElementById("birthdayReminderEnabled");
    const offsetInputs = document.querySelectorAll("[data-birthday-reminder-offset]");
    const permissionButton = document.getElementById("enableBirthdayNotificationsButton");
    const testButton = document.getElementById("testBirthdayReminderButton");
    const exportButton = document.getElementById("exportBirthdayCalendarRemindersButton");

    enabled?.addEventListener("change", async () => {
      saveReminderSettings({ enabled: enabled.checked });

      if (
        enabled.checked &&
        reminderPermission() === "default"
      ) {
        notifyToast(
          "Birthday alerts are on. Tap Enable Notifications once to allow browser alerts."
        );
      }

      if (enabled.checked) {
        checkBirthdayReminders();
      }
    });

    offsetInputs.forEach((input) => {
      input.addEventListener("change", () => {
        const offsets = Array.from(
          document.querySelectorAll("[data-birthday-reminder-offset]:checked")
        ).map((item) => Number(item.dataset.birthdayReminderOffset));

        saveReminderSettings({ offsets });
        notifyToast("Birthday reminder choices saved on this device.");
      });
    });

    permissionButton?.addEventListener(
      "click",
      requestBirthdayNotificationPermission
    );

    testButton?.addEventListener(
      "click",
      showTestBirthdayNotification
    );

    exportButton?.addEventListener("click", () => {
      if (typeof exportAllBirthdaysCalendar !== "function") {
        notifyToast("Calendar export is not available.", true);
        return;
      }

      if (!reminderSettings.offsets.length) {
        notifyToast(
          "Choose at least one reminder option before exporting.",
          true
        );
        return;
      }

      exportAllBirthdaysCalendar();
    });
  }

  function renderReminderSettings() {
    const enabled = document.getElementById("birthdayReminderEnabled");
    if (!enabled) return;

    enabled.checked = reminderSettings.enabled;

    document
      .querySelectorAll("[data-birthday-reminder-offset]")
      .forEach((input) => {
        input.checked = reminderSettings.offsets.includes(
          Number(input.dataset.birthdayReminderOffset)
        );
      });

    const permission = reminderPermission();
    const badge = document.getElementById("birthdayReminderPermissionBadge");
    const permissionButton = document.getElementById("enableBirthdayNotificationsButton");
    const status = document.getElementById("birthdayReminderStatus");

    if (badge) {
      badge.textContent = permissionLabel();
      badge.classList.toggle("granted", permission === "granted");
      badge.classList.toggle("denied", permission === "denied");
    }

    if (permissionButton) {
      permissionButton.disabled =
        permission === "granted" ||
        permission === "unsupported";

      permissionButton.textContent =
        permission === "granted"
          ? "Notifications Enabled"
          : permission === "denied"
            ? "Notifications Blocked"
            : permission === "unsupported"
              ? "Notifications Unsupported"
              : "Enable Notifications";
    }

    if (status) {
      if (!reminderSettings.enabled) {
        status.textContent =
          "Birthday alerts are off. Calendar exports can still include your selected reminder days.";
      } else if (!reminderSettings.offsets.length) {
        status.textContent =
          "Birthday alerts are on, but no reminder day is selected.";
      } else if (permission === "granted") {
        status.textContent =
          `Local alerts active for: ${reminderSettings.offsets
            .map(offsetLabel)
            .join(", ")}.`;
      } else {
        status.textContent =
          `Reminder days saved (${reminderSettings.offsets
            .map(offsetLabel)
            .join(", ")}). Enable browser notifications for app-open alerts.`;
      }
    }
  }

  function offsetLabel(offset) {
    if (offset === 0) return "Birthday day";
    if (offset === 1) return "1 day before";
    return `${offset} days before`;
  }

  async function requestBirthdayNotificationPermission() {
    if (!("Notification" in window)) {
      notifyToast(
        "Notifications are not supported in this browser. Use phone-calendar export instead.",
        true
      );
      return false;
    }

    if (Notification.permission === "granted") {
      renderReminderSettings();
      return true;
    }

    if (Notification.permission === "denied") {
      notifyToast(
        "Notifications are blocked. Enable them in this site's browser settings.",
        true
      );
      renderReminderSettings();
      return false;
    }

    const permission = await Notification.requestPermission();
    renderReminderSettings();

    if (permission === "granted") {
      notifyToast("Birthday notifications enabled.");
      return true;
    }

    notifyToast(
      "Notification permission was not granted. Calendar reminders are still available.",
      true
    );
    return false;
  }

  async function showTestBirthdayNotification() {
    const allowed =
      reminderPermission() === "granted" ||
      await requestBirthdayNotificationPermission();

    if (!allowed) return;

    await displayBirthdayNotification(
      "🎂 Test Birthday Reminder",
      "Your birthday reminder notifications are working.",
      "birthday-reminder-test"
    );
  }

  async function displayBirthdayNotification(title, body, tag) {
    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          body,
          icon: "./icon-192.png",
          badge: "./icon-192.png",
          tag,
          renotify: true,
          data: { url: "./" }
        });
        return true;
      }

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, {
          body,
          icon: "./icon-192.png",
          tag
        });
        return true;
      }
    } catch (error) {
      console.warn("Birthday reminder notification failed:", error);
    }

    notifyToast("Notification could not be displayed on this device.", true);
    return false;
  }

  function localDateKey(date = new Date()) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("-");
  }

  function daysUntilBirthday(birthday, now = new Date()) {
    if (!birthday) return null;

    const month = Number(birthday.month);
    const day = Number(birthday.day);

    if (
      !Number.isInteger(month) ||
      !Number.isInteger(day) ||
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31
    ) {
      return null;
    }

    const todayUtc = Date.UTC(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    let year = now.getFullYear();
    let candidate = safeBirthdayUtc(year, month, day);

    if (candidate < todayUtc) {
      year += 1;
      candidate = safeBirthdayUtc(year, month, day);
    }

    return Math.round((candidate - todayUtc) / 86400000);
  }

  function safeBirthdayUtc(year, month, day) {
    // Feb 29 birthdays use Feb 28 in non-leap years for reminder purposes.
    if (month === 2 && day === 29) {
      const probe = new Date(Date.UTC(year, 1, 29));
      if (probe.getUTCMonth() !== 1) {
        return Date.UTC(year, 1, 28);
      }
    }

    return Date.UTC(year, month - 1, day);
  }

  function readFiredHistory() {
    try {
      const parsed = JSON.parse(localStorage.getItem(FIRED_KEY) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (_error) {
      return {};
    }
  }

  function saveFiredHistory(history) {
    try {
      const entries = Object.entries(history)
        .sort((a, b) => String(b[1]).localeCompare(String(a[1])))
        .slice(0, 500);

      localStorage.setItem(
        FIRED_KEY,
        JSON.stringify(Object.fromEntries(entries))
      );
    } catch (_error) {
      // Notification may still be shown even when storage is unavailable.
    }
  }

  async function checkBirthdayReminders() {
    if (
      !reminderSettings.enabled ||
      !reminderSettings.offsets.length ||
      reminderPermission() !== "granted"
    ) {
      return;
    }

    if (
      typeof state === "undefined" ||
      !Array.isArray(state.contacts) ||
      !state.contacts.length
    ) {
      return;
    }

    const todayKey = localDateKey();
    const history = readFiredHistory();

    for (const offset of reminderSettings.offsets) {
      const due = state.contacts.filter((contact) => {
        if (!contact || !contact.birthday) return false;

        const dueIn = daysUntilBirthday(contact.birthday);
        if (dueIn !== offset) return false;

        const contactId =
          typeof ensureContactId === "function"
            ? ensureContactId(contact)
            : String(contact.id || contact.name || "");

        const firedKey =
          `${todayKey}|${offset}|${contactId}`;

        return history[firedKey] !== todayKey;
      });

      if (!due.length) continue;

      const names = due
        .slice(0, 3)
        .map((contact) => contact.name || "Contact");

      const extra = Math.max(0, due.length - names.length);
      const title =
        offset === 0
          ? "🎂 Birthday Today"
          : offset === 1
            ? "🎂 Birthday Tomorrow"
            : `🎂 Birthday in ${offset} Days`;

      const body =
        names.join(", ") +
        (extra ? ` +${extra} more` : "");

      const shown = await displayBirthdayNotification(
        title,
        body,
        `birthday-reminder-${todayKey}-${offset}`
      );

      if (shown) {
        due.forEach((contact) => {
          const contactId =
            typeof ensureContactId === "function"
              ? ensureContactId(contact)
              : String(contact.id || contact.name || "");

          history[
            `${todayKey}|${offset}|${contactId}`
          ] = todayKey;
        });

        saveFiredHistory(history);
      }
    }
  }

  function alarmLinesForOffset(offset) {
    const trigger =
      offset === 0
        ? "PT0M"
        : `-P${offset}D`;

    return [
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `TRIGGER:${trigger}`,
      "DESCRIPTION:Birthday Reminder",
      "END:VALARM"
    ];
  }

  function addAlarmsToCalendarText(icsText) {
    if (!reminderSettings.offsets.length) {
      return icsText;
    }

    const lines = String(icsText || "").split(/\r?\n/);
    const result = [];
    let insideEvent = false;

    for (const line of lines) {
      if (line === "BEGIN:VEVENT") {
        insideEvent = true;
        result.push(line);
        continue;
      }

      if (insideEvent && line === "END:VEVENT") {
        reminderSettings.offsets.forEach((offset) => {
          result.push(...alarmLinesForOffset(offset));
        });

        result.push(line);
        insideEvent = false;
        continue;
      }

      result.push(line);
    }

    return result.join("\r\n");
  }

  function patchCalendarExport() {
    if (
      typeof buildBirthdayCalendar !== "function" ||
      window.__birthdayReminderCalendarPatched
    ) {
      return;
    }

    const originalBuildBirthdayCalendar = buildBirthdayCalendar;

    buildBirthdayCalendar = function patchedBirthdayCalendar(contacts) {
      const base = originalBuildBirthdayCalendar(contacts);
      return addAlarmsToCalendarText(base);
    };

    window.__birthdayReminderCalendarPatched = true;

    const helper = document.querySelector(
      ".data-tools-card .settings-helper-text"
    );

    if (
      helper &&
      !helper.textContent.includes("reminder choices")
    ) {
      helper.textContent +=
        " Calendar exports include the reminder choices from Birthday Reminders.";
    }
  }

  function startReminderChecker() {
    if (reminderTimer) {
      window.clearInterval(reminderTimer);
    }

    checkBirthdayReminders();

    reminderTimer = window.setInterval(
      checkBirthdayReminders,
      60 * 1000
    );

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        checkBirthdayReminders();
      }
    });
  }

  function initializeBirthdayReminderEnhancement() {
    installReminderStyles();
    buildReminderUi();
    patchCalendarExport();
    startReminderChecker();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializeBirthdayReminderEnhancement,
      { once: true }
    );
  } else {
    initializeBirthdayReminderEnhancement();
  }
})();
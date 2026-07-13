// Privacy-friendly live clock and local Jaap reminder.
// Reminder settings stay on this device. No reminder data is sent to Google Sheets.

const REMINDER_STORAGE_KEY = "naam-jaap-local-reminder-v1";
const REMINDER_CHECK_INTERVAL_MS = 15000;
const REMINDER_WINDOW_MINUTES = 5;

const DEFAULT_REMINDER = Object.freeze({
    enabled: false,
    time: "06:00",
    label: "समय हो गया है—नाम जप करें।",
    lastTriggeredDate: "",
});

let reminderState = readReminderState();
let clockTimer = null;
let reminderTimer = null;
let reminderInitialized = false;

function reminderElements() {
    return {
        date: document.getElementById("currentDate"),
        time: document.getElementById("currentTime"),
        timezone: document.getElementById("currentTimezone"),
        enabled: document.getElementById("reminderEnabled"),
        reminderTime: document.getElementById("reminderTime"),
        label: document.getElementById("reminderLabel"),
        status: document.getElementById("reminderStatus"),
        enableNotifications: document.getElementById("enableNotificationsBtn"),
        test: document.getElementById("testReminderBtn"),
        addCalendar: document.getElementById("addCalendarBtn"),
    };
}

function sanitizeReminderState(value = {}) {
    const time = /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value.time || ""))
        ? String(value.time)
        : DEFAULT_REMINDER.time;
    const label = String(value.label || DEFAULT_REMINDER.label).trim().slice(0, 80)
        || DEFAULT_REMINDER.label;

    return {
        enabled: Boolean(value.enabled),
        time,
        label,
        lastTriggeredDate: /^\d{4}-\d{2}-\d{2}$/.test(String(value.lastTriggeredDate || ""))
            ? String(value.lastTriggeredDate)
            : "",
    };
}

function readReminderState() {
    try {
        const saved = JSON.parse(localStorage.getItem(REMINDER_STORAGE_KEY) || "{}");
        return sanitizeReminderState({ ...DEFAULT_REMINDER, ...saved });
    } catch (_error) {
        return { ...DEFAULT_REMINDER };
    }
}

function saveReminderState(partial = {}) {
    reminderState = sanitizeReminderState({ ...reminderState, ...partial });
    try {
        localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(reminderState));
    } catch (_error) {
        // In-memory reminder still works when storage is unavailable.
    }
    return reminderState;
}

function localDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function updateLiveClock() {
    const els = reminderElements();
    if (!els.date || !els.time) return;

    const now = new Date();
    els.date.textContent = new Intl.DateTimeFormat("hi-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(now);

    els.time.textContent = new Intl.DateTimeFormat("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    }).format(now);

    if (els.timezone) {
        const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Device local time";
        els.timezone.textContent = zone;
    }
}

function nextReminderDate() {
    const now = new Date();
    const [hours, minutes] = reminderState.time.split(":").map(Number);
    const next = new Date(now);
    next.setHours(hours, minutes, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    return next;
}

function renderReminderSettings() {
    const els = reminderElements();
    if (!els.enabled) return;

    els.enabled.checked = reminderState.enabled;
    els.reminderTime.value = reminderState.time;
    els.label.value = reminderState.label;

    const permission = "Notification" in window ? Notification.permission : "unsupported";
    els.enableNotifications.textContent = permission === "granted"
        ? "Notifications Enabled"
        : permission === "denied"
            ? "Notifications Blocked"
            : "Enable Notifications";
    els.enableNotifications.disabled = permission === "granted" || permission === "unsupported";

    if (!reminderState.enabled) {
        els.status.textContent = "Reminder is off.";
        return;
    }

    const next = nextReminderDate();
    const when = new Intl.DateTimeFormat("en-IN", {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    }).format(next);
    els.status.textContent = `Next reminder: ${when} • ${permission === "granted" ? "notifications allowed" : "calendar fallback recommended"}`;
}

async function requestReminderPermission() {
    if (!("Notification" in window)) {
        showReminderToast("Notifications are not supported in this browser.", "error");
        return false;
    }

    if (Notification.permission === "granted") {
        renderReminderSettings();
        return true;
    }

    if (Notification.permission === "denied") {
        showReminderToast("Notifications are blocked. Enable them in browser site settings.", "error");
        renderReminderSettings();
        return false;
    }

    const permission = await Notification.requestPermission();
    renderReminderSettings();
    if (permission === "granted") {
        showReminderToast("Notifications enabled.", "success");
        return true;
    }

    showReminderToast("Notification permission was not granted.", "error");
    return false;
}

async function showReminderNotification({ test = false } = {}) {
    const alreadyGranted = "Notification" in window && Notification.permission === "granted";
    const allowed = alreadyGranted || await requestReminderPermission();
    if (!allowed) return false;

    if (!("serviceWorker" in navigator)) {
        showReminderToast(reminderState.label, "info");
        return false;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        const selectedMantra = String(document.getElementById("mantra")?.textContent || "Naam Jaap").trim();
        await registration.showNotification(test ? "Test Jaap Reminder" : "Naam Jaap Reminder", {
            body: `${reminderState.label}\n${selectedMantra}`,
            icon: "./icon-192.png",
            badge: "./icon-192.png",
            tag: test ? "naam-jaap-reminder-test" : "naam-jaap-daily-reminder",
            renotify: true,
            requireInteraction: false,
            vibrate: [180, 80, 180],
            data: { url: "./" },
        });
        return true;
    } catch (error) {
        console.error("Reminder notification failed:", error);
        showReminderToast("Reminder could not be displayed on this device.", "error");
        return false;
    }
}

function reminderIsDue(now = new Date()) {
    if (!reminderState.enabled) return false;
    const [hours, minutes] = reminderState.time.split(":").map(Number);
    const targetMinutes = hours * 60 + minutes;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const elapsed = currentMinutes - targetMinutes;
    return elapsed >= 0 && elapsed < REMINDER_WINDOW_MINUTES;
}

async function checkReminderDue() {
    const now = new Date();
    const today = localDateKey(now);
    if (!reminderIsDue(now) || reminderState.lastTriggeredDate === today) return;

    const shown = await showReminderNotification();
    if (shown) {
        saveReminderState({ lastTriggeredDate: today });
        renderReminderSettings();
    }
}

function escapeIcsText(value) {
    return String(value || "")
        .replace(/\\/g, "\\\\")
        .replace(/\r?\n/g, "\\n")
        .replace(/,/g, "\\,")
        .replace(/;/g, "\\;");
}

function formatIcsLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");
    return `${year}${month}${day}T${hour}${minute}00`;
}

function formatIcsUtc(date = new Date()) {
    return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function downloadCalendarReminder() {
    const start = nextReminderDate();
    const end = new Date(start.getTime() + 10 * 60 * 1000);
    const uid = `naam-jaap-${Date.now()}@parmeshwarbtpl-rgb.github.io`;
    const description = `${reminderState.label} Open Naam Jaap Counter to begin your jaap.`;

    const ics = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Naam Jaap Counter//Daily Reminder//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${formatIcsUtc()}`,
        `DTSTART:${formatIcsLocal(start)}`,
        `DTEND:${formatIcsLocal(end)}`,
        "RRULE:FREQ=DAILY",
        "SUMMARY:Naam Jaap Reminder",
        `DESCRIPTION:${escapeIcsText(description)}`,
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        "TRIGGER:PT0M",
        "DESCRIPTION:Naam Jaap Reminder",
        "END:VALARM",
        "END:VEVENT",
        "END:VCALENDAR",
        "",
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "naam-jaap-daily-reminder.ics";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showReminderToast("Calendar reminder created. Open the downloaded file and confirm it in your phone calendar.", "success");
}

function showReminderToast(message, type = "info") {
    if (typeof showToast === "function") {
        showToast(message, type, 5000);
    } else {
        console.log(message);
    }
}

function bindReminderEvents() {
    const els = reminderElements();
    if (!els.enabled) return;

    els.enabled.addEventListener("change", () => {
        saveReminderState({ enabled: els.enabled.checked });
        renderReminderSettings();
        if (reminderState.enabled && (!("Notification" in window) || Notification.permission !== "granted")) {
            showReminderToast("Set the time, then enable notifications or add it to your phone calendar.", "info");
        }
        checkReminderDue();
    });

    els.reminderTime.addEventListener("change", () => {
        saveReminderState({ time: els.reminderTime.value, lastTriggeredDate: "" });
        renderReminderSettings();
        showReminderToast("Reminder time saved on this device.", "success");
    });

    els.label.addEventListener("change", () => {
        saveReminderState({ label: els.label.value });
        renderReminderSettings();
        showReminderToast("Reminder message saved.", "success");
    });

    els.enableNotifications.addEventListener("click", requestReminderPermission);
    els.test.addEventListener("click", () => showReminderNotification({ test: true }));
    els.addCalendar.addEventListener("click", downloadCalendarReminder);

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
            updateLiveClock();
            checkReminderDue();
        }
    });
}

function initializeClockAndReminder() {
    if (reminderInitialized) return;
    reminderInitialized = true;

    updateLiveClock();
    renderReminderSettings();
    bindReminderEvents();
    checkReminderDue();

    clockTimer = window.setInterval(updateLiveClock, 1000);
    reminderTimer = window.setInterval(checkReminderDue, REMINDER_CHECK_INTERVAL_MS);
}

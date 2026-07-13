// Naam Jaap Counter v2.x application

const elements = {
    counter: document.getElementById("counter"),
    today: document.getElementById("today"),
    lifetime: document.getElementById("lifetime"),
    mantra: document.getElementById("mantra"),
    mantraSelect: document.getElementById("mantraSelect"),
    tapButton: document.getElementById("tapBtn"),
    resetTodayButton: document.getElementById("resetTodayBtn"),
    resetAllButton: document.getElementById("resetAllBtn"),
    targetCurrent: document.getElementById("targetCurrent"),
    targetTotal: document.getElementById("targetTotal"),
    targetPercent: document.getElementById("targetPercent"),
    targetProgress: document.getElementById("targetProgress"),
    progressTrack: document.querySelector(".progress-track"),
    historyList: document.getElementById("historyList"),
    historyLoading: document.getElementById("historyLoading"),
    historyEmpty: document.getElementById("historyEmpty"),
    historyError: document.getElementById("historyError"),
    historyErrorText: document.getElementById("historyErrorText"),
    historyEntries: document.getElementById("historyEntries"),
    historyAdded: document.getElementById("historyAdded"),
    refreshHistoryButton: document.getElementById("refreshHistoryBtn"),
    retryHistoryButton: document.getElementById("retryHistoryBtn"),
    voiceEnabled: document.getElementById("voiceEnabled"),
    autoSpeakEnabled: document.getElementById("autoSpeakEnabled"),
    voiceSelect: document.getElementById("voiceSelect"),
    voiceHelp: document.getElementById("voiceHelp"),
    dailyTargetInput: document.getElementById("dailyTargetInput"),
    testVoiceButton: document.getElementById("testVoiceBtn"),
    installButton: document.getElementById("installAppBtn"),
    installHelp: document.getElementById("installHelp"),
    offlineBanner: document.getElementById("offlineBanner"),
};

let appSettings = readSettings();
let voices = [];
let selectedVoice = null;
let dashboardState = {
    today: 0,
    lifetime: 0,
    mantra: elements.mantraSelect.value,
};
let historyLoaded = false;
let deferredInstallPrompt = null;

function unwrapDashboardPayload(payload) {
    if (!payload || typeof payload !== "object") return {};
    if (Array.isArray(payload)) return {};

    const nested = payload.data ?? payload.dashboard ?? payload.result;
    return nested && typeof nested === "object" && !Array.isArray(nested)
        ? nested
        : payload;
}

function normalizeDashboard(payload) {
    const data = unwrapDashboardPayload(payload);
    const today = Number(data.today ?? data.todayCount ?? data.daily ?? data.count ?? 0);
    const lifetime = Number(data.lifetime ?? data.life ?? data.lifetimeCount ?? data.total ?? 0);
    const mantra = String(data.mantra ?? data.selectedMantra ?? dashboardState.mantra ?? "").trim();

    return {
        today: Number.isFinite(today) ? today : 0,
        lifetime: Number.isFinite(lifetime) ? lifetime : 0,
        mantra: mantra || elements.mantraSelect.options[0].value,
    };
}

function updateDashboard(payload, options = {}) {
    dashboardState = normalizeDashboard(payload);

    elements.counter.textContent = dashboardState.today.toLocaleString("en-IN");
    elements.today.textContent = dashboardState.today.toLocaleString("en-IN");
    elements.lifetime.textContent = dashboardState.lifetime.toLocaleString("en-IN");
    elements.mantra.textContent = dashboardState.mantra;

    const matchingOption = Array.from(elements.mantraSelect.options)
        .some(option => option.value === dashboardState.mantra);

    if (!matchingOption) {
        const option = document.createElement("option");
        option.value = dashboardState.mantra;
        option.textContent = dashboardState.mantra;
        elements.mantraSelect.appendChild(option);
    }

    elements.mantraSelect.value = dashboardState.mantra;
    updateTargetProgress();

    if (options.animate) {
        elements.counter.classList.remove("pulse");
        void elements.counter.offsetWidth;
        elements.counter.classList.add("pulse");
    }
}

function updateTargetProgress() {
    const target = Math.max(1, appSettings.dailyTarget);
    const percent = Math.min(100, Math.round((dashboardState.today / target) * 100));

    elements.targetCurrent.textContent = dashboardState.today.toLocaleString("en-IN");
    elements.targetTotal.textContent = target.toLocaleString("en-IN");
    elements.targetPercent.textContent = `${percent}%`;
    elements.targetProgress.style.width = `${percent}%`;
    elements.progressTrack.setAttribute("aria-valuenow", String(percent));
}

async function loadDashboard(options = {}) {
    setConnectionStatus("loading", "Syncing with Google Sheets…");

    try {
        const payload = await getDashboard();
        updateDashboard(payload);
        setConnectionStatus("online", "Synced with Google Sheets");

        if (options.showSuccess) {
            showToast("Dashboard refreshed.", "success");
        }
    } catch (error) {
        console.error("Dashboard load failed:", error);
        setConnectionStatus("error", "Cloud sync unavailable");
        showToast(error.message || "Dashboard could not be loaded.", "error", 5000);
    }
}

async function handleTap() {
    setButtonBusy(elements.tapButton, true, "Saving +1…");

    try {
        const payload = await addCount(1);
        updateDashboard(payload, { animate: true });
        setConnectionStatus("online", "Synced with Google Sheets");

        if (appSettings.voiceEnabled && appSettings.autoSpeakEnabled) {
            speakMantra(dashboardState.mantra);
        }

        historyLoaded = false;
    } catch (error) {
        console.error("Counter update failed:", error);
        setConnectionStatus("error", "Count was not saved");
        showToast(error.message || "Counter update failed.", "error", 5000);
    } finally {
        setButtonBusy(elements.tapButton, false);
    }
}

async function handleMantraChange() {
    const nextMantra = elements.mantraSelect.value;
    elements.mantraSelect.disabled = true;

    try {
        const payload = await saveMantra(nextMantra);
        updateDashboard(payload);
        showToast("Mantra updated.", "success");

        if (appSettings.voiceEnabled) {
            speakMantra(dashboardState.mantra);
        }
    } catch (error) {
        console.error("Mantra save failed:", error);
        elements.mantraSelect.value = dashboardState.mantra;
        showToast(error.message || "Mantra could not be saved.", "error", 5000);
    } finally {
        elements.mantraSelect.disabled = false;
    }
}

async function handleResetToday() {
    if (!window.confirm("Reset today's counter to zero?")) return;

    setButtonBusy(elements.resetTodayButton, true, "Resetting…");
    try {
        const payload = await resetToday();
        updateDashboard(payload);
        historyLoaded = false;
        showToast("Today's counter has been reset.", "success");
    } catch (error) {
        console.error("Reset today failed:", error);
        showToast(error.message || "Today's counter could not be reset.", "error", 5000);
    } finally {
        setButtonBusy(elements.resetTodayButton, false);
    }
}

async function handleResetAll() {
    const confirmed = window.confirm(
        "Reset the lifetime counter? This is a major action and cannot be undone from the app."
    );
    if (!confirmed) return;

    setButtonBusy(elements.resetAllButton, true, "Resetting…");
    try {
        const payload = await resetAll();
        updateDashboard(payload);
        historyLoaded = false;
        showToast("Lifetime counter has been reset.", "success");
    } catch (error) {
        console.error("Reset lifetime failed:", error);
        showToast(error.message || "Lifetime counter could not be reset.", "error", 5000);
    } finally {
        setButtonBusy(elements.resetAllButton, false);
    }
}

function switchView(targetName) {
    document.querySelectorAll(".view").forEach(view => {
        const active = view.dataset.view === targetName;
        view.hidden = !active;
        view.classList.toggle("active", active);
    });

    document.querySelectorAll(".nav-btn").forEach(button => {
        const active = button.dataset.target === targetName;
        button.classList.toggle("active", active);
        if (active) {
            button.setAttribute("aria-current", "page");
        } else {
            button.removeAttribute("aria-current");
        }
    });

    window.scrollTo({ top: 0, behavior: "smooth" });

    if (targetName === "history" && !historyLoaded) {
        loadHistory();
    }
}

async function loadHistory() {
    elements.historyLoading.hidden = false;
    elements.historyEmpty.hidden = true;
    elements.historyError.hidden = true;
    elements.historyList.innerHTML = "";
    elements.refreshHistoryButton.disabled = true;

    try {
        const payload = await getHistory(100);
        const entries = normalizeHistoryPayload(payload);
        renderHistory(entries);
        historyLoaded = true;
    } catch (error) {
        console.error("History load failed:", error);
        elements.historyErrorText.textContent = error.message || "Please try again.";
        elements.historyError.hidden = false;
    } finally {
        elements.historyLoading.hidden = true;
        elements.refreshHistoryButton.disabled = false;
    }
}

function renderHistory(entries) {
    const summary = historySummary(entries);
    elements.historyEntries.textContent = summary.entries.toLocaleString("en-IN");
    elements.historyAdded.textContent = summary.added.toLocaleString("en-IN");

    if (!entries.length) {
        elements.historyEmpty.hidden = false;
        return;
    }

    const fragment = document.createDocumentFragment();

    entries.forEach(entry => {
        const article = document.createElement("article");
        article.className = "history-item";

        const badge = document.createElement("div");
        badge.className = "history-badge";
        badge.setAttribute("aria-hidden", "true");
        badge.textContent = "+";

        const main = document.createElement("div");
        main.className = "history-main";

        const mantra = document.createElement("div");
        mantra.className = "history-mantra";
        mantra.textContent = entry.mantra;

        const meta = document.createElement("div");
        meta.className = "history-meta";
        meta.textContent = [entry.date, entry.time].filter(Boolean).join(" • ") || "Saved activity";

        const count = document.createElement("div");
        count.className = "history-count";
        count.textContent = entry.count.toLocaleString("en-IN");

        const countLabel = document.createElement("small");
        countLabel.textContent = entry.increment
            ? `+${entry.increment.toLocaleString("en-IN")}`
            : "total";

        main.append(mantra, meta);
        count.appendChild(countLabel);
        article.append(badge, main, count);
        fragment.appendChild(article);
    });

    elements.historyList.appendChild(fragment);
}

function loadVoices() {
    if (!("speechSynthesis" in window)) {
        elements.voiceEnabled.disabled = true;
        elements.autoSpeakEnabled.disabled = true;
        elements.voiceSelect.disabled = true;
        elements.testVoiceButton.disabled = true;
        elements.voiceHelp.textContent = "Speech synthesis is not supported in this browser.";
        return;
    }

    voices = window.speechSynthesis.getVoices();
    elements.voiceSelect.innerHTML = "";

    const automaticOption = document.createElement("option");
    automaticOption.value = "";
    automaticOption.textContent = "Automatic Hindi voice";
    elements.voiceSelect.appendChild(automaticOption);

    voices
        .filter(voice => voice.lang.startsWith("hi") || voice.lang.includes("IN") || voice.lang.startsWith("en"))
        .forEach(voice => {
            const option = document.createElement("option");
            option.value = voice.voiceURI;
            option.textContent = `${voice.name} (${voice.lang})${voice.default ? " — Default" : ""}`;
            elements.voiceSelect.appendChild(option);
        });

    elements.voiceSelect.value = appSettings.selectedVoiceURI;
    selectVoice();
}

function selectVoice() {
    selectedVoice = voices.find(voice => voice.voiceURI === appSettings.selectedVoiceURI)
        || voices.find(voice => voice.lang === "hi-IN")
        || voices.find(voice => voice.lang.startsWith("hi"))
        || voices.find(voice => voice.lang === "en-IN")
        || voices.find(voice => voice.lang.startsWith("en"))
        || null;
}

function speakMantra(text) {
    if (!appSettings.voiceEnabled || !("speechSynthesis" in window) || !text) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
    } else {
        utterance.lang = "hi-IN";
    }

    utterance.rate = 0.75;
    utterance.pitch = 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
}

function renderSettings() {
    elements.voiceEnabled.checked = appSettings.voiceEnabled;
    elements.autoSpeakEnabled.checked = appSettings.autoSpeakEnabled;
    elements.voiceSelect.value = appSettings.selectedVoiceURI;
    elements.dailyTargetInput.value = String(appSettings.dailyTarget);
    updateSettingsAvailability();
    updateTargetProgress();
}

function updateSettingsAvailability() {
    const speechAvailable = "speechSynthesis" in window;
    elements.autoSpeakEnabled.disabled = !speechAvailable || !appSettings.voiceEnabled;
    elements.voiceSelect.disabled = !speechAvailable || !appSettings.voiceEnabled;
    elements.testVoiceButton.disabled = !speechAvailable || !appSettings.voiceEnabled;
}

function persistSettings(partial, toastMessage) {
    appSettings = saveSettings({ ...appSettings, ...partial });
    selectVoice();
    renderSettings();

    if (toastMessage) {
        showToast(toastMessage, "success");
    }
}

function setupSettingsEvents() {
    elements.voiceEnabled.addEventListener("change", () => {
        persistSettings({ voiceEnabled: elements.voiceEnabled.checked }, "Voice setting saved.");
        if (!appSettings.voiceEnabled && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }
    });

    elements.autoSpeakEnabled.addEventListener("change", () => {
        persistSettings(
            { autoSpeakEnabled: elements.autoSpeakEnabled.checked },
            "Auto speak setting saved."
        );
    });

    elements.voiceSelect.addEventListener("change", () => {
        persistSettings({ selectedVoiceURI: elements.voiceSelect.value }, "Voice saved.");
    });

    elements.dailyTargetInput.addEventListener("change", () => {
        const target = Number.parseInt(elements.dailyTargetInput.value, 10);
        if (!Number.isFinite(target) || target < 1) {
            elements.dailyTargetInput.value = String(appSettings.dailyTarget);
            showToast("Daily target must be at least 1.", "error");
            return;
        }
        persistSettings({ dailyTarget: target }, "Daily target updated.");
    });

    elements.testVoiceButton.addEventListener("click", () => {
        speakMantra(dashboardState.mantra || elements.mantraSelect.value);
    });
}

function updateOnlineState() {
    const online = navigator.onLine;
    elements.offlineBanner.hidden = online;

    if (!online) {
        setConnectionStatus("offline", "Offline — cloud sync paused");
    } else if (document.getElementById("connectionText").dataset.status === "offline") {
        setConnectionStatus("online", "Back online");
        loadDashboard();
    }
}

function setupInstallPrompt() {
    window.addEventListener("beforeinstallprompt", event => {
        event.preventDefault();
        deferredInstallPrompt = event;
        elements.installButton.hidden = false;
        elements.installHelp.textContent = "Install it on your device for quick access and an app-like experience.";
    });

    elements.installButton.addEventListener("click", async () => {
        if (!deferredInstallPrompt) return;

        deferredInstallPrompt.prompt();
        const choice = await deferredInstallPrompt.userChoice;
        deferredInstallPrompt = null;
        elements.installButton.hidden = true;

        if (choice.outcome === "accepted") {
            showToast("App installation accepted.", "success");
        }
    });

    window.addEventListener("appinstalled", () => {
        elements.installButton.hidden = true;
        elements.installHelp.textContent = "Naam Jaap Counter is installed on this device.";
        showToast("Naam Jaap Counter installed.", "success");
    });
}

function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;

    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js").catch(error => {
            console.error("Service worker registration failed:", error);
        });
    });
}

function bindEvents() {
    elements.tapButton.addEventListener("click", handleTap);
    elements.mantraSelect.addEventListener("change", handleMantraChange);
    elements.resetTodayButton.addEventListener("click", handleResetToday);
    elements.resetAllButton.addEventListener("click", handleResetAll);
    elements.refreshHistoryButton.addEventListener("click", loadHistory);
    elements.retryHistoryButton.addEventListener("click", loadHistory);

    document.querySelectorAll(".nav-btn").forEach(button => {
        button.addEventListener("click", () => switchView(button.dataset.target));
    });

    window.addEventListener("online", updateOnlineState);
    window.addEventListener("offline", updateOnlineState);

    if ("speechSynthesis" in window) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }
}

function initializeApp() {
    renderSettings();
    loadVoices();
    setupSettingsEvents();
    setupInstallPrompt();
    registerServiceWorker();
    bindEvents();
    updateOnlineState();
    loadDashboard();
}

initializeApp();

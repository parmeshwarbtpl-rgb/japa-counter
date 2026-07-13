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
let authenticatedAppStarted = false;

// Mobile-friendly optimistic counter sync. Taps update the screen immediately,
// then a short burst is sent to Google Sheets as one batched request.
const TAP_SYNC_DELAY_MS = 450;
const TAP_RETRY_DELAY_MS = 3000;
let pendingTapCount = 0;
let tapSyncTimer = null;
let tapSyncPromise = null;

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
    const today = Number(
        data.today ?? data.todayCount ?? data.daily ?? data.count ?? dashboardState.today ?? 0
    );
    const lifetime = Number(
        data.lifetime ?? data.life ?? data.lifetimeCount ?? data.total ?? dashboardState.lifetime ?? 0
    );
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

function scheduleTapSync(delayMs = TAP_SYNC_DELAY_MS) {
    window.clearTimeout(tapSyncTimer);
    tapSyncTimer = window.setTimeout(() => {
        flushPendingTaps();
    }, delayMs);
}

function mergeServerDashboardWithPending(payload) {
    const data = unwrapDashboardPayload(payload);
    const serverToday = Number(data.today ?? data.todayCount ?? data.daily ?? data.count);
    const serverLifetime = Number(data.lifetime ?? data.life ?? data.lifetimeCount ?? data.total);
    const serverMantra = String(data.mantra ?? data.selectedMantra ?? dashboardState.mantra ?? "").trim();

    return {
        today: Number.isFinite(serverToday)
            ? serverToday + pendingTapCount
            : dashboardState.today,
        lifetime: Number.isFinite(serverLifetime)
            ? serverLifetime + pendingTapCount
            : dashboardState.lifetime,
        mantra: serverMantra || dashboardState.mantra,
    };
}

function flushPendingTaps() {
    window.clearTimeout(tapSyncTimer);
    tapSyncTimer = null;

    if (tapSyncPromise) return tapSyncPromise;
    if (pendingTapCount <= 0 || !isAuthenticated()) return Promise.resolve(true);

    const batchSize = pendingTapCount;
    pendingTapCount = 0;
    setConnectionStatus(
        "loading",
        batchSize > 1 ? `Syncing ${batchSize} counts…` : "Syncing count…"
    );

    tapSyncPromise = (async () => {
        try {
            const payload = await addCount(batchSize);
            updateDashboard(mergeServerDashboardWithPending(payload));
            historyLoaded = false;

            if (pendingTapCount > 0) {
                setConnectionStatus("loading", `Syncing ${pendingTapCount} pending…`);
            } else {
                setConnectionStatus("online", "Synced with Google Sheets");
            }
            return true;
        } catch (error) {
            // Keep the visible count and put the unsynced batch back in the queue.
            pendingTapCount += batchSize;
            console.error("Counter sync failed:", error);
            setConnectionStatus(
                "error",
                `${pendingTapCount} count${pendingTapCount === 1 ? "" : "s"} waiting to sync`
            );
            showToast(
                "Count is visible. Cloud sync will retry automatically.",
                "error",
                4500
            );
            return false;
        } finally {
            tapSyncPromise = null;
            if (pendingTapCount > 0) {
                scheduleTapSync(navigator.onLine ? TAP_RETRY_DELAY_MS : TAP_RETRY_DELAY_MS * 2);
            }
        }
    })();

    return tapSyncPromise;
}

async function syncPendingTapsBeforeCriticalAction() {
    window.clearTimeout(tapSyncTimer);
    tapSyncTimer = null;

    if (tapSyncPromise) await tapSyncPromise;
    if (pendingTapCount > 0) return flushPendingTaps();
    return true;
}

function handleTap() {
    // Optimistic UI: the user sees the count instantly, even on a slow mobile network.
    pendingTapCount += 1;
    dashboardState = {
        ...dashboardState,
        today: dashboardState.today + 1,
        lifetime: dashboardState.lifetime + 1,
    };
    updateDashboard(dashboardState, { animate: true });
    setConnectionStatus("loading", `${pendingTapCount} pending sync…`);
    historyLoaded = false;

    if (navigator.vibrate) navigator.vibrate(8);

    if (appSettings.voiceEnabled && appSettings.autoSpeakEnabled) {
        speakMantra(dashboardState.mantra);
    }

    scheduleTapSync();
}

async function handleMantraChange() {
    const nextMantra = elements.mantraSelect.value;
    const previousMantra = dashboardState.mantra;

    if (!(await syncPendingTapsBeforeCriticalAction())) {
        elements.mantraSelect.value = previousMantra;
        showToast("Please wait for pending counts to sync before changing mantra.", "error", 4500);
        return;
    }

    // Update immediately so the selected mantra never appears to jump back
    // when the backend returns only { success, message }.
    dashboardState.mantra = nextMantra;
    elements.mantra.textContent = nextMantra;
    elements.mantraSelect.value = nextMantra;
    elements.mantraSelect.disabled = true;

    try {
        const payload = await saveMantra(nextMantra);
        const data = unwrapDashboardPayload(payload);

        // Preserve the chosen mantra and existing counters for partial API responses.
        updateDashboard({
            ...data,
            today: data.today ?? data.todayCount ?? data.daily ?? data.count ?? dashboardState.today,
            lifetime: data.lifetime ?? data.life ?? data.lifetimeCount ?? data.total ?? dashboardState.lifetime,
            mantra: nextMantra,
        });

        showToast("Mantra updated.", "success");

        if (appSettings.voiceEnabled) {
            speakMantra(nextMantra);
        }
    } catch (error) {
        console.error("Mantra save failed:", error);
        dashboardState.mantra = previousMantra;
        elements.mantra.textContent = previousMantra;
        elements.mantraSelect.value = previousMantra;
        showToast(error.message || "Mantra could not be saved.", "error", 5000);
    } finally {
        elements.mantraSelect.disabled = false;
    }
}

async function handleResetToday() {
    if (!window.confirm("Reset today's counter to zero?")) return;
    if (!(await syncPendingTapsBeforeCriticalAction())) {
        showToast("Pending counts must sync before reset.", "error", 4500);
        return;
    }

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
    if (!(await syncPendingTapsBeforeCriticalAction())) {
        showToast("Pending counts must sync before reset.", "error", 4500);
        return;
    }

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
        syncPendingTapsBeforeCriticalAction().finally(loadHistory);
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
        const actionLabels = {
            ADD_COUNT: "+",
            MANTRA_CHANGE: "ॐ",
            RESET_TODAY: "↺",
            RESET_ALL: "!",
        };
        badge.textContent = actionLabels[entry.action] || "+";

        const main = document.createElement("div");
        main.className = "history-main";

        const mantra = document.createElement("div");
        mantra.className = "history-mantra";
        mantra.textContent = entry.mantra;

        const meta = document.createElement("div");
        meta.className = "history-meta";
        const readableAction = String(entry.action || "ADD_COUNT")
            .toLowerCase()
            .replaceAll("_", " ")
            .replace(/\b\w/g, letter => letter.toUpperCase());
        meta.textContent = [entry.date, entry.time, readableAction, entry.deviceKey]
            .filter(Boolean)
            .join(" • ") || "Saved activity";

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
    } else if (
        authenticatedAppStarted
        && document.getElementById("connectionText").dataset.status === "offline"
    ) {
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

    window.addEventListener("online", () => {
        updateOnlineState();
        if (pendingTapCount > 0) scheduleTapSync(150);
    });
    window.addEventListener("offline", updateOnlineState);

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden" && pendingTapCount > 0) {
            flushPendingTaps();
        }
    });

    if ("speechSynthesis" in window) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }
}

async function startAuthenticatedApp() {
    authenticatedAppStarted = true;
    historyLoaded = false;
    setConnectionStatus("loading", "Signed in — syncing…");
    updateOnlineState();
    await loadDashboard();
}

function stopAuthenticatedApp() {
    authenticatedAppStarted = false;
    historyLoaded = false;
    setConnectionStatus("offline", "Signed out");
}

async function initializeApp() {
    renderSettings();
    if (typeof initializeClockAndReminder === "function") {
        initializeClockAndReminder();
    }
    loadVoices();
    setupSettingsEvents();
    setupInstallPrompt();
    registerServiceWorker();
    bindEvents();
    updateOnlineState();

    await initializeAuthentication({
        onAuthenticated: startAuthenticatedApp,
        onSignedOut: stopAuthenticatedApp,
    });
}

initializeApp().catch(error => {
    console.error("Application initialization failed:", error);
    setAuthMessage(error.message || "The application could not start.", "error");
});

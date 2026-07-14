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
    progressTrack: document.querySelector(".target-card .progress-track"),
    malaProgressText: document.getElementById("malaProgressText"),
    malaProgress: document.getElementById("malaProgress"),
    malaProgressTrack: document.querySelector(".mala-progress-track"),
    todayMalas: document.getElementById("todayMalas"),
    lifetimeMalas: document.getElementById("lifetimeMalas"),
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
    offlineBannerText: document.getElementById("offlineBannerText"),
    reconnectButton: document.getElementById("reconnectBtn"),
};

let appSettings = readSettings();
let voices = [];
let selectedVoice = null;
let dashboardState = {
    today: 0,
    lifetime: 0,
    mantra: elements.mantraSelect.value,
    malaSize: 108,
    currentMalaCount: 0,
    todayMalas: 0,
    lifetimeMalas: 0,
    malasCompleted: 0,
};
let historyLoaded = false;
let deferredInstallPrompt = null;
let authenticatedAppStarted = false;
let dashboardLocalDate = offlineLocalDateKey();

// Every tap is written to durable device storage before cloud sync.
const TAP_SYNC_DELAY_MS = 650;
const TAP_RETRY_DELAY_MS = 5000;
let queueSyncTimer = null;
let queueSyncPromise = null;
let lastQueueToastAt = 0;

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
    const malaSize = Math.max(1, Number(data.malaSize ?? dashboardState.malaSize ?? 108));
    const safeToday = Number.isFinite(today) ? Math.max(0, today) : 0;
    const safeLifetime = Number.isFinite(lifetime) ? Math.max(0, lifetime) : 0;

    return {
        today: safeToday,
        lifetime: safeLifetime,
        mantra: mantra || elements.mantraSelect.options[0].value,
        malaSize,
        currentMalaCount: Math.max(0, Number(data.currentMalaCount ?? (safeToday % malaSize))),
        todayMalas: Math.max(0, Number(data.todayMalas ?? Math.floor(safeToday / malaSize))),
        lifetimeMalas: Math.max(0, Number(data.lifetimeMalas ?? Math.floor(safeLifetime / malaSize))),
        malasCompleted: Math.max(0, Number(data.malasCompleted ?? 0)),
        overallToday: data.overallToday ?? null,
        overallLifetime: data.overallLifetime ?? null,
        localDate: String(data.localDate || offlineLocalDateKey()),
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
    updateMalaProgress();
    updateTargetProgress();

    if (options.animate) {
        elements.counter.classList.remove("pulse");
        void elements.counter.offsetWidth;
        elements.counter.classList.add("pulse");
    }
}

function updateMalaProgress() {
    const malaSize = Math.max(1, Number(dashboardState.malaSize || 108));
    const current = Math.max(0, Number(dashboardState.currentMalaCount || 0));
    const percent = Math.min(100, Math.round((current / malaSize) * 100));

    if (elements.malaProgressText) {
        elements.malaProgressText.textContent = `${current.toLocaleString("en-IN")} / ${malaSize.toLocaleString("en-IN")}`;
    }
    if (elements.malaProgress) {
        elements.malaProgress.style.width = `${percent}%`;
    }
    if (elements.malaProgressTrack) {
        elements.malaProgressTrack.setAttribute("aria-valuemax", String(malaSize));
        elements.malaProgressTrack.setAttribute("aria-valuenow", String(current));
    }
    if (elements.todayMalas) {
        elements.todayMalas.textContent = dashboardState.todayMalas.toLocaleString("en-IN");
    }
    if (elements.lifetimeMalas) {
        elements.lifetimeMalas.textContent = dashboardState.lifetimeMalas.toLocaleString("en-IN");
    }
}

function showMalaCompletion(completed = 1) {
    const count = Math.max(1, Number(completed || 1));
    const message = count === 1
        ? `🎉 1 माला पूर्ण हुई — ${dashboardState.mantra}`
        : `🎉 ${count} मालाएँ पूर्ण हुईं — ${dashboardState.mantra}`;

    showToast(message, "success", 5200);
    if (navigator.vibrate) navigator.vibrate([120, 70, 120]);
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

function currentUserId() {
    return String(authState.user?.id || "");
}

function ensureCurrentLocalDay() {
    const todayKey = offlineLocalDateKey();
    if (dashboardLocalDate !== todayKey) {
        dashboardLocalDate = todayKey;
        dashboardState = {
            ...dashboardState,
            today: 0,
            currentMalaCount: 0,
            todayMalas: 0,
            malasCompleted: 0,
        };
        updateDashboard(dashboardState);
    }
}

function cacheDashboard() {
    const userId = currentUserId();
    if (!userId) return Promise.resolve();
    return offlineSaveDashboard(userId, dashboardState).catch(error => {
        console.error("Local dashboard cache failed:", error);
    });
}

async function loadLocalDashboard(mantra = "") {
    const userId = currentUserId();
    if (!userId) return false;
    const requestedMantra = String(mantra || "");
    const cached = await offlineLoadDashboard(userId, requestedMantra);
    if (!cached) {
        const fallbackMantra = requestedMantra || dashboardState.mantra;
        updateDashboard({
            today: 0,
            lifetime: 0,
            mantra: fallbackMantra,
            malaSize: 108,
            currentMalaCount: 0,
            todayMalas: 0,
            lifetimeMalas: 0,
        });
        dashboardLocalDate = offlineLocalDateKey();
        return false;
    }
    dashboardLocalDate = cached.localDate || offlineLocalDateKey();
    updateDashboard(cached);
    return true;
}

async function pendingSummary() {
    const userId = currentUserId();
    return userId
        ? offlineGetPendingSummary(userId)
        : { operations: 0, count: 0, mantraChanges: 0, countsByMantra: {}, todayCountsByMantra: {} };
}

function pendingCountsForMantra(summary, mantra = dashboardState.mantra) {
    const key = String(mantra || "");
    return {
        today: Math.max(0, Number(summary?.todayCountsByMantra?.[key] || 0)),
        lifetime: Math.max(0, Number(summary?.countsByMantra?.[key] || 0)),
    };
}

function mergeServerDashboardWithPending(payload, pendingToday = 0, pendingLifetime = pendingToday, preserveLocalMantra = false) {
    const data = normalizeDashboard(payload);
    const mantra = preserveLocalMantra ? dashboardState.mantra : data.mantra;
    const sameMantra = String(data.mantra) === String(mantra);
    const baseToday = sameMantra ? data.today : dashboardState.today;
    const baseLifetime = sameMantra ? data.lifetime : dashboardState.lifetime;
    const today = Math.max(0, Number(baseToday || 0) + Number(pendingToday || 0));
    const lifetime = Math.max(0, Number(baseLifetime || 0) + Number(pendingLifetime || 0));
    const malaSize = Math.max(1, Number(data.malaSize || dashboardState.malaSize || 108));

    return {
        ...data,
        today,
        lifetime,
        mantra,
        malaSize,
        currentMalaCount: today % malaSize,
        todayMalas: Math.floor(today / malaSize),
        lifetimeMalas: Math.floor(lifetime / malaSize),
        malasCompleted: 0,
    };
}

async function loadDashboard(options = {}) {
    if (!navigator.onLine || !isAuthenticated()) {
        await loadLocalDashboard();
        const summary = await pendingSummary();
        setConnectionStatus("offline", summary.count
            ? `Offline — ${summary.count} saved locally`
            : "Offline — ready to count");
        return;
    }

    setConnectionStatus("loading", "Syncing with Google Sheets…");
    try {
        const requestedMantra = options.mantra !== undefined
            ? String(options.mantra || "")
            : dashboardState.mantra;
        const payload = await getDashboard(requestedMantra, offlineLocalDateKey());
        const summary = await pendingSummary();
        const pending = pendingCountsForMantra(summary);
        updateDashboard(mergeServerDashboardWithPending(
            payload,
            pending.today,
            pending.lifetime,
            summary.mantraChanges > 0
        ));
        dashboardLocalDate = offlineLocalDateKey();
        await cacheDashboard();
        setConnectionStatus("online", summary.operations
            ? `${summary.count} count${summary.count === 1 ? "" : "s"} waiting to sync`
            : "Synced with Google Sheets");

        if (options.showSuccess) showToast("Dashboard refreshed.", "success");
    } catch (error) {
        console.error("Dashboard load failed:", error);
        await loadLocalDashboard();
        setConnectionStatus("error", "Cloud unavailable — using saved data");
        if (options.showError !== false) {
            showToast("Using offline data. Cloud sync will retry.", "error", 4500);
        }
    }
}

function scheduleQueueSync(delayMs = TAP_SYNC_DELAY_MS) {
    window.clearTimeout(queueSyncTimer);
    queueSyncTimer = window.setTimeout(() => flushOfflineQueue(), delayMs);
}

async function refreshPendingStatus() {
    const summary = await pendingSummary();
    if (!navigator.onLine) {
        setConnectionStatus("offline", summary.count
            ? `Offline — ${summary.count} saved locally`
            : "Offline — ready to count");
    } else if (!isAuthenticated()) {
        setConnectionStatus("offline", summary.count
            ? `Sign in to sync ${summary.count} saved counts`
            : "Sign in to sync");
    } else if (summary.operations) {
        setConnectionStatus("loading", summary.count
            ? `Syncing ${summary.count} saved counts…`
            : "Syncing saved changes…");
    } else {
        setConnectionStatus("online", "Synced with Google Sheets");
    }
    return summary;
}

async function syncOneOfflineOperation(operation) {
    await offlineMarkSyncing(operation.id);
    try {
        let payload;
        if (operation.type === "COUNT") {
            payload = await addCount(operation.count, operation.id, {
                clientCreatedAt: operation.createdAt,
                localDate: operation.localDate,
                dashboardDate: offlineLocalDateKey(),
                mantra: operation.mantra,
            });
        } else if (operation.type === "MANTRA") {
            payload = await saveMantra(operation.mantra, operation.id, offlineLocalDateKey());
        } else {
            throw new Error("Unsupported offline operation.");
        }

        await offlineCompleteOperation(operation.id);
        const summary = await pendingSummary();
        const payloadMantra = String(unwrapDashboardPayload(payload).mantra || operation.mantra || "");

        if (payloadMantra === dashboardState.mantra) {
            const pending = pendingCountsForMantra(summary, dashboardState.mantra);
            updateDashboard(mergeServerDashboardWithPending(
                payload,
                pending.today,
                pending.lifetime,
                false
            ));
            await cacheDashboard();
        } else {
            await offlineSaveDashboard(currentUserId(), normalizeDashboard({
                ...unwrapDashboardPayload(payload),
                mantra: payloadMantra,
            }), { setSelected: false });
        }

        historyLoaded = false;
        return true;
    } catch (error) {
        await offlineMarkPending(operation.id, error).catch(() => undefined);
        throw error;
    }
}

function flushOfflineQueue() {
    window.clearTimeout(queueSyncTimer);
    queueSyncTimer = null;

    if (queueSyncPromise) return queueSyncPromise;
    if (!navigator.onLine || !isAuthenticated()) return Promise.resolve(false);

    offlineCloseActiveCountBatch();
    queueSyncPromise = (async () => {
        await offlineWaitForWrites();
        const operations = await offlineListPending(currentUserId());
        if (!operations.length) {
            await refreshPendingStatus();
            return true;
        }

        await refreshPendingStatus();
        for (const operation of operations) {
            try {
                await syncOneOfflineOperation(operation);
            } catch (error) {
                console.error("Offline sync failed:", error);
                setConnectionStatus("error", "Saved locally — sync will retry");
                const now = Date.now();
                if (now - lastQueueToastAt > 8000) {
                    lastQueueToastAt = now;
                    showToast("Your count is safe on this device. Sync will retry automatically.", "error", 5000);
                }
                scheduleQueueSync(TAP_RETRY_DELAY_MS);
                return false;
            }
        }

        try {
            const server = await getDashboard(dashboardState.mantra, offlineLocalDateKey());
            const summary = await pendingSummary();
            const pending = pendingCountsForMantra(summary);
            updateDashboard(mergeServerDashboardWithPending(
                server,
                pending.today,
                pending.lifetime
            ));
            await cacheDashboard();
        } catch (error) {
            console.warn("Post-sync dashboard refresh failed:", error);
        }
        await refreshPendingStatus();
        return true;
    })().finally(() => {
        queueSyncPromise = null;
    });

    return queueSyncPromise;
}

async function syncQueueBeforeCriticalAction() {
    await offlineWaitForWrites();
    if (queueSyncPromise) await queueSyncPromise;
    if (!navigator.onLine || !isAuthenticated()) return false;
    await flushOfflineQueue();
    const summary = await pendingSummary();
    return summary.operations === 0;
}

function handleTap(event) {
    if (!hasActiveAppSession()) return;
    ensureCurrentLocalDay();

    const previousMalas = Math.max(0, Number(dashboardState.todayMalas || 0));
    const malaSize = Math.max(1, Number(dashboardState.malaSize || 108));
    const nextToday = dashboardState.today + 1;
    const nextLifetime = dashboardState.lifetime + 1;

    dashboardState = {
        ...dashboardState,
        today: nextToday,
        lifetime: nextLifetime,
        currentMalaCount: nextToday % malaSize,
        todayMalas: Math.floor(nextToday / malaSize),
        lifetimeMalas: Math.floor(nextLifetime / malaSize),
        malasCompleted: 0,
    };
    updateDashboard(dashboardState, { animate: true });
    historyLoaded = false;

    if (dashboardState.todayMalas > previousMalas) {
        showMalaCompletion(dashboardState.todayMalas - previousMalas);
    }

    offlineQueueCount({
        userId: currentUserId(),
        deviceKey: authState.deviceKey,
        mantra: dashboardState.mantra,
        count: 1,
        dashboard: dashboardState,
    }).then(() => {
        refreshPendingStatus();
        if (navigator.onLine && isAuthenticated()) scheduleQueueSync();
    }).catch(error => {
        console.error("Offline count save failed:", error);
        showToast("This count could not be saved on the device.", "error", 5000);
    });

    if (navigator.vibrate) navigator.vibrate(8);
    if (appSettings.voiceEnabled && appSettings.autoSpeakEnabled) {
        speakMantra(dashboardState.mantra);
    }
}

async function handleMantraChange() {
    const nextMantra = elements.mantraSelect.value;
    const previousState = { ...dashboardState };

    try {
        await cacheDashboard();
        await loadLocalDashboard(nextMantra);

        await offlineQueueMantra({
            userId: currentUserId(),
            deviceKey: authState.deviceKey,
            mantra: nextMantra,
            dashboard: dashboardState,
        });

        historyLoaded = false;
        showToast(navigator.onLine && isAuthenticated()
            ? "Mantra selected; loading its separate count…"
            : "Mantra selected offline.", "success");
        if (appSettings.voiceEnabled) speakMantra(nextMantra);
        await refreshPendingStatus();
        if (navigator.onLine && isAuthenticated()) scheduleQueueSync(100);
    } catch (error) {
        console.error("Mantra queue failed:", error);
        updateDashboard(previousState);
        showToast("Mantra could not be changed on this device.", "error", 5000);
    }
}

async function handleResetToday() {
    if (!navigator.onLine || !isAuthenticated()) {
        showToast("Reset is disabled offline to prevent data conflicts.", "error", 4500);
        return;
    }
    if (!window.confirm(`Reset today's count for ${dashboardState.mantra}?`)) return;
    if (!(await syncQueueBeforeCriticalAction())) {
        showToast("Saved offline counts must sync before reset.", "error", 4500);
        return;
    }

    setButtonBusy(elements.resetTodayButton, true, "Resetting…");
    try {
        const payload = await resetToday(dashboardState.mantra, offlineLocalDateKey());
        updateDashboard(payload);
        dashboardLocalDate = offlineLocalDateKey();
        await cacheDashboard();
        historyLoaded = false;
        showToast("This mantra's today count has been reset.", "success");
    } catch (error) {
        console.error("Reset today failed:", error);
        showToast(error.message || "Today's counter could not be reset.", "error", 5000);
    } finally {
        setButtonBusy(elements.resetTodayButton, false);
    }
}

async function handleResetAll() {
    if (!navigator.onLine || !isAuthenticated()) {
        showToast("Lifetime reset is disabled offline.", "error", 4500);
        return;
    }
    const confirmed = window.confirm(
        `Reset all saved counts for ${dashboardState.mantra}? This cannot be undone.`
    );
    if (!confirmed) return;
    if (!(await syncQueueBeforeCriticalAction())) {
        showToast("Saved offline counts must sync before reset.", "error", 4500);
        return;
    }

    setButtonBusy(elements.resetAllButton, true, "Resetting…");
    try {
        const payload = await resetAll(dashboardState.mantra, offlineLocalDateKey());
        updateDashboard(payload);
        await cacheDashboard();
        historyLoaded = false;
        showToast("This mantra's lifetime count has been reset.", "success");
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
        flushOfflineQueue().finally(loadHistory);
    }
}

async function loadHistory() {
    if (!navigator.onLine || !isAuthenticated()) {
        elements.historyLoading.hidden = true;
        elements.historyEmpty.hidden = true;
        elements.historyList.innerHTML = "";
        elements.historyErrorText.textContent = "History needs internet and Google sign-in. Your offline counts remain safely queued.";
        elements.historyError.hidden = false;
        return;
    }
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

async function updateOnlineState() {
    const online = navigator.onLine;
    const summary = hasActiveAppSession() ? await pendingSummary() : { operations: 0, count: 0 };

    if (!online) {
        elements.offlineBanner.hidden = false;
        if (elements.offlineBannerText) {
            elements.offlineBannerText.textContent = summary.count
                ? `Offline: ${summary.count} count${summary.count === 1 ? "" : "s"} saved on this device.`
                : "Offline mode is active. New counts will be saved on this device.";
        }
        if (elements.reconnectButton) elements.reconnectButton.hidden = true;
        elements.resetTodayButton.disabled = true;
        elements.resetAllButton.disabled = true;
        await refreshPendingStatus();
        return;
    }

    elements.resetTodayButton.disabled = !isAuthenticated();
    elements.resetAllButton.disabled = !isAuthenticated();

    if (hasActiveAppSession() && !isAuthenticated()) {
        elements.offlineBanner.hidden = false;
        if (elements.offlineBannerText) {
            elements.offlineBannerText.textContent = summary.count
                ? `Back online. Sign in to sync ${summary.count} saved count${summary.count === 1 ? "" : "s"}.`
                : "Back online. Sign in to restore cloud sync.";
        }
        if (elements.reconnectButton) elements.reconnectButton.hidden = false;
        await refreshPendingStatus();
        return;
    }

    elements.offlineBanner.hidden = true;
    if (elements.reconnectButton) elements.reconnectButton.hidden = true;
    if (authenticatedAppStarted && isAuthenticated()) {
        scheduleQueueSync(150);
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

    window.addEventListener("online", async () => {
        await updateOnlineState();
        if (isAuthenticated()) scheduleQueueSync(150);
    });
    window.addEventListener("offline", updateOnlineState);

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
            offlineWaitForWrites();
            if (navigator.onLine && isAuthenticated()) flushOfflineQueue();
        }
    });

    if ("speechSynthesis" in window) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }
}

async function startAuthenticatedApp() {
    authenticatedAppStarted = true;
    historyLoaded = false;
    await updateOnlineState();

    if (authState.offlineMode || !navigator.onLine || !isAuthenticated()) {
        await loadLocalDashboard();
        await refreshPendingStatus();
        return;
    }

    setConnectionStatus("loading", "Signed in — syncing…");
    const restoredLocal = await loadLocalDashboard("").catch(() => false);
    await loadDashboard({
        showError: false,
        mantra: restoredLocal ? dashboardState.mantra : "",
    });
    scheduleQueueSync(100);
}

function stopAuthenticatedApp(options = {}) {
    historyLoaded = false;
    if (options.keepOfflineSession && hasActiveAppSession()) {
        authenticatedAppStarted = true;
        updateOnlineState();
        return;
    }
    authenticatedAppStarted = false;
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
    await updateOnlineState();

    await initializeAuthentication({
        onAuthenticated: startAuthenticatedApp,
        onSignedOut: stopAuthenticatedApp,
    });
}

initializeApp().catch(error => {
    console.error("Application initialization failed:", error);
    setAuthMessage(error.message || "The application could not start.", "error");
});

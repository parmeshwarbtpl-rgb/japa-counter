// Naam Jaap Counter v2.9.3 — selected mantra mala isolation

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
    goalJaapText: document.getElementById("goalJaapText"),
    goalRemaining: document.getElementById("goalRemaining"),
    goalMantraLabel: document.getElementById("goalMantraLabel"),
    goalSettingsMantra: document.getElementById("goalSettingsMantra"),
    malaGoalForm: document.getElementById("malaGoalForm"),
    malaGoalInput: document.getElementById("malaGoalInput"),
    saveMalaGoalButton: document.getElementById("saveMalaGoalBtn"),
    malaGoalHelp: document.getElementById("malaGoalHelp"),
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
    goalMalas: 1,
    goalTargetCount: 108,
    goalCompleted: false,
};
let historyLoaded = false;
let deferredInstallPrompt = null;
let authenticatedAppStarted = false;
let dashboardLocalDate = offlineLocalDateKey();
let dashboardRequestSerial = 0;

// Every tap is written to durable device storage before cloud sync.
const TAP_SYNC_DELAY_MS = 650;
const TAP_RETRY_DELAY_MS = 5000;
let queueSyncTimer = null;
let queueSyncPromise = null;
let lastQueueToastAt = 0;

const MALA_GOAL_CACHE_KEY = "naam-jaap-mala-goals-v1";
const MALA_GOAL_MAX = 10000;

function normalizeMantraText(value) {
    return String(value || "").normalize("NFC").trim();
}

function sameMantraText(left, right) {
    const first = normalizeMantraText(left);
    const second = normalizeMantraText(right);
    return Boolean(first && second && first === second);
}

function selectedMantraText() {
    return normalizeMantraText(
        elements.mantraSelect?.value || dashboardState?.mantra || ""
    );
}

function readMalaGoalCache() {
    try {
        const parsed = JSON.parse(localStorage.getItem(MALA_GOAL_CACHE_KEY) || "{}");
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch (_error) {
        return {};
    }
}

function malaGoalCacheKey(userId, mantra) {
    return `${String(userId || "")}:${encodeURIComponent(normalizeMantraText(mantra))}`;
}

function getCachedMalaGoal(userId, mantra) {
    const cache = readMalaGoalCache();
    const value = Number.parseInt(cache[malaGoalCacheKey(userId, mantra)], 10);
    return Number.isFinite(value) && value >= 1
        ? Math.min(value, MALA_GOAL_MAX)
        : 1;
}

function cacheMalaGoal(userId, mantra, goalMalas) {
    if (!userId || !mantra) return;
    const safeGoal = Math.max(1, Math.min(MALA_GOAL_MAX, Number.parseInt(goalMalas, 10) || 1));
    const cache = readMalaGoalCache();
    cache[malaGoalCacheKey(userId, mantra)] = safeGoal;
    localStorage.setItem(MALA_GOAL_CACHE_KEY, JSON.stringify(cache));
}

function goalCompletionKey() {
    return [
        "naam-jaap-goal-complete",
        currentUserId(),
        offlineLocalDateKey(),
        encodeURIComponent(normalizeMantraText(dashboardState.mantra)),
        dashboardState.goalMalas,
    ].join(":");
}

function showDailyMalaGoalCompletion() {
    const key = goalCompletionKey();
    if (localStorage.getItem(key) === "1") return;
    localStorage.setItem(key, "1");
    showToast(
        `🎯 आज का ${dashboardState.goalMalas} माला लक्ष्य पूर्ण हुआ — ${dashboardState.mantra}`,
        "success",
        6500
    );
    if (navigator.vibrate) navigator.vibrate([180, 80, 180, 80, 260]);
}

function unwrapDashboardPayload(payload) {
    if (!payload || typeof payload !== "object") return {};
    if (Array.isArray(payload)) return {};

    const nested = payload.data ?? payload.dashboard ?? payload.result;
    return nested && typeof nested === "object" && !Array.isArray(nested)
        ? nested
        : payload;
}

function normalizeDashboard(payload, expectedMantra = "") {
    const data = unwrapDashboardPayload(payload);
    const requestedMantra = normalizeMantraText(expectedMantra);
    const responseMantra = normalizeMantraText(data.mantra ?? data.selectedMantra ?? "");
    const stateMantra = normalizeMantraText(dashboardState.mantra);
    const fallbackMantra = normalizeMantraText(elements.mantraSelect.options[0]?.value || "");
    const mantra = requestedMantra || responseMantra || stateMantra || fallbackMantra;
    const mayReuseState = !requestedMantra || sameMantraText(requestedMantra, stateMantra);

    const todayValue = data.today ?? data.todayCount ?? data.daily ?? data.count;
    const lifetimeValue = data.lifetime ?? data.life ?? data.lifetimeCount ?? data.total;
    const today = Number(todayValue !== undefined
        ? todayValue
        : (mayReuseState ? dashboardState.today : 0));
    const lifetime = Number(lifetimeValue !== undefined
        ? lifetimeValue
        : (mayReuseState ? dashboardState.lifetime : 0));
    const malaSize = Math.max(1, Number(data.malaSize ?? dashboardState.malaSize ?? 108));
    const safeToday = Number.isFinite(today) ? Math.max(0, today) : 0;
    const safeLifetime = Number.isFinite(lifetime) ? Math.max(0, lifetime) : 0;
    const goalMalas = Math.max(1, Number.parseInt(
        data.goalMalas ?? getCachedMalaGoal(currentUserId(), mantra),
        10
    ) || 1);

    return {
        today: safeToday,
        lifetime: safeLifetime,
        mantra,
        malaSize,
        // Mala values are always derived from this selected mantra's counts.
        currentMalaCount: safeToday % malaSize,
        todayMalas: Math.floor(safeToday / malaSize),
        lifetimeMalas: Math.floor(safeLifetime / malaSize),
        malasCompleted: Math.max(0, Number(data.malasCompleted ?? 0)),
        overallToday: null,
        overallLifetime: null,
        localDate: String(data.localDate || offlineLocalDateKey()),
        goalMalas,
        goalTargetCount: Math.max(malaSize, Number(
            data.goalTargetCount ?? data.targetJaap ?? (goalMalas * malaSize)
        )),
        goalCompleted: Boolean(data.goalCompleted),
    };
}

function updateDashboard(payload, options = {}) {
    dashboardState = normalizeDashboard(payload, options.expectedMantra || "");

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
    cacheMalaGoal(currentUserId(), dashboardState.mantra, dashboardState.goalMalas);
    updateMalaProgress();
    updateTargetProgress();
    renderMalaGoalSettings();

    if (options.animate) {
        elements.counter.classList.remove("pulse");
        void elements.counter.offsetWidth;
        elements.counter.classList.add("pulse");
    }
}

function updateMalaProgress() {
    const malaSize = Math.max(1, Number(dashboardState.malaSize || 108));
    const selectedToday = Math.max(0, Number(dashboardState.today || 0));
    const selectedLifetime = Math.max(0, Number(dashboardState.lifetime || 0));
    const current = selectedToday % malaSize;
    const todayMalas = Math.floor(selectedToday / malaSize);
    const lifetimeMalas = Math.floor(selectedLifetime / malaSize);
    const percent = Math.min(100, Math.round((current / malaSize) * 100));

    // Never use an overall/all-mantra total for the mala card.
    dashboardState.currentMalaCount = current;
    dashboardState.todayMalas = todayMalas;
    dashboardState.lifetimeMalas = lifetimeMalas;
    dashboardState.overallToday = null;
    dashboardState.overallLifetime = null;

    if (elements.malaProgressText) {
        elements.malaProgressText.textContent = `${current.toLocaleString("en-IN")} / ${malaSize.toLocaleString("en-IN")}`;
    }
    if (elements.malaProgress) {
        elements.malaProgress.style.width = `${percent}%`;
    }
    if (elements.malaProgressTrack) {
        elements.malaProgressTrack.setAttribute("aria-valuemax", String(malaSize));
        elements.malaProgressTrack.setAttribute("aria-valuenow", String(current));
        elements.malaProgressTrack.setAttribute(
            "aria-label",
            `${dashboardState.mantra} current mala progress`
        );
    }
    if (elements.todayMalas) {
        elements.todayMalas.textContent = todayMalas.toLocaleString("en-IN");
    }
    if (elements.lifetimeMalas) {
        elements.lifetimeMalas.textContent = lifetimeMalas.toLocaleString("en-IN");
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
    const malaSize = Math.max(1, Number(dashboardState.malaSize || 108));
    const goalMalas = Math.max(1, Number.parseInt(dashboardState.goalMalas, 10) || 1);
    const targetJaap = goalMalas * malaSize;
    const todayJaap = Math.max(0, Number(dashboardState.today || 0));
    const completedMalas = Math.floor(todayJaap / malaSize);
    const percent = Math.min(100, Math.round((todayJaap / targetJaap) * 100));
    const remainingJaap = Math.max(0, targetJaap - todayJaap);
    const remainingMalas = Math.floor(remainingJaap / malaSize);
    const remainingPart = remainingJaap % malaSize;

    dashboardState.goalMalas = goalMalas;
    dashboardState.goalTargetCount = targetJaap;
    dashboardState.goalCompleted = todayJaap >= targetJaap;

    elements.targetCurrent.textContent = Math.min(completedMalas, goalMalas).toLocaleString("en-IN");
    elements.targetTotal.textContent = goalMalas.toLocaleString("en-IN");
    elements.targetPercent.textContent = `${percent}%`;
    elements.targetProgress.style.width = `${percent}%`;
    elements.progressTrack.setAttribute("aria-valuenow", String(percent));

    if (elements.goalMantraLabel) {
        elements.goalMantraLabel.textContent = dashboardState.mantra;
    }
    if (elements.goalJaapText) {
        elements.goalJaapText.textContent = `${todayJaap.toLocaleString("en-IN")} / ${targetJaap.toLocaleString("en-IN")} जाप`;
    }
    if (elements.goalRemaining) {
        if (remainingJaap === 0) {
            elements.goalRemaining.textContent = "आज का लक्ष्य पूर्ण हुआ";
            elements.goalRemaining.dataset.complete = "true";
        } else {
            const parts = [];
            if (remainingMalas) parts.push(`${remainingMalas.toLocaleString("en-IN")} माला`);
            if (remainingPart) parts.push(`${remainingPart.toLocaleString("en-IN")} जाप`);
            elements.goalRemaining.textContent = `Remaining: ${parts.join(" ")}`;
            elements.goalRemaining.dataset.complete = "false";
        }
    }
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

    const requestedMantra = normalizeMantraText(mantra || selectedMantraText());
    const cached = await offlineLoadDashboard(userId, requestedMantra);
    const validCache = cached && (
        !requestedMantra || sameMantraText(cached.mantra, requestedMantra)
    );

    if (!validCache) {
        const fallbackMantra = requestedMantra || selectedMantraText() || dashboardState.mantra;
        updateDashboard({
            today: 0,
            lifetime: 0,
            mantra: fallbackMantra,
            malaSize: 108,
            currentMalaCount: 0,
            todayMalas: 0,
            lifetimeMalas: 0,
            goalMalas: getCachedMalaGoal(userId, fallbackMantra),
            goalTargetCount: getCachedMalaGoal(userId, fallbackMantra) * 108,
        }, { expectedMantra: fallbackMantra });
        dashboardLocalDate = offlineLocalDateKey();
        return false;
    }

    const cacheMantra = requestedMantra || normalizeMantraText(cached.mantra);
    dashboardLocalDate = cached.localDate || offlineLocalDateKey();
    updateDashboard(cached, { expectedMantra: cacheMantra });
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

function mergeServerDashboardWithPending(
    payload,
    pendingToday = 0,
    pendingLifetime = pendingToday,
    selectedMantra = dashboardState.mantra,
    preserveLocalCounts = false
) {
    const expectedMantra = normalizeMantraText(selectedMantra || dashboardState.mantra);
    const rawData = unwrapDashboardPayload(payload);
    const responseMantra = normalizeMantraText(rawData.mantra ?? rawData.selectedMantra ?? "");

    if (responseMantra && expectedMantra && !sameMantraText(responseMantra, expectedMantra)) {
        throw new Error("The server returned a different mantra dashboard.");
    }

    const data = normalizeDashboard(payload, expectedMantra);
    const localMatches = sameMantraText(dashboardState.mantra, expectedMantra);
    const baseToday = preserveLocalCounts && localMatches
        ? dashboardState.today
        : data.today;
    const baseLifetime = preserveLocalCounts && localMatches
        ? dashboardState.lifetime
        : data.lifetime;
    const today = Math.max(0, Number(baseToday || 0) + Number(pendingToday || 0));
    const lifetime = Math.max(0, Number(baseLifetime || 0) + Number(pendingLifetime || 0));
    const malaSize = Math.max(1, Number(data.malaSize || dashboardState.malaSize || 108));

    return {
        ...data,
        today,
        lifetime,
        mantra: expectedMantra,
        malaSize,
        currentMalaCount: today % malaSize,
        todayMalas: Math.floor(today / malaSize),
        lifetimeMalas: Math.floor(lifetime / malaSize),
        overallToday: null,
        overallLifetime: null,
        malasCompleted: 0,
    };
}

async function loadDashboard(options = {}) {
    const requestedMantra = normalizeMantraText(
        options.mantra !== undefined
            ? options.mantra
            : selectedMantraText()
    );

    if (!requestedMantra) return;

    const requestSerial = ++dashboardRequestSerial;

    if (!navigator.onLine || !isAuthenticated()) {
        await loadLocalDashboard(requestedMantra);
        const summary = await pendingSummary();
        setConnectionStatus("offline", summary.count
            ? `Offline — ${summary.count} saved locally`
            : "Offline — ready to count");
        return;
    }

    setConnectionStatus("loading", "Loading selected mantra from Google Sheets…");
    try {
        const payload = await getDashboard(requestedMantra, offlineLocalDateKey());

        // A slower response for a previously selected mantra must never replace
        // the currently selected mantra dashboard.
        if (requestSerial !== dashboardRequestSerial) return;
        if (!sameMantraText(selectedMantraText(), requestedMantra)) return;

        const responseMantra = normalizeMantraText(
            unwrapDashboardPayload(payload).mantra
            ?? unwrapDashboardPayload(payload).selectedMantra
            ?? ""
        );
        if (responseMantra && !sameMantraText(responseMantra, requestedMantra)) {
            throw new Error("Selected mantra response mismatch.");
        }

        const summary = await pendingSummary();
        const pending = pendingCountsForMantra(summary, requestedMantra);
        updateDashboard(mergeServerDashboardWithPending(
            payload,
            pending.today,
            pending.lifetime,
            requestedMantra,
            summary.mantraChanges > 0
        ), { expectedMantra: requestedMantra });
        dashboardLocalDate = offlineLocalDateKey();
        await cacheDashboard();
        setConnectionStatus("online", summary.operations
            ? `${summary.count} count${summary.count === 1 ? "" : "s"} waiting to sync`
            : `Synced — ${requestedMantra}`);

        if (options.showSuccess) showToast("Selected mantra dashboard refreshed.", "success");
    } catch (error) {
        console.error("Dashboard load failed:", error);
        if (requestSerial === dashboardRequestSerial) {
            await loadLocalDashboard(requestedMantra);
            setConnectionStatus("error", "Cloud unavailable — selected mantra cache shown");
            if (options.showError !== false) {
                showToast("Selected mantra की saved counting दिखाई जा रही है।", "error", 4500);
            }
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

        if (sameMantraText(payloadMantra, dashboardState.mantra)) {
            const selectedMantra = dashboardState.mantra;
            const pending = pendingCountsForMantra(summary, selectedMantra);
            updateDashboard(mergeServerDashboardWithPending(
                payload,
                pending.today,
                pending.lifetime,
                selectedMantra,
                false
            ), { expectedMantra: selectedMantra });
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
            const selectedMantra = dashboardState.mantra;
            updateDashboard(mergeServerDashboardWithPending(
                server,
                pending.today,
                pending.lifetime,
                selectedMantra,
                false
            ), { expectedMantra: selectedMantra });
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
    const goalTargetCount = Math.max(malaSize, Number(dashboardState.goalTargetCount || dashboardState.goalMalas * malaSize || malaSize));
    const wasGoalComplete = dashboardState.today >= goalTargetCount;
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

    const goalCompletedNow = !wasGoalComplete && dashboardState.today >= goalTargetCount;
    if (goalCompletedNow) {
        showDailyMalaGoalCompletion();
    } else if (dashboardState.todayMalas > previousMalas) {
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
    const nextMantra = String(elements.mantraSelect.value || "").normalize("NFC").trim();
    const previousState = { ...dashboardState };

    if (!nextMantra || sameMantraText(nextMantra, dashboardState.mantra)) return;

    dashboardRequestSerial += 1;
    elements.mantraSelect.disabled = true;

    try {
        // Preserve the old mantra dashboard before switching keys.
        await cacheDashboard();

        // Show the selected mantra's own device cache immediately. A mantra
        // without a cache starts at zero instead of inheriting today's total.
        await loadLocalDashboard(nextMantra);

        await offlineQueueMantra({
            userId: currentUserId(),
            deviceKey: authState.deviceKey,
            mantra: nextMantra,
            dashboard: dashboardState,
        });

        historyLoaded = false;

        if (navigator.onLine && isAuthenticated()) {
            setConnectionStatus("loading", "Loading selected mantra count…");
            const synced = await flushOfflineQueue();

            if (synced) {
                await loadDashboard({
                    mantra: nextMantra,
                    showError: false,
                });
                showToast("Separate mantra count loaded.", "success");
            } else {
                showToast("Mantra selected. Its count is saved locally and will sync automatically.", "info", 4500);
            }
        } else {
            showToast("Mantra selected offline.", "success");
            await refreshPendingStatus();
        }

        if (appSettings.voiceEnabled) speakMantra(nextMantra);
    } catch (error) {
        console.error("Mantra change failed:", error);
        updateDashboard(previousState, { expectedMantra: previousState.mantra });
        await cacheDashboard();
        showToast("Mantra could not be changed. Previous count restored.", "error", 5000);
    } finally {
        elements.mantraSelect.disabled = false;
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
        updateDashboard(payload, { expectedMantra: dashboardState.mantra });
        dashboardLocalDate = offlineLocalDateKey();
        localStorage.removeItem(goalCompletionKey());
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
        updateDashboard(payload, { expectedMantra: dashboardState.mantra });
        localStorage.removeItem(goalCompletionKey());
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
            GOAL_UPDATE: "🎯",
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

function renderMalaGoalSettings() {
    if (elements.goalSettingsMantra) {
        elements.goalSettingsMantra.textContent = dashboardState.mantra;
    }
    if (elements.malaGoalInput && document.activeElement !== elements.malaGoalInput) {
        elements.malaGoalInput.value = String(dashboardState.goalMalas || 1);
    }
}

function renderSettings() {
    elements.voiceEnabled.checked = appSettings.voiceEnabled;
    elements.autoSpeakEnabled.checked = appSettings.autoSpeakEnabled;
    elements.voiceSelect.value = appSettings.selectedVoiceURI;
    renderMalaGoalSettings();
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

async function handleSaveMalaGoal(event) {
    event.preventDefault();

    const goalMalas = Number.parseInt(elements.malaGoalInput.value, 10);
    if (!Number.isFinite(goalMalas) || goalMalas < 1 || goalMalas > MALA_GOAL_MAX) {
        elements.malaGoalInput.value = String(dashboardState.goalMalas || 1);
        showToast(`Goal must be between 1 and ${MALA_GOAL_MAX.toLocaleString("en-IN")} malas.`, "error");
        return;
    }

    if (!navigator.onLine || !isAuthenticated()) {
        showToast("Internet and Google sign-in are required to save a goal.", "error", 4500);
        return;
    }

    if (!(await syncQueueBeforeCriticalAction())) {
        showToast("Saved offline counts must sync before changing the goal.", "error", 4500);
        return;
    }

    setButtonBusy(elements.saveMalaGoalButton, true, "Saving…");
    try {
        const payload = await saveMalaGoal(
            dashboardState.mantra,
            goalMalas,
            offlineLocalDateKey()
        );
        updateDashboard(payload, { expectedMantra: dashboardState.mantra });
        await cacheDashboard();
        historyLoaded = false;
        showToast(`Daily goal saved: ${goalMalas} माला — ${dashboardState.mantra}`, "success", 4800);
    } catch (error) {
        console.error("Mala goal save failed:", error);
        showToast(error.message || "Daily mala goal could not be saved.", "error", 5000);
    } finally {
        setButtonBusy(elements.saveMalaGoalButton, false);
    }
}

function setupSettingsEvents() {
    elements.malaGoalForm.addEventListener("submit", handleSaveMalaGoal);
    document.querySelectorAll("[data-goal-malas]").forEach(button => {
        button.addEventListener("click", () => {
            elements.malaGoalInput.value = String(button.dataset.goalMalas || 1);
            elements.malaGoalInput.focus();
        });
    });

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
        elements.saveMalaGoalButton.disabled = true;
        await refreshPendingStatus();
        return;
    }

    elements.resetTodayButton.disabled = !isAuthenticated();
    elements.resetAllButton.disabled = !isAuthenticated();
    elements.saveMalaGoalButton.disabled = !isAuthenticated();

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
        renderMalaGoalSettings();
        await refreshPendingStatus();
        return;
    }

    setConnectionStatus("loading", "Signed in — syncing…");
    const restoredLocal = await loadLocalDashboard("").catch(() => false);
    await loadDashboard({
        showError: false,
        mantra: restoredLocal ? dashboardState.mantra : elements.mantraSelect.value,
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

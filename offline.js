// Durable offline storage for Naam Jaap Counter.
// Counts and queued changes stay on this device until authenticated sync succeeds.

const OFFLINE_DB_NAME = "naam-jaap-offline-v1";
const OFFLINE_DB_VERSION = 1;
const OFFLINE_META_STORE = "meta";
const OFFLINE_QUEUE_STORE = "queue";
const OFFLINE_FALLBACK_KEY = "naam-jaap-offline-fallback-v1";
const OFFLINE_PROFILE_DAYS = 7;

let offlineDbPromise = null;
let offlineSequence = 0;
let offlineActiveCountBatch = null;
let offlineWriteChain = Promise.resolve();
let offlineFallbackMode = false;

function offlineUuid(prefix = "op") {
    if (window.crypto?.randomUUID) return `${prefix}-${window.crypto.randomUUID()}`;
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
}

function offlineLocalDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function offlineOrderValue() {
    offlineSequence = (offlineSequence + 1) % 1000;
    return Date.now() * 1000 + offlineSequence;
}

function offlineReadFallback() {
    try {
        const parsed = JSON.parse(localStorage.getItem(OFFLINE_FALLBACK_KEY) || "{}");
        return {
            meta: parsed.meta && typeof parsed.meta === "object" ? parsed.meta : {},
            queue: Array.isArray(parsed.queue) ? parsed.queue : [],
        };
    } catch (_error) {
        return { meta: {}, queue: [] };
    }
}

function offlineWriteFallback(state) {
    localStorage.setItem(OFFLINE_FALLBACK_KEY, JSON.stringify(state));
}

function offlineOpenDb() {
    if (offlineFallbackMode || !window.indexedDB) {
        offlineFallbackMode = true;
        return Promise.resolve(null);
    }

    if (offlineDbPromise) return offlineDbPromise;

    offlineDbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(OFFLINE_DB_NAME, OFFLINE_DB_VERSION);

        request.onupgradeneeded = event => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(OFFLINE_META_STORE)) {
                db.createObjectStore(OFFLINE_META_STORE, { keyPath: "key" });
            }
            if (!db.objectStoreNames.contains(OFFLINE_QUEUE_STORE)) {
                const store = db.createObjectStore(OFFLINE_QUEUE_STORE, { keyPath: "id" });
                store.createIndex("byUser", "userId", { unique: false });
                store.createIndex("byOrder", "order", { unique: false });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error("Offline database could not be opened."));
        request.onblocked = () => reject(new Error("Offline database upgrade is blocked."));
    }).catch(error => {
        console.warn("IndexedDB unavailable; using localStorage fallback.", error);
        offlineFallbackMode = true;
        offlineDbPromise = Promise.resolve(null);
        return null;
    });

    return offlineDbPromise;
}

async function offlinePutMeta(key, value) {
    const db = await offlineOpenDb();
    if (!db) {
        const state = offlineReadFallback();
        state.meta[key] = value;
        offlineWriteFallback(state);
        return value;
    }

    return new Promise((resolve, reject) => {
        const tx = db.transaction(OFFLINE_META_STORE, "readwrite");
        tx.objectStore(OFFLINE_META_STORE).put({ key, value });
        tx.oncomplete = () => resolve(value);
        tx.onerror = () => reject(tx.error || new Error("Offline metadata could not be saved."));
    });
}

async function offlineGetMeta(key) {
    const db = await offlineOpenDb();
    if (!db) return offlineReadFallback().meta[key] ?? null;

    return new Promise((resolve, reject) => {
        const tx = db.transaction(OFFLINE_META_STORE, "readonly");
        const request = tx.objectStore(OFFLINE_META_STORE).get(key);
        request.onsuccess = () => resolve(request.result?.value ?? null);
        request.onerror = () => reject(request.error || new Error("Offline metadata could not be read."));
    });
}

async function offlineDeleteMeta(key) {
    const db = await offlineOpenDb();
    if (!db) {
        const state = offlineReadFallback();
        delete state.meta[key];
        offlineWriteFallback(state);
        return;
    }

    return new Promise((resolve, reject) => {
        const tx = db.transaction(OFFLINE_META_STORE, "readwrite");
        tx.objectStore(OFFLINE_META_STORE).delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error || new Error("Offline metadata could not be removed."));
    });
}

async function offlinePutQueue(record) {
    const db = await offlineOpenDb();
    if (!db) {
        const state = offlineReadFallback();
        const index = state.queue.findIndex(item => item.id === record.id);
        if (index >= 0) state.queue[index] = record;
        else state.queue.push(record);
        offlineWriteFallback(state);
        return record;
    }

    return new Promise((resolve, reject) => {
        const tx = db.transaction(OFFLINE_QUEUE_STORE, "readwrite");
        tx.objectStore(OFFLINE_QUEUE_STORE).put(record);
        tx.oncomplete = () => resolve(record);
        tx.onerror = () => reject(tx.error || new Error("Offline queue could not be saved."));
    });
}

async function offlineGetQueueRecord(id) {
    const db = await offlineOpenDb();
    if (!db) return offlineReadFallback().queue.find(item => item.id === id) || null;

    return new Promise((resolve, reject) => {
        const tx = db.transaction(OFFLINE_QUEUE_STORE, "readonly");
        const request = tx.objectStore(OFFLINE_QUEUE_STORE).get(id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error || new Error("Offline queue could not be read."));
    });
}

async function offlineGetQueueAll() {
    const db = await offlineOpenDb();
    if (!db) return offlineReadFallback().queue.slice();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(OFFLINE_QUEUE_STORE, "readonly");
        const request = tx.objectStore(OFFLINE_QUEUE_STORE).getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error || new Error("Offline queue could not be read."));
    });
}

async function offlineDeleteQueue(id) {
    const db = await offlineOpenDb();
    if (!db) {
        const state = offlineReadFallback();
        state.queue = state.queue.filter(item => item.id !== id);
        offlineWriteFallback(state);
        return;
    }

    return new Promise((resolve, reject) => {
        const tx = db.transaction(OFFLINE_QUEUE_STORE, "readwrite");
        tx.objectStore(OFFLINE_QUEUE_STORE).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error || new Error("Offline queue item could not be removed."));
    });
}

function offlineProfileKey() {
    return "verifiedProfile";
}

function offlineDashboardKey(userId, mantra) {
    return `dashboard:${String(userId || "")}:${encodeURIComponent(String(mantra || ""))}`;
}

function offlineSelectedMantraKey(userId) {
    return `selected-mantra:${String(userId || "")}`;
}

async function offlineSaveVerifiedProfile(user, deviceKey) {
    if (!user?.id || !user?.email) return null;
    const verifiedAt = Date.now();
    const profile = {
        user: {
            id: String(user.id),
            name: String(user.name || user.email || "Google User"),
            email: String(user.email || ""),
        },
        deviceKey: String(deviceKey || ""),
        verifiedAt,
        expiresAt: verifiedAt + OFFLINE_PROFILE_DAYS * 24 * 60 * 60 * 1000,
    };
    await offlinePutMeta(offlineProfileKey(), profile);
    return profile;
}

async function offlineGetValidProfile() {
    const profile = await offlineGetMeta(offlineProfileKey());
    if (!profile?.user?.id || !profile?.user?.email) return null;
    if (!Number.isFinite(Number(profile.expiresAt)) || Number(profile.expiresAt) <= Date.now()) {
        await offlineDeleteMeta(offlineProfileKey());
        return null;
    }
    return profile;
}

async function offlineClearVerifiedProfile() {
    await offlineDeleteMeta(offlineProfileKey());
}

async function offlineSaveDashboard(userId, dashboard, options = {}) {
    if (!userId || !dashboard) return;
    const mantra = String(dashboard.mantra || "").slice(0, 200);
    if (!mantra) return;

    const today = Math.max(0, Number(dashboard.today || 0));
    const lifetime = Math.max(0, Number(dashboard.lifetime || 0));
    const malaSize = Math.max(1, Number(dashboard.malaSize || 108));
    const safe = {
        today,
        lifetime,
        mantra,
        malaSize,
        currentMalaCount: Math.max(0, Number(dashboard.currentMalaCount ?? (today % malaSize))),
        todayMalas: Math.max(0, Number(dashboard.todayMalas ?? Math.floor(today / malaSize))),
        lifetimeMalas: Math.max(0, Number(dashboard.lifetimeMalas ?? Math.floor(lifetime / malaSize))),
        localDate: offlineLocalDateKey(),
        savedAt: Date.now(),
    };

    await offlinePutMeta(offlineDashboardKey(userId, mantra), safe);
    if (options.setSelected !== false) {
        await offlinePutMeta(offlineSelectedMantraKey(userId), mantra);
    }
}

async function offlineLoadDashboard(userId, mantra = "") {
    const selectedMantra = String(
        mantra || await offlineGetMeta(offlineSelectedMantraKey(userId)) || ""
    );
    if (!selectedMantra) return null;

    const saved = await offlineGetMeta(offlineDashboardKey(userId, selectedMantra));
    if (!saved) return null;

    const malaSize = Math.max(1, Number(saved.malaSize || 108));
    const today = saved.localDate === offlineLocalDateKey() ? Number(saved.today || 0) : 0;
    const lifetime = Math.max(0, Number(saved.lifetime || 0));

    return {
        today: Math.max(0, today),
        lifetime,
        mantra: selectedMantra,
        malaSize,
        currentMalaCount: Math.max(0, today % malaSize),
        todayMalas: Math.max(0, Math.floor(today / malaSize)),
        lifetimeMalas: Math.max(0, Number(saved.lifetimeMalas ?? Math.floor(lifetime / malaSize))),
        malasCompleted: 0,
        localDate: offlineLocalDateKey(),
        savedAt: Number(saved.savedAt || 0),
    };
}

function offlineCloseActiveCountBatch() {
    offlineActiveCountBatch = null;
}

function offlineEnqueueWrite(task) {
    offlineWriteChain = offlineWriteChain.then(task, task);
    return offlineWriteChain;
}

function offlineWaitForWrites() {
    return offlineWriteChain.catch(() => undefined);
}

function offlineQueueCount({ userId, deviceKey, mantra, count = 1, dashboard }) {
    return offlineEnqueueWrite(async () => {
        const localDate = offlineLocalDateKey();
        const safeCount = Math.max(1, Math.min(100000, Number(count || 1)));
        const batchMatches = offlineActiveCountBatch
            && offlineActiveCountBatch.userId === String(userId)
            && offlineActiveCountBatch.deviceKey === String(deviceKey || "")
            && offlineActiveCountBatch.mantra === String(mantra || "")
            && offlineActiveCountBatch.localDate === localDate;

        if (!batchMatches) {
            offlineActiveCountBatch = {
                id: offlineUuid("count"),
                userId: String(userId),
                deviceKey: String(deviceKey || ""),
                mantra: String(mantra || "").slice(0, 200),
                localDate,
            };
        }

        let current = await offlineGetQueueRecord(offlineActiveCountBatch.id);
        if (current && Number(current.count || 0) + safeCount > 100000) {
            offlineActiveCountBatch = {
                id: offlineUuid("count"),
                userId: String(userId),
                deviceKey: String(deviceKey || ""),
                mantra: String(mantra || "").slice(0, 200),
                localDate,
            };
            current = null;
        }

        const record = current || {
            ...offlineActiveCountBatch,
            type: "COUNT",
            count: 0,
            createdAt: new Date().toISOString(),
            order: offlineOrderValue(),
            status: "pending",
            attempts: 0,
            lastError: "",
        };

        record.count = Number(record.count || 0) + safeCount;
        record.updatedAt = new Date().toISOString();
        record.status = "pending";
        await offlinePutQueue(record);
        if (dashboard) await offlineSaveDashboard(userId, dashboard);
        return record;
    });
}

function offlineQueueMantra({ userId, deviceKey, mantra, dashboard }) {
    offlineCloseActiveCountBatch();
    return offlineEnqueueWrite(async () => {
        const record = {
            id: offlineUuid("mantra"),
            type: "MANTRA",
            userId: String(userId),
            deviceKey: String(deviceKey || ""),
            mantra: String(mantra || "").slice(0, 200),
            localDate: offlineLocalDateKey(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            order: offlineOrderValue(),
            status: "pending",
            attempts: 0,
            lastError: "",
        };
        await offlinePutQueue(record);
        if (dashboard) await offlineSaveDashboard(userId, dashboard);
        return record;
    });
}

async function offlineListPending(userId) {
    await offlineWaitForWrites();
    const all = await offlineGetQueueAll();
    return all
        .filter(item => String(item.userId) === String(userId) && item.status !== "done")
        .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
}

async function offlineGetPendingSummary(userId) {
    const items = await offlineListPending(userId);
    return items.reduce((summary, item) => {
        summary.operations += 1;
        if (item.type === "COUNT") {
            const count = Number(item.count || 0);
            const mantra = String(item.mantra || "");
            summary.count += count;
            summary.countsByMantra[mantra] = Number(summary.countsByMantra[mantra] || 0) + count;
            if (String(item.localDate || "") === offlineLocalDateKey()) {
                summary.todayCountsByMantra[mantra] = Number(summary.todayCountsByMantra[mantra] || 0) + count;
            }
        }
        if (item.type === "MANTRA") {
            summary.mantraChanges += 1;
            summary.latestMantra = String(item.mantra || summary.latestMantra || "");
        }
        return summary;
    }, {
        operations: 0,
        count: 0,
        mantraChanges: 0,
        latestMantra: "",
        countsByMantra: {},
        todayCountsByMantra: {},
    });
}

async function offlineMarkSyncing(id) {
    const item = await offlineGetQueueRecord(id);
    if (!item) return null;
    item.status = "syncing";
    item.attempts = Number(item.attempts || 0) + 1;
    item.lastAttemptAt = new Date().toISOString();
    await offlinePutQueue(item);
    return item;
}

async function offlineMarkPending(id, error) {
    const item = await offlineGetQueueRecord(id);
    if (!item) return null;
    item.status = "pending";
    item.lastError = String(error?.message || error || "Sync failed").slice(0, 300);
    item.updatedAt = new Date().toISOString();
    await offlinePutQueue(item);
    return item;
}

async function offlineCompleteOperation(id) {
    if (offlineActiveCountBatch?.id === id) offlineCloseActiveCountBatch();
    await offlineDeleteQueue(id);
}

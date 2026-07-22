// Naam Jaap Counter v2.9.2 — custom mantra cloud sync
// Google Sheets is the source of truth. localStorage remains an offline cache.

(() => {
    "use strict";

    const STORAGE_PREFIX = "naam-jaap-custom-mantras-v1:";
    const DELETE_PREFIX = "naam-jaap-custom-mantra-deletes-v1:";
    const MAX_CUSTOM_MANTRAS = 25;
    const MAX_MANTRA_LENGTH = 120;

    let activeUserId = "";
    let standardMantras = new Set();
    let refreshTimer = null;
    let cloudSyncPromise = null;

    function normalizeMantra(value) {
        return String(value || "")
            .normalize("NFC")
            .replace(/[\u0000-\u001F\u007F]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    function mantraKey(value) {
        return normalizeMantra(value).toLocaleLowerCase("hi-IN");
    }

    function uniqueMantras(values) {
        const unique = new Map();
        (Array.isArray(values) ? values : []).forEach(item => {
            const mantra = normalizeMantra(
                typeof item === "string" ? item : item?.mantra
            );
            if (!mantra || mantra.length > MAX_MANTRA_LENGTH) return;
            unique.set(mantraKey(mantra), mantra);
        });
        return Array.from(unique.values()).slice(0, MAX_CUSTOM_MANTRAS);
    }

    function getVerifiedUserId() {
        try {
            if (typeof currentUserId === "function") {
                return String(currentUserId() || "").trim();
            }
            if (typeof authState !== "undefined") {
                return String(authState?.user?.id || "").trim();
            }
        } catch (error) {
            console.warn("Custom mantra user lookup failed:", error);
        }
        return "";
    }

    function storageKey(userId) {
        return `${STORAGE_PREFIX}${String(userId || "")}`;
    }

    function deleteKey(userId) {
        return `${DELETE_PREFIX}${String(userId || "")}`;
    }

    function readJsonList(key) {
        try {
            const parsed = JSON.parse(localStorage.getItem(key) || "[]");
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.warn("Custom mantra storage could not be read:", error);
            return [];
        }
    }

    function readCustomMantras(userId) {
        if (!userId) return [];
        return uniqueMantras(readJsonList(storageKey(userId)));
    }

    function writeCustomMantras(userId, mantras) {
        if (!userId) return;
        localStorage.setItem(storageKey(userId), JSON.stringify(uniqueMantras(mantras)));
    }

    function readPendingDeletes(userId) {
        if (!userId) return [];
        return uniqueMantras(readJsonList(deleteKey(userId)));
    }

    function writePendingDeletes(userId, mantras) {
        if (!userId) return;
        const normalized = uniqueMantras(mantras);
        if (normalized.length) {
            localStorage.setItem(deleteKey(userId), JSON.stringify(normalized));
        } else {
            localStorage.removeItem(deleteKey(userId));
        }
    }

    function addPendingDelete(userId, mantra) {
        writePendingDeletes(userId, [...readPendingDeletes(userId), mantra]);
    }

    function removePendingDelete(userId, mantra) {
        writePendingDeletes(
            userId,
            readPendingDeletes(userId).filter(item => mantraKey(item) !== mantraKey(mantra))
        );
    }

    function extractCloudMantras(payload) {
        if (Array.isArray(payload)) return uniqueMantras(payload);
        return uniqueMantras(payload?.mantras || payload?.items || payload?.customMantras || []);
    }

    function cloudSyncAvailable() {
        return Boolean(
            navigator.onLine
            && typeof isAuthenticated === "function"
            && isAuthenticated()
            && typeof getCustomMantras === "function"
            && typeof addCustomMantraCloud === "function"
            && typeof deleteCustomMantraCloud === "function"
        );
    }

    function showMessage(message, type = "info", toast = true) {
        const help = document.getElementById("customMantraHelp");
        if (help) {
            help.textContent = message;
            help.dataset.type = type;
        }

        if (toast && typeof showToast === "function") {
            showToast(message, type === "error" ? "error" : "success", 4200);
        }
    }

    function captureStandardMantras() {
        const select = document.getElementById("mantraSelect");
        if (!select || standardMantras.size) return;

        Array.from(select.options).forEach(option => {
            if (option.dataset.customMantra !== "true") {
                standardMantras.add(mantraKey(option.value));
            }
        });
    }

    function ensureCustomOption(mantra) {
        const select = document.getElementById("mantraSelect");
        if (!select) return;

        const key = mantraKey(mantra);
        const existing = Array.from(select.options)
            .find(option => mantraKey(option.value) === key);

        if (existing) {
            if (!standardMantras.has(key)) existing.dataset.customMantra = "true";
            return;
        }

        const option = document.createElement("option");
        option.value = mantra;
        option.textContent = mantra;
        option.dataset.customMantra = "true";
        select.appendChild(option);
    }

    function removeRenderedCustomOptions() {
        const select = document.getElementById("mantraSelect");
        if (!select) return;

        Array.from(select.options).forEach(option => {
            if (option.dataset.customMantra === "true") option.remove();
        });
    }

    function renderCustomMantras() {
        const list = document.getElementById("customMantraList");
        const select = document.getElementById("mantraSelect");
        if (!list || !select) return;

        captureStandardMantras();
        const selectedBeforeRender = select.value;
        const mantras = readCustomMantras(activeUserId);

        removeRenderedCustomOptions();
        mantras.forEach(ensureCustomOption);

        if (selectedBeforeRender && Array.from(select.options).some(option => option.value === selectedBeforeRender)) {
            select.value = selectedBeforeRender;
        }

        list.innerHTML = "";

        if (!activeUserId) {
            list.innerHTML = '<p class="custom-mantra-empty">Google sign-in के बाद अपने मंत्र जोड़ें।</p>';
            return;
        }

        if (!mantras.length) {
            list.innerHTML = '<p class="custom-mantra-empty">अभी कोई custom mantra नहीं जोड़ा गया है।</p>';
            return;
        }

        const fragment = document.createDocumentFragment();

        mantras.forEach(mantra => {
            const row = document.createElement("div");
            row.className = "custom-mantra-item";

            const name = document.createElement("span");
            name.className = "custom-mantra-name";
            name.textContent = mantra;

            const useButton = document.createElement("button");
            useButton.type = "button";
            useButton.className = "custom-mantra-use";
            useButton.textContent = "Use";
            useButton.addEventListener("click", () => selectCustomMantra(mantra));

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "custom-mantra-delete";
            deleteButton.textContent = "Delete";
            deleteButton.setAttribute("aria-label", `Delete ${mantra}`);
            deleteButton.addEventListener("click", () => deleteCustomMantra(mantra));

            row.append(name, useButton, deleteButton);
            fragment.appendChild(row);
        });

        list.appendChild(fragment);
    }

    function selectCustomMantra(mantra) {
        const select = document.getElementById("mantraSelect");
        if (!select) return;

        ensureCustomOption(mantra);
        select.value = mantra;
        select.dispatchEvent(new Event("change", { bubbles: true }));
    }

    async function syncCustomMantrasFromCloud(options = {}) {
        const userId = getVerifiedUserId();
        if (!userId || userId !== activeUserId || !cloudSyncAvailable()) return false;
        if (cloudSyncPromise) return cloudSyncPromise;

        cloudSyncPromise = (async () => {
            try {
                let cloud = extractCloudMantras(await getCustomMantras());
                const pendingDeletes = readPendingDeletes(userId);

                for (const mantra of pendingDeletes) {
                    await deleteCustomMantraCloud(mantra);
                    removePendingDelete(userId, mantra);
                    cloud = cloud.filter(item => mantraKey(item) !== mantraKey(mantra));
                }

                const local = readCustomMantras(userId)
                    .filter(item => !readPendingDeletes(userId)
                        .some(deleted => mantraKey(deleted) === mantraKey(item)));

                for (const mantra of local) {
                    if (!cloud.some(item => mantraKey(item) === mantraKey(mantra))) {
                        const result = await addCustomMantraCloud(mantra);
                        const returned = extractCloudMantras(result);
                        cloud = returned.length ? returned : uniqueMantras([...cloud, mantra]);
                    }
                }

                // Final read makes another device's latest additions visible.
                const finalResult = await getCustomMantras();
                const finalCloud = extractCloudMantras(finalResult);
                const finalMantras = finalCloud.length || !local.length
                    ? finalCloud
                    : uniqueMantras([...cloud, ...local]);

                writeCustomMantras(userId, finalMantras);
                renderCustomMantras();

                if (options.showSuccess) {
                    showMessage("Custom mantras Google Sheets से sync हो गए।", "success");
                } else {
                    showMessage("Custom mantras cloud sync active है।", "info", false);
                }
                return true;
            } catch (error) {
                console.warn("Custom mantra cloud sync failed:", error);
                showMessage(
                    "Cloud sync अभी नहीं हो पाया। Device पर saved mantra सुरक्षित है और अगली बार फिर sync होगा।",
                    "error",
                    Boolean(options.showError)
                );
                return false;
            } finally {
                cloudSyncPromise = null;
            }
        })();

        return cloudSyncPromise;
    }

    async function addCustomMantra(event) {
        event.preventDefault();

        const input = document.getElementById("customMantraInput");
        if (!input) return;

        const userId = getVerifiedUserId();
        if (!userId) {
            showMessage("Custom mantra जोड़ने के लिए Google sign-in करें।", "error");
            return;
        }

        const mantra = normalizeMantra(input.value);

        if (mantra.length < 2) {
            showMessage("कम से कम 2 अक्षर का mantra लिखें।", "error");
            input.focus();
            return;
        }

        if (mantra.length > MAX_MANTRA_LENGTH) {
            showMessage(`Mantra अधिकतम ${MAX_MANTRA_LENGTH} अक्षर का हो सकता है।`, "error");
            input.focus();
            return;
        }

        if (/^[=+\-@]/.test(mantra)) {
            showMessage("Mantra की शुरुआत =, +, - या @ से नहीं हो सकती।", "error");
            input.focus();
            return;
        }

        captureStandardMantras();
        const key = mantraKey(mantra);
        const customMantras = readCustomMantras(userId);
        const alreadyExists = standardMantras.has(key)
            || customMantras.some(item => mantraKey(item) === key);

        if (alreadyExists) {
            showMessage("यह mantra पहले से list में मौजूद है।", "error");
            selectCustomMantra(mantra);
            return;
        }

        if (customMantras.length >= MAX_CUSTOM_MANTRAS) {
            showMessage(`अधिकतम ${MAX_CUSTOM_MANTRAS} custom mantras रखे जा सकते हैं।`, "error");
            return;
        }

        customMantras.push(mantra);
        removePendingDelete(userId, mantra);
        writeCustomMantras(userId, customMantras);
        input.value = "";
        renderCustomMantras();
        selectCustomMantra(mantra);

        if (!cloudSyncAvailable()) {
            showMessage("Custom mantra device पर save है। Internet मिलने पर cloud में sync होगा।", "success");
            return;
        }

        try {
            const result = await addCustomMantraCloud(mantra);
            const cloudMantras = extractCloudMantras(result);
            if (cloudMantras.length) writeCustomMantras(userId, cloudMantras);
            renderCustomMantras();
            showMessage("Custom mantra cloud में save हो गया।", "success");
        } catch (error) {
            console.warn("Custom mantra cloud add failed:", error);
            showMessage("Mantra device पर save है; cloud sync अगली बार फिर होगा।", "error");
        }
    }

    async function deleteCustomMantra(mantra) {
        const userId = getVerifiedUserId();
        if (!userId) return;

        const confirmed = window.confirm(
            `“${mantra}” को dropdown और cloud list से हटाएँ?\n\nGoogle Sheets में पुरानी counting delete नहीं होगी।`
        );
        if (!confirmed) return;

        const remaining = readCustomMantras(userId)
            .filter(item => mantraKey(item) !== mantraKey(mantra));
        writeCustomMantras(userId, remaining);
        addPendingDelete(userId, mantra);

        const select = document.getElementById("mantraSelect");
        const wasSelected = select && mantraKey(select.value) === mantraKey(mantra);

        renderCustomMantras();

        if (wasSelected && select?.options.length) {
            select.value = select.options[0].value;
            select.dispatchEvent(new Event("change", { bubbles: true }));
        }

        if (!cloudSyncAvailable()) {
            showMessage("Mantra device से हट गया। Internet मिलने पर cloud से भी हटेगा।", "success");
            return;
        }

        try {
            const result = await deleteCustomMantraCloud(mantra);
            removePendingDelete(userId, mantra);
            const cloudMantras = extractCloudMantras(result);
            writeCustomMantras(userId, cloudMantras);
            renderCustomMantras();
            showMessage("Custom mantra cloud list से हटा दिया गया।", "success");
        } catch (error) {
            console.warn("Custom mantra cloud delete failed:", error);
            showMessage("Device से हट गया; cloud deletion अगली sync में फिर होगी।", "error");
        }
    }

    function refreshForCurrentUser() {
        const userId = getVerifiedUserId();
        if (userId === activeUserId) return;

        activeUserId = userId;
        renderCustomMantras();

        const input = document.getElementById("customMantraInput");
        const button = document.getElementById("addCustomMantraBtn");
        if (input) input.disabled = !userId;
        if (button) button.disabled = !userId;

        if (userId) syncCustomMantrasFromCloud({ showError: false });
    }

    function initializeCustomMantras() {
        const form = document.getElementById("customMantraForm");
        if (!form) return;

        captureStandardMantras();
        form.addEventListener("submit", addCustomMantra);
        refreshForCurrentUser();

        refreshTimer = window.setInterval(refreshForCurrentUser, 900);

        window.addEventListener("online", () => {
            if (activeUserId) syncCustomMantrasFromCloud({ showError: false });
        });

        window.addEventListener("storage", event => {
            if (
                activeUserId
                && (event.key === storageKey(activeUserId) || event.key === deleteKey(activeUserId))
            ) {
                renderCustomMantras();
            }
        });

        window.addEventListener("beforeunload", () => {
            if (refreshTimer) window.clearInterval(refreshTimer);
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeCustomMantras, { once: true });
    } else {
        initializeCustomMantras();
    }
})();

// Naam Jaap Counter v2.8.2 — user custom mantra manager
// Custom mantra names are stored per verified user on this device.
// Counting remains user + mantra isolated through the existing backend.

(() => {
    "use strict";

    const STORAGE_PREFIX = "naam-jaap-custom-mantras-v1:";
    const MAX_CUSTOM_MANTRAS = 25;
    const MAX_MANTRA_LENGTH = 120;

    let activeUserId = "";
    let standardMantras = new Set();
    let refreshTimer = null;

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

    function readCustomMantras(userId) {
        if (!userId) return [];

        try {
            const parsed = JSON.parse(localStorage.getItem(storageKey(userId)) || "[]");
            if (!Array.isArray(parsed)) return [];

            const unique = new Map();
            parsed.forEach(item => {
                const mantra = normalizeMantra(item);
                if (!mantra || mantra.length > MAX_MANTRA_LENGTH) return;
                unique.set(mantraKey(mantra), mantra);
            });

            return Array.from(unique.values()).slice(0, MAX_CUSTOM_MANTRAS);
        } catch (error) {
            console.warn("Custom mantra storage could not be read:", error);
            return [];
        }
    }

    function writeCustomMantras(userId, mantras) {
        if (!userId) return;
        localStorage.setItem(storageKey(userId), JSON.stringify(mantras));
    }

    function showMessage(message, type = "info") {
        const help = document.getElementById("customMantraHelp");
        if (help) {
            help.textContent = message;
            help.dataset.type = type;
        }

        if (typeof showToast === "function") {
            showToast(message, type === "error" ? "error" : "success", 3800);
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

    function addCustomMantra(event) {
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
        writeCustomMantras(userId, customMantras);
        input.value = "";
        renderCustomMantras();
        selectCustomMantra(mantra);
        showMessage("Custom mantra जोड़ दिया गया। इसकी counting अलग रहेगी।", "success");
    }

    function deleteCustomMantra(mantra) {
        const userId = getVerifiedUserId();
        if (!userId) return;

        const confirmed = window.confirm(
            `“${mantra}” को dropdown से हटाएँ?\n\nGoogle Sheets में पुरानी counting delete नहीं होगी।`
        );
        if (!confirmed) return;

        const remaining = readCustomMantras(userId)
            .filter(item => mantraKey(item) !== mantraKey(mantra));
        writeCustomMantras(userId, remaining);

        const select = document.getElementById("mantraSelect");
        const wasSelected = select && mantraKey(select.value) === mantraKey(mantra);

        renderCustomMantras();

        if (wasSelected && select?.options.length) {
            select.value = select.options[0].value;
            select.dispatchEvent(new Event("change", { bubbles: true }));
        }

        showMessage("Custom mantra dropdown से हटा दिया गया।", "success");
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
    }

    function initializeCustomMantras() {
        const form = document.getElementById("customMantraForm");
        if (!form) return;

        captureStandardMantras();
        form.addEventListener("submit", addCustomMantra);
        refreshForCurrentUser();

        refreshTimer = window.setInterval(refreshForCurrentUser, 900);

        window.addEventListener("storage", event => {
            if (activeUserId && event.key === storageKey(activeUserId)) {
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

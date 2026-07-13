// Authenticated Naam Jaap Counter API v2.3.
// ID tokens are sent in a POST body, never in URL query parameters.

const API_URL = window.APP_CONFIG?.API_URL || "";
const API_TIMEOUT_MS = 25000;

async function api(action, params = {}, options = {}) {
    const idToken = options.idToken || getAuthCredential();

    if (!idToken) {
        throw new Error("Please sign in with Google first.");
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                // text/plain keeps this a CORS-simple request for Apps Script Web Apps.
                "Content-Type": "text/plain;charset=UTF-8",
            },
            body: JSON.stringify({
                action,
                params,
                idToken,
                device: getDeviceContext(),
            }),
            cache: "no-store",
            redirect: "follow",
            credentials: "omit",
            referrerPolicy: "no-referrer",
            signal: controller.signal,
        });

        const rawText = await response.text();

        if (!response.ok) {
            throw new Error(`Server request failed (${response.status}).`);
        }

        if (!rawText.trim()) {
            throw new Error("Server returned an empty response.");
        }

        let payload;
        try {
            payload = JSON.parse(rawText);
        } catch (_error) {
            throw new Error("Server returned invalid JSON. Deploy the secure Apps Script backend first.");
        }

        if (payload && payload.success === false) {
            const code = String(payload.code || "");
            if (["AUTH_REQUIRED", "AUTH_INVALID", "AUTH_EXPIRED", "AUTH_FORBIDDEN"].includes(code)) {
                handleAuthExpired(payload.message || "Your Google session is no longer valid.");
            }
            throw new Error(payload.message || payload.error || "Server rejected the request.");
        }

        return payload?.data ?? payload?.result ?? payload;
    } catch (error) {
        if (error.name === "AbortError") {
            throw new Error("Request timed out. Please check your internet connection.");
        }

        if (error instanceof TypeError) {
            throw new Error("Network error. Please check your internet connection.");
        }

        throw error;
    } finally {
        window.clearTimeout(timeoutId);
    }
}

function authenticateUser(idToken) {
    return api("authenticate", {}, { idToken });
}

function getDashboard() {
    return api("getDashboard");
}

function addCount(num = 1, operationId = "", metadata = {}) {
    return api("addCount", {
        num,
        operationId,
        batchId: operationId,
        clientCreatedAt: metadata.clientCreatedAt || "",
        localDate: metadata.localDate || "",
        mantra: metadata.mantra || "",
    });
}

function saveMantra(mantra, operationId = "") {
    return api("saveMantra", {
        mantra,
        selectedMantra: mantra,
        value: mantra,
        operationId,
    });
}

function resetToday() {
    return api("resetToday");
}

function resetAll() {
    return api("resetAll");
}

function getHistory(limit = 100) {
    return api("getHistory", { limit });
}

// Naam Jaap Counter API v2.x

const API_URL =
    "https://script.google.com/macros/s/AKfycbzfUW7ADdZfzE82PEsE5czOLdGuTlY4S1SEb_698IX-4ti1-l4aWXdLBUh1nMOc2L4s/exec";

const API_TIMEOUT_MS = 20000;

async function api(action, params = {}) {
    const url = new URL(API_URL);
    url.searchParams.set("action", action);

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            url.searchParams.set(key, String(value));
        }
    });

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
        const response = await fetch(url.toString(), {
            method: "GET",
            cache: "no-store",
            redirect: "follow",
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
            throw new Error("Server returned invalid JSON.");
        }

        if (payload && payload.success === false) {
            throw new Error(payload.message || payload.error || "Server rejected the request.");
        }

        return payload;
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

function getDashboard() {
    return api("getDashboard");
}

function addCount(num = 1) {
    return api("addCount", { num });
}

function saveMantra(mantra) {
    return api("saveMantra", {
        mantra,
        selectedMantra: mantra,
        value: mantra,
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

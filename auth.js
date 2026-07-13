// Google Identity Services authentication and pseudonymous device identity.

const AUTH_SESSION_KEY = "naam-jaap-auth-session-v1";
const DEVICE_ID_KEY = "naam-jaap-device-id-v1";

let authState = {
    idToken: "",
    user: null,
    deviceKey: "",
    onAuthenticated: null,
    onSignedOut: null,
};

function isGoogleClientConfigured() {
    const clientId = String(window.APP_CONFIG?.GOOGLE_CLIENT_ID || "").trim();
    return Boolean(clientId)
        && !clientId.includes("PASTE_YOUR")
        && clientId.endsWith(".apps.googleusercontent.com");
}

function createRandomDeviceId() {
    if (window.crypto?.randomUUID) {
        return window.crypto.randomUUID();
    }

    const bytes = new Uint8Array(16);
    window.crypto?.getRandomValues?.(bytes);
    return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("")
        || `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getOrCreateDeviceId() {
    try {
        let deviceId = localStorage.getItem(DEVICE_ID_KEY);
        if (!deviceId) {
            deviceId = createRandomDeviceId();
            localStorage.setItem(DEVICE_ID_KEY, deviceId);
        }
        return deviceId;
    } catch (_error) {
        return createRandomDeviceId();
    }
}

function detectBrowser() {
    const ua = navigator.userAgent || "";
    if (/Edg\//.test(ua)) return "Microsoft Edge";
    if (/OPR\//.test(ua)) return "Opera";
    if (/CriOS\//.test(ua)) return "Chrome iOS";
    if (/Chrome\//.test(ua)) return "Google Chrome";
    if (/FxiOS\//.test(ua)) return "Firefox iOS";
    if (/Firefox\//.test(ua)) return "Firefox";
    if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return "Safari";
    return "Other browser";
}

function getDeviceContext() {
    const coarsePlatform = navigator.userAgentData?.platform
        || navigator.platform
        || "Unknown";

    return {
        deviceId: getOrCreateDeviceId(),
        deviceType: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent || "")
            ? "Mobile/Tablet"
            : "Desktop",
        platform: coarsePlatform,
        browser: detectBrowser(),
        language: navigator.language || "",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
        screen: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
        appVersion: window.APP_CONFIG?.APP_VERSION || "unknown",
    };
}

function getAuthCredential() {
    return authState.idToken || "";
}

function isAuthenticated() {
    return Boolean(authState.idToken && authState.user);
}

function readStoredAuthSession() {
    try {
        const saved = JSON.parse(sessionStorage.getItem(AUTH_SESSION_KEY) || "null");
        if (!saved || !saved.idToken) return null;
        return saved;
    } catch (_error) {
        return null;
    }
}

function writeAuthSession() {
    try {
        sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({
            idToken: authState.idToken,
            user: authState.user,
            deviceKey: authState.deviceKey,
        }));
    } catch (_error) {
        // In-memory authentication still works when sessionStorage is unavailable.
    }
}

function clearAuthSession() {
    authState.idToken = "";
    authState.user = null;
    authState.deviceKey = "";
    try {
        sessionStorage.removeItem(AUTH_SESSION_KEY);
    } catch (_error) {
        // Ignore storage restrictions.
    }
}

function setAuthMessage(message, type = "info") {
    const element = document.getElementById("authMessage");
    if (!element) return;
    element.textContent = message;
    element.dataset.type = type;
}

function setLoginBusy(isBusy) {
    const loader = document.getElementById("authLoading");
    const buttonContainer = document.getElementById("googleSignInButton");
    if (loader) loader.hidden = !isBusy;
    if (buttonContainer) buttonContainer.style.pointerEvents = isBusy ? "none" : "auto";
}

function renderAccountProfile(user, deviceKey = "") {
    const name = String(user?.name || "Google User");
    const email = String(user?.email || "");
    const initial = name.trim().charAt(0).toUpperCase() || "G";

    document.querySelectorAll("[data-user-name]").forEach(element => {
        element.textContent = name;
    });
    document.querySelectorAll("[data-user-email]").forEach(element => {
        element.textContent = email;
    });
    document.querySelectorAll("[data-user-initial]").forEach(element => {
        element.textContent = initial;
    });

    const deviceElement = document.getElementById("accountDeviceKey");
    if (deviceElement) {
        deviceElement.textContent = deviceKey ? `Device ${deviceKey}` : "Registered device";
    }
}

function showAuthenticatedApp() {
    const authGate = document.getElementById("authGate");
    const appRoot = document.getElementById("appRoot");
    if (authGate) authGate.hidden = true;
    if (appRoot) appRoot.hidden = false;
    renderAccountProfile(authState.user, authState.deviceKey);
}

function showLoginGate() {
    const authGate = document.getElementById("authGate");
    const appRoot = document.getElementById("appRoot");
    if (appRoot) appRoot.hidden = true;
    if (authGate) authGate.hidden = false;
}

async function acceptVerifiedSession(idToken) {
    setLoginBusy(true);
    setAuthMessage("Verifying your Google account securely…", "info");

    try {
        const result = await authenticateUser(idToken);
        const user = result?.user || result?.profile || result;

        if (!user?.id || !user?.email) {
            throw new Error("The server did not return a verified user profile.");
        }

        authState.idToken = idToken;
        authState.user = user;
        authState.deviceKey = String(result?.deviceKey || "");
        writeAuthSession();
        showAuthenticatedApp();
        setAuthMessage("Signed in.", "success");

        if (typeof authState.onAuthenticated === "function") {
            await authState.onAuthenticated({ ...authState });
        }
    } catch (error) {
        clearAuthSession();
        showLoginGate();
        setAuthMessage(error.message || "Google sign-in could not be verified.", "error");
        throw error;
    } finally {
        setLoginBusy(false);
    }
}

async function handleGoogleCredential(response) {
    if (!response?.credential) {
        setAuthMessage("Google did not return a sign-in credential.", "error");
        return;
    }

    try {
        await acceptVerifiedSession(response.credential);
    } catch (error) {
        console.error("Google authentication failed:", error);
    }
}

function waitForGoogleIdentity(timeoutMs = 12000) {
    return new Promise((resolve, reject) => {
        const startedAt = Date.now();
        const timer = window.setInterval(() => {
            if (window.google?.accounts?.id) {
                window.clearInterval(timer);
                resolve(window.google.accounts.id);
                return;
            }

            if (Date.now() - startedAt >= timeoutMs) {
                window.clearInterval(timer);
                reject(new Error("Google Sign-In could not be loaded. Check your internet connection."));
            }
        }, 120);
    });
}

async function renderGoogleSignIn() {
    if (!isGoogleClientConfigured()) {
        setAuthMessage(
            "Setup required: add the Google Web Client ID in config.js before publishing this version.",
            "error"
        );
        return;
    }

    try {
        const googleIdentity = await waitForGoogleIdentity();
        googleIdentity.initialize({
            client_id: window.APP_CONFIG.GOOGLE_CLIENT_ID,
            callback: handleGoogleCredential,
            auto_select: false,
            cancel_on_tap_outside: true,
            context: "signin",
            ux_mode: "popup",
        });

        const container = document.getElementById("googleSignInButton");
        if (!container) return;
        container.innerHTML = "";
        googleIdentity.renderButton(container, {
            type: "standard",
            theme: "outline",
            size: "large",
            text: "signin_with",
            shape: "pill",
            logo_alignment: "left",
            width: Math.min(340, Math.max(240, window.innerWidth - 72)),
            locale: "en",
        });
        setAuthMessage("Sign in to sync your jaap securely.", "info");
    } catch (error) {
        setAuthMessage(error.message, "error");
    }
}

async function restoreStoredAuthentication() {
    const stored = readStoredAuthSession();
    if (!stored?.idToken) return false;

    try {
        await acceptVerifiedSession(stored.idToken);
        return true;
    } catch (_error) {
        return false;
    }
}

async function signOutUser() {
    clearAuthSession();
    if (window.google?.accounts?.id) {
        window.google.accounts.id.disableAutoSelect();
    }
    showLoginGate();
    setAuthMessage("You have been signed out safely.", "success");
    await renderGoogleSignIn();

    if (typeof authState.onSignedOut === "function") {
        authState.onSignedOut();
    }
}

function handleAuthExpired(message = "Your session expired. Please sign in again.") {
    clearAuthSession();
    showLoginGate();
    setAuthMessage(message, "error");
    renderGoogleSignIn();

    if (typeof authState.onSignedOut === "function") {
        authState.onSignedOut();
    }
}

async function initializeAuthentication({ onAuthenticated, onSignedOut } = {}) {
    authState.onAuthenticated = onAuthenticated || null;
    authState.onSignedOut = onSignedOut || null;

    document.getElementById("signOutBtn")?.addEventListener("click", signOutUser);
    document.getElementById("accountButton")?.addEventListener("click", () => {
        if (typeof switchView === "function") switchView("settings");
    });

    showLoginGate();
    await renderGoogleSignIn();
    await restoreStoredAuthentication();
}

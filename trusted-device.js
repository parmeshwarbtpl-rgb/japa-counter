// Naam Jaap Counter v2.9.7 — trusted device access.
// A verified local profile opens the app without blocking on Google sign-in.
// Cloud sync still requires a live Google credential.

const TRUSTED_DEVICE_PROFILE_DAYS = 30;
const TRUSTED_DEVICE_PREF_KEY = "naam-jaap-trusted-device-v1";

offlineSaveVerifiedProfile = async function trustedOfflineSaveVerifiedProfile(user, deviceKey) {
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
        expiresAt: verifiedAt + TRUSTED_DEVICE_PROFILE_DAYS * 24 * 60 * 60 * 1000,
    };

    await offlinePutMeta("verifiedProfile", profile);

    try {
        localStorage.setItem(TRUSTED_DEVICE_PREF_KEY, "1");
    } catch (_error) {
        // IndexedDB profile is still enough for trusted-device opening.
    }

    return profile;
};

const originalSignOutUserV297 = signOutUser;

signOutUser = async function trustedSignOutUser() {
    try {
        localStorage.removeItem(TRUSTED_DEVICE_PREF_KEY);
    } catch (_error) {
        // Ignore storage restrictions.
    }
    return originalSignOutUserV297();
};

handleAuthExpired = function trustedHandleAuthExpired(
    message = "Cloud sync needs Google reconnection."
) {
    clearLiveAuthSession();
    setAuthMessage(message, "info");

    if (typeof authState.onSignedOut === "function") {
        authState.onSignedOut({ keepOfflineSession: true });
    }

    // Do not force the user back to the login gate.
    // The app remains usable and queues local activity until Reconnect Sync is tapped.
    if (typeof updateOnlineState === "function") {
        Promise.resolve(updateOnlineState()).catch(() => undefined);
    }
};

renderGoogleSignIn = async function trustedRenderGoogleSignIn() {
    if (!navigator.onLine) {
        setAuthMessage(
            "You are offline. Your trusted device profile can continue locally.",
            "info"
        );
        await updateContinueOfflineButton();
        return;
    }

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
            itp_support: true,
            use_fedcm_for_button: true,
            button_auto_select: true,
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

        await updateContinueOfflineButton();

        setAuthMessage(
            isLikelyEmbeddedBrowser()
                ? "For Google sync, open this app directly in Chrome or Safari."
                : "Google is needed only to start or restore cloud sync. Trusted-device access stays local.",
            "info"
        );
    } catch (error) {
        setAuthMessage(error.message, "error");
        await updateContinueOfflineButton();
    }
};

initializeAuthentication = async function trustedInitializeAuthentication(
    { onAuthenticated, onSignedOut } = {}
) {
    authState.onAuthenticated = onAuthenticated || null;
    authState.onSignedOut = onSignedOut || null;

    document.getElementById("signOutBtn")?.addEventListener("click", signOutUser);
    document.getElementById("accountButton")?.addEventListener("click", () => {
        if (typeof switchView === "function") switchView("settings");
    });
    document.getElementById("continueOfflineBtn")?.addEventListener(
        "click",
        restoreOfflineAuthentication
    );
    document.getElementById("reconnectBtn")?.addEventListener(
        "click",
        beginOnlineSignIn
    );

    showLoginGate();

    // A live session inside the same browser session is always preferred.
    if (navigator.onLine) {
        const restoredLive = await restoreStoredAuthentication();
        if (restoredLive) return;
    }

    // If a user already verified this device, open local mode immediately
    // even when the device is online. This removes the repeated login gate.
    const restoredTrusted = await restoreOfflineAuthentication();
    if (restoredTrusted) {
        const reconnect = document.getElementById("reconnectBtn");
        if (reconnect) reconnect.textContent = "Reconnect Sync";
        return;
    }

    if (!navigator.onLine) {
        setAuthMessage(
            "Connect to the internet and sign in once to verify this device.",
            "error"
        );
        return;
    }

    await renderGoogleSignIn();
};

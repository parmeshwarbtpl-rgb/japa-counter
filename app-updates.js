// Naam Jaap Counter v2.9.15 — app update checker.
// Uses the public config.js as the version source of truth.

(() => {
    const CURRENT_BUILD = "2.9.15";
    let detectedRemoteVersion = "";
    let updateAvailable = false;

    function baseVersion(value) {
        const match = String(value || "").match(/\d+\.\d+\.\d+/);
        return match ? match[0] : String(value || "").trim();
    }

    function versionParts(value) {
        return baseVersion(value)
            .split(".")
            .map(part => Number.parseInt(part, 10) || 0);
    }

    function compareVersions(left, right) {
        const a = versionParts(left);
        const b = versionParts(right);
        const length = Math.max(a.length, b.length);

        for (let index = 0; index < length; index += 1) {
            const av = a[index] || 0;
            const bv = b[index] || 0;
            if (av > bv) return 1;
            if (av < bv) return -1;
        }

        return 0;
    }

    function currentVersion() {
        return baseVersion(
            window.APP_CONFIG?.APP_VERSION ||
            CURRENT_BUILD
        );
    }

    function setStatus(message, type = "info") {
        const status = document.getElementById("appUpdateStatus");
        if (!status) return;

        status.textContent = message;
        status.dataset.type = type;
    }

    function syncAboutVersion() {
        const version = currentVersion();

        const heading = document.getElementById("aboutAppVersion");
        if (heading) {
            heading.textContent = `Naam Jaap Counter v${version}`;
        }

        document
            .querySelectorAll("[data-current-app-version]")
            .forEach(element => {
                element.textContent = `v${version}`;
            });
    }

    function installUpdateStyles() {
        if (document.getElementById("appUpdateStyles")) return;

        const style = document.createElement("style");
        style.id = "appUpdateStyles";
        style.textContent = `
            .app-update-card {
                overflow: hidden;
            }

            .app-update-heading {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 12px;
                margin-bottom: 12px;
            }

            .app-update-heading h3 {
                margin: 0;
            }

            .app-update-version-badge {
                flex: 0 0 auto;
                border: 1px solid #ffd2ad;
                border-radius: 999px;
                padding: 6px 10px;
                background: #fff8f1;
                color: #d85d00;
                font-size: 0.78rem;
                font-weight: 800;
                white-space: nowrap;
            }

            .app-update-status {
                margin: 10px 0 12px;
                padding: 10px 12px;
                border-radius: 12px;
                background: #f7f8fa;
                color: #686d75;
                font-size: 0.82rem;
                line-height: 1.5;
            }

            .app-update-status[data-type="success"] {
                background: #e8f8f1;
                color: #147a52;
            }

            .app-update-status[data-type="warning"] {
                background: #fff4df;
                color: #8a5400;
            }

            .app-update-status[data-type="error"] {
                background: #fff0ee;
                color: #b42318;
            }

            .app-update-actions {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
            }

            .app-update-actions button {
                width: 100%;
            }

            @media (max-width: 520px) {
                .app-update-heading {
                    flex-direction: column;
                }

                .app-update-actions {
                    grid-template-columns: 1fr;
                }
            }
        `;

        document.head.appendChild(style);
    }

    function createUpdateCard() {
        if (document.getElementById("appUpdateCard")) {
            syncAboutVersion();
            return;
        }

        const aboutCard = document.querySelector(".about-card");
        if (!aboutCard?.parentElement) return;

        const card = document.createElement("section");
        card.id = "appUpdateCard";
        card.className = "card app-update-card";
        card.innerHTML = `
            <div class="app-update-heading">
                <div>
                    <p class="eyebrow">App Updates</p>
                    <h3>Version & Updates</h3>
                </div>
                <span
                    class="app-update-version-badge"
                    data-current-app-version
                >
                    v${currentVersion()}
                </span>
            </div>

            <p class="field-help">
                Check whether a newer Naam Jaap Counter frontend is available.
            </p>

            <div
                id="appUpdateStatus"
                class="app-update-status"
                data-type="info"
            >
                Current version: v${currentVersion()}
            </div>

            <div class="app-update-actions">
                <button
                    id="checkAppUpdateBtn"
                    class="secondary-btn"
                    type="button"
                >
                    ↻ Check for Updates
                </button>

                <button
                    id="applyAppUpdateBtn"
                    class="primary-btn"
                    type="button"
                    hidden
                >
                    Update Now
                </button>
            </div>
        `;

        aboutCard.parentElement.insertBefore(card, aboutCard);

        document
            .getElementById("checkAppUpdateBtn")
            ?.addEventListener(
                "click",
                () => checkForAppUpdate({ userInitiated: true })
            );

        document
            .getElementById("applyAppUpdateBtn")
            ?.addEventListener(
                "click",
                applyAppUpdate
            );

        syncAboutVersion();
    }

    async function fetchRemoteVersion() {
        const response = await fetch(
            `./config.js?update-check=${Date.now()}`,
            {
                cache: "no-store",
                headers: {
                    "Cache-Control": "no-cache"
                }
            }
        );

        if (!response.ok) {
            throw new Error(
                `Update check failed (${response.status}).`
            );
        }

        const text = await response.text();

        const match = text.match(
            /APP_VERSION\s*:\s*["']([^"']+)["']/
        );

        if (!match?.[1]) {
            throw new Error(
                "Published version could not be read."
            );
        }

        return baseVersion(match[1]);
    }

    async function checkForAppUpdate({ userInitiated = false } = {}) {
        const button = document.getElementById("checkAppUpdateBtn");
        const updateButton = document.getElementById("applyAppUpdateBtn");

        if (!navigator.onLine) {
            setStatus(
                "You are offline. Connect to the internet to check for updates.",
                "warning"
            );
            return false;
        }

        if (button) {
            button.disabled = true;
            button.textContent = "Checking…";
        }

        try {
            const remote = await fetchRemoteVersion();
            const current = currentVersion();

            detectedRemoteVersion = remote;
            updateAvailable =
                compareVersions(remote, current) > 0;

            if (updateAvailable) {
                setStatus(
                    `New version v${remote} is available. Current version is v${current}.`,
                    "warning"
                );

                if (updateButton) {
                    updateButton.hidden = false;
                    updateButton.textContent = `Update to v${remote}`;
                }

                if (
                    userInitiated &&
                    typeof showToast === "function"
                ) {
                    showToast(
                        `Naam Jaap Counter v${remote} is available.`,
                        "success"
                    );
                }

                return true;
            }

            if (updateButton) {
                updateButton.hidden = true;
            }

            setStatus(
                `Naam Jaap Counter v${current} is up to date.`,
                "success"
            );

            if (
                userInitiated &&
                typeof showToast === "function"
            ) {
                showToast(
                    `v${current} is the latest published version.`,
                    "success"
                );
            }

            return false;
        } catch (error) {
            console.error("App update check failed:", error);

            setStatus(
                error.message ||
                "Update check could not be completed.",
                "error"
            );

            if (
                userInitiated &&
                typeof showToast === "function"
            ) {
                showToast(
                    "Could not check for updates.",
                    "error"
                );
            }

            return false;
        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = "↻ Check for Updates";
            }
        }
    }

    async function applyAppUpdate() {
        const button = document.getElementById("applyAppUpdateBtn");

        if (!updateAvailable || !detectedRemoteVersion) {
            await checkForAppUpdate({ userInitiated: true });

            if (!updateAvailable) return;
        }

        if (button) {
            button.disabled = true;
            button.textContent = "Updating…";
        }

        setStatus(
            `Updating to v${detectedRemoteVersion}…`,
            "warning"
        );

        try {
            if ("serviceWorker" in navigator) {
                const registration =
                    await navigator.serviceWorker.getRegistration();

                if (registration) {
                    await registration.update();

                    if (registration.waiting) {
                        registration.waiting.postMessage({
                            type: "SKIP_WAITING"
                        });
                    }
                }
            }

            await new Promise(resolve =>
                window.setTimeout(resolve, 800)
            );

            const url = new URL(window.location.href);
            url.searchParams.set(
                "app-version",
                detectedRemoteVersion
            );
            url.searchParams.set(
                "updated",
                String(Date.now())
            );

            window.location.replace(url.toString());
        } catch (error) {
            console.error("App update failed:", error);

            setStatus(
                "The update could not be applied automatically. Close and reopen the app.",
                "error"
            );

            if (button) {
                button.disabled = false;
                button.textContent = "Update Now";
            }
        }
    }

    function initializeAppUpdateSystem() {
        installUpdateStyles();
        createUpdateCard();
        syncAboutVersion();

        // Quiet check after app startup. It does not interrupt the user.
        window.setTimeout(
            () => checkForAppUpdate({ userInitiated: false }),
            3500
        );
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeAppUpdateSystem,
            { once: true }
        );
    } else {
        initializeAppUpdateSystem();
    }
})();
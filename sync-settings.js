// Naam Jaap Counter v2.9.15 — move Sync status from Dashboard to Settings.
// The existing sync state and Google Sheets logic are reused unchanged.

(() => {
    if (window.__naamJaapSyncSettingsV2915) return;
    window.__naamJaapSyncSettingsV2915 = true;

    function byId(id) {
        return document.getElementById(id);
    }

    function installStyles() {
        if (byId("syncSettingsStylesV2915")) return;

        const style = document.createElement("style");
        style.id = "syncSettingsStylesV2915";
        style.textContent = `
            /* Dashboard keeps Daily Streak only after Sync is moved. */
            #dashboardConfidenceGrid.sync-moved-to-settings {
                grid-template-columns: 1fr;
            }

            #dashboardConfidenceGrid.sync-moved-to-settings
            .streak-confidence-card {
                width: 100%;
            }

            /* Settings Sync card */
            .sync-settings-card {
                overflow: hidden;
                border-color: rgba(46, 125, 50, 0.18);
            }

            .sync-settings-heading {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 12px;
            }

            .sync-settings-heading h3 {
                margin-top: 4px;
            }

            .sync-settings-badge {
                flex: 0 0 auto;
                border: 1px solid #bce8d5;
                border-radius: 999px;
                padding: 6px 10px;
                background: #e8f8f1;
                color: #147a52;
                font-size: 0.72rem;
                font-weight: 800;
                white-space: nowrap;
            }

            #syncSettingsSlot {
                margin-top: 14px;
            }

            .sync-settings-card .sync-confidence-card {
                width: 100%;
                min-height: 76px;
                margin: 0;
                padding: 14px;
                border: 1px solid #dce7e1;
                border-radius: 15px;
                box-shadow: none;
                background: #fbfefc;
            }

            .sync-settings-card .sync-confidence-card .confidence-icon {
                width: 42px;
                height: 42px;
                flex-basis: 42px;
            }

            .sync-settings-card .sync-confidence-card .confidence-copy strong {
                font-size: 1rem;
                white-space: normal;
            }

            .sync-settings-card .sync-confidence-card .confidence-copy span {
                overflow: visible;
                font-size: 0.78rem;
                text-overflow: clip;
                white-space: normal;
            }

            .sync-settings-help {
                margin-top: 12px;
                color: var(--muted);
                font-size: 0.8rem;
                line-height: 1.5;
            }

            @media (max-width: 520px) {
                .sync-settings-heading {
                    align-items: center;
                }

                .sync-settings-card .sync-confidence-card {
                    gap: 10px;
                    padding: 13px;
                }

                .sync-settings-card .sync-confidence-card .confidence-icon {
                    width: 38px;
                    height: 38px;
                    flex-basis: 38px;
                }

                .sync-settings-card .sync-confidence-card .confidence-copy strong {
                    font-size: 0.92rem;
                }

                .sync-settings-card .sync-confidence-card .confidence-copy span {
                    font-size: 0.74rem;
                }
            }
        `;

        document.head.appendChild(style);
    }

    function createSettingsCard() {
        let card = byId("syncSettingsCard");
        if (card) return card;

        const settingsView = byId("settingsView");
        if (!settingsView) return null;

        card = document.createElement("section");
        card.id = "syncSettingsCard";
        card.className = "card sync-settings-card";
        card.setAttribute("aria-labelledby", "syncSettingsTitle");

        card.innerHTML = `
            <div class="sync-settings-heading">
                <div>
                    <p class="eyebrow">Cloud Sync</p>
                    <h3 id="syncSettingsTitle">Google Sheets Sync</h3>
                </div>
                <span class="sync-settings-badge">Data Status</span>
            </div>

            <div id="syncSettingsSlot"></div>

            <p class="sync-settings-help">
                Jaap counts sync with your verified Google account when connected.
                If the app is offline, new counts remain saved on this device and
                sync later when connection is restored.
            </p>
        `;

        const accountCard =
            settingsView.querySelector(".account-card");

        if (accountCard?.parentElement === settingsView) {
            settingsView.insertBefore(card, accountCard);
        } else {
            const firstCard = settingsView.querySelector(".card");

            if (firstCard) {
                settingsView.insertBefore(card, firstCard);
            } else {
                settingsView.appendChild(card);
            }
        }

        return card;
    }

    function moveSyncCardToSettings() {
        const syncCard = byId("syncConfidenceCard");
        const settingsCard = createSettingsCard();
        const slot = byId("syncSettingsSlot");

        if (!syncCard || !settingsCard || !slot) {
            return false;
        }

        if (syncCard.parentElement !== slot) {
            slot.appendChild(syncCard);
        }

        const dashboardGrid =
            byId("dashboardConfidenceGrid");

        if (dashboardGrid) {
            dashboardGrid.classList.add(
                "sync-moved-to-settings"
            );

            dashboardGrid.setAttribute(
                "aria-label",
                "Daily streak status"
            );
        }

        // Keep the Settings display concise.
        const title = byId("syncConfidenceTitle");
        const detail = byId("syncConfidenceDetail");
        const state = String(
            syncCard.dataset.state || "loading"
        );

        if (state === "online") {
            if (title) title.textContent = "Synced";
            if (detail) detail.textContent = "Google Sheets";
        } else if (state === "offline") {
            if (title) title.textContent = "Offline Safe";
            if (detail) detail.textContent = "Saved on device";
        }

        return true;
    }

    function watchForDashboardSyncCard() {
        if (moveSyncCardToSettings()) return;

        let attempts = 0;

        const timer = window.setInterval(() => {
            attempts += 1;

            if (
                moveSyncCardToSettings() ||
                attempts >= 20
            ) {
                window.clearInterval(timer);
            }
        }, 200);
    }

    function initialize() {
        installStyles();
        createSettingsCard();
        watchForDashboardSyncCard();
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            { once: true }
        );
    } else {
        initialize();
    }
})();
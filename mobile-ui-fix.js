// Naam Jaap Counter v2.9.14 — Mobile Header & Sync Card Fix.
// Presentation-only layer. It does not change jaap, authentication, or sync storage logic.

(() => {
    if (window.__naamJaapMobileUiFixV2914) return;
    window.__naamJaapMobileUiFixV2914 = true;

    function byId(id) {
        return document.getElementById(id);
    }

    function installStyles() {
        if (byId("mobileUiFixStylesV2914")) return;

        const style = document.createElement("style");
        style.id = "mobileUiFixStylesV2914";
        style.textContent = `
            /* Keep sync card readable instead of repeating a long sentence. */
            .sync-confidence-card .confidence-copy span {
                max-width: 100%;
                text-overflow: clip;
            }

            @media (max-width: 520px) {
                .app-header {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) auto;
                    align-items: center;
                    gap: 8px;
                    min-height: 96px;
                    padding:
                        calc(14px + env(safe-area-inset-top))
                        12px
                        14px;
                }

                .header-brand {
                    gap: 9px;
                    min-width: 0;
                    overflow: hidden;
                }

                .brand-mark {
                    width: 44px;
                    height: 44px;
                    flex: 0 0 44px;
                    border-radius: 14px;
                    font-size: 26px;
                }

                .header-brand > div:last-child {
                    min-width: 0;
                    overflow: hidden;
                }

                .app-header h1 {
                    width: 126px;
                    max-width: 100%;
                    font-size: 20px;
                    line-height: 1.08;
                    overflow-wrap: normal;
                    word-break: normal;
                }

                /* Keep the full connection string in the DOM for app logic,
                   but show a short mobile-safe label visually. */
                .connection-text {
                    max-width: 132px;
                    margin-top: 4px;
                    overflow: hidden;
                    font-size: 0;
                    line-height: 1.2;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .connection-text::after {
                    content: attr(data-mobile-text);
                    color: rgba(255, 255, 255, 0.88);
                    font-size: 10.5px;
                    line-height: 1.2;
                    white-space: nowrap;
                }

                .account-chip {
                    width: auto;
                    min-width: 0;
                    max-width: 116px;
                    gap: 6px;
                    padding: 4px 8px 4px 4px;
                }

                .account-chip:has(.account-initial.has-local-profile-photo) {
                    min-height: 48px;
                    padding: 4px 8px 4px 4px;
                }

                .account-initial.has-local-profile-photo {
                    width: 40px;
                    height: 40px;
                    flex: 0 0 40px;
                }

                .account-chip-copy {
                    min-width: 0;
                    overflow: hidden;
                }

                .account-chip-name {
                    display: block !important;
                    max-width: 62px !important;
                    overflow: hidden;
                    font-size: 11.5px;
                    line-height: 1.15;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                /* Status remains available in Profile/Settings; hiding it here
                   prevents the mobile header from becoming too wide. */
                .account-chip-status {
                    display: none !important;
                }

                .confidence-card {
                    gap: 7px;
                    padding: 11px 9px;
                }

                .confidence-icon {
                    width: 32px;
                    height: 32px;
                    flex-basis: 32px;
                    border-radius: 10px;
                    font-size: 16px;
                }

                .confidence-copy small {
                    font-size: 0.62rem;
                }

                .confidence-copy strong {
                    font-size: 0.83rem;
                }

                .confidence-copy span {
                    font-size: 0.66rem;
                    white-space: nowrap;
                }
            }

            @media (max-width: 350px) {
                .app-header {
                    padding-left: 10px;
                    padding-right: 10px;
                }

                .brand-mark {
                    width: 40px;
                    height: 40px;
                    flex-basis: 40px;
                    font-size: 24px;
                }

                .app-header h1 {
                    width: 112px;
                    font-size: 18px;
                }

                .connection-text {
                    max-width: 116px;
                }

                .account-chip {
                    max-width: 94px;
                }

                .account-initial.has-local-profile-photo {
                    width: 38px;
                    height: 38px;
                    flex-basis: 38px;
                }

                .account-chip-name {
                    max-width: 45px !important;
                    font-size: 10.5px;
                }
            }
        `;

        document.head.appendChild(style);
    }

    function mobileConnectionLabel(element) {
        const status = String(element?.dataset?.status || "").toLowerCase();
        const text = String(element?.textContent || "").toLowerCase();

        if (status === "online" || text.includes("synced")) {
            return "Google Sheets • Synced";
        }

        if (status === "offline" || text.includes("offline")) {
            return "Offline • Saved locally";
        }

        if (status === "error" || text.includes("retry") || text.includes("failed")) {
            return "Sync • Retry";
        }

        if (text.includes("waiting") || text.includes("pending")) {
            return "Sync • Pending";
        }

        if (text.includes("syncing") || text.includes("connecting")) {
            return "Google Sheets • Syncing";
        }

        return "Google Sheets";
    }

    function updateMobileConnectionLabel() {
        const element = byId("connectionText");
        if (!element) return;

        const next = mobileConnectionLabel(element);
        if (element.dataset.mobileText !== next) {
            element.dataset.mobileText = next;
        }
    }

    function normalizeSyncCard() {
        const card = byId("syncConfidenceCard");
        const title = byId("syncConfidenceTitle");
        const detail = byId("syncConfidenceDetail");

        if (!card || !title || !detail) return;

        const state = String(card.dataset.state || "loading");
        const currentTitle = String(title.textContent || "").toLowerCase();

        let nextDetail = "Google Sheets";

        if (state === "offline") {
            nextDetail = "Saved on device";
        } else if (state === "error") {
            nextDetail = "Count is safe";
        } else if (currentTitle.includes("pending") || currentTitle.includes("saved locally")) {
            nextDetail = "Saved on device";
        } else if (currentTitle.includes("syncing")) {
            nextDetail = "Google Sheets";
        } else if (state === "online") {
            nextDetail = "Google Sheets";
        }

        if (detail.textContent !== nextDetail) {
            detail.textContent = nextDetail;
        }
    }

    function observeStatus() {
        const connection = byId("connectionText");
        const syncCard = byId("syncConfidenceCard");

        if (connection) {
            const connectionObserver = new MutationObserver(
                updateMobileConnectionLabel
            );

            connectionObserver.observe(connection, {
                attributes: true,
                attributeFilter: ["data-status"],
                childList: true,
                characterData: true,
                subtree: true,
            });
        }

        if (syncCard) {
            const cardObserver = new MutationObserver(
                normalizeSyncCard
            );

            cardObserver.observe(syncCard, {
                attributes: true,
                attributeFilter: ["data-state"],
                childList: true,
                characterData: true,
                subtree: true,
            });
        }
    }

    function initialize() {
        installStyles();
        updateMobileConnectionLabel();
        normalizeSyncCard();
        observeStatus();

        // Dashboard polish is injected after DOMContentLoaded in some cached PWA
        // upgrade paths. Re-check briefly without changing app state.
        let attempts = 0;
        const timer = window.setInterval(() => {
            attempts += 1;
            updateMobileConnectionLabel();
            normalizeSyncCard();

            if (byId("syncConfidenceCard") || attempts >= 12) {
                window.clearInterval(timer);
                observeStatus();
            }
        }, 250);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize, { once: true });
    } else {
        initialize();
    }
})();

// Naam Jaap Counter v2.9.15 — Final Mobile Header Fix.
// Presentation-only. Auth, jaap, profile storage and sync are unchanged.

(() => {
    "use strict";

    if (window.__naamJaapFinalHeaderFix) return;
    window.__naamJaapFinalHeaderFix = true;

    function byId(id) {
        return document.getElementById(id);
    }

    function installStyles() {
        if (byId("naamJaapFinalHeaderStyles")) return;

        const style =
            document.createElement("style");

        style.id =
            "naamJaapFinalHeaderStyles";

        style.textContent = `
            /* Keep sync confidence cards readable. */
            .sync-confidence-card .confidence-copy span {
                max-width: 100%;
                text-overflow: clip;
            }

            @media (max-width: 520px) {
                #appRoot .app-header {
                    display: grid !important;
                    grid-template-columns:
                        minmax(0, 1fr)
                        42px !important;
                    grid-template-areas:
                        "brand switcher"
                        "account account" !important;
                    align-items: center !important;
                    gap: 13px 8px !important;
                    min-height: 0 !important;
                    padding:
                        calc(
                            16px +
                            env(safe-area-inset-top)
                        )
                        12px
                        16px !important;
                }

                #appRoot .header-brand {
                    grid-area: brand !important;
                    display: grid !important;
                    grid-template-columns:
                        46px
                        minmax(0, 1fr);
                    align-items: center;
                    gap: 9px !important;
                    width: 100% !important;
                    min-width: 0 !important;
                    max-width: none !important;
                    overflow: visible !important;
                }

                #appRoot .brand-mark {
                    width: 46px !important;
                    height: 46px !important;
                    min-width: 46px !important;
                    flex: 0 0 46px !important;
                    border-radius: 15px !important;
                    font-size: 27px !important;
                }

                #appRoot .header-brand > div:last-child {
                    width: 100% !important;
                    min-width: 0 !important;
                    max-width: none !important;
                    overflow: visible !important;
                }

                #appRoot .header-brand h1 {
                    width: auto !important;
                    max-width: none !important;
                    overflow: visible !important;
                    margin: 0 !important;
                    font-size: clamp(
                        17px,
                        4.8vw,
                        20px
                    ) !important;
                    line-height: 1.08 !important;
                    letter-spacing: -.035em;
                    overflow-wrap: normal !important;
                    word-break: normal !important;
                    text-overflow: clip !important;
                    white-space: nowrap !important;
                }

                #appRoot .connection-text {
                    width: auto !important;
                    max-width: none !important;
                    overflow: hidden !important;
                    margin-top: 4px !important;
                    font-size: 0 !important;
                    line-height: 1.2 !important;
                    text-overflow: ellipsis !important;
                    white-space: nowrap !important;
                }

                #appRoot .connection-text::after {
                    content: attr(data-mobile-text);
                    color:
                        rgba(
                            255,
                            255,
                            255,
                            .88
                        );
                    font-size: 10px !important;
                    line-height: 1.2 !important;
                    white-space: nowrap !important;
                }

                #embeddedSuiteHeaderButton,
                #headerAppSwitcherButton {
                    grid-area: switcher !important;
                    align-self: center !important;
                    justify-self: end !important;
                    width: 42px !important;
                    height: 42px !important;
                    min-width: 42px !important;
                    margin: 0 !important;
                    border-radius: 13px !important;
                    font-size: 19px !important;
                }

                #appRoot .account-chip {
                    grid-area: account !important;
                    display: grid !important;
                    grid-template-columns:
                        46px
                        minmax(0, 1fr) !important;
                    align-items: center !important;
                    justify-self: stretch !important;
                    gap: 10px !important;
                    width: 100% !important;
                    min-width: 0 !important;
                    max-width: none !important;
                    min-height: 60px !important;
                    padding:
                        7px
                        12px
                        7px
                        7px !important;
                    border-radius: 18px !important;
                    background:
                        rgba(
                            255,
                            255,
                            255,
                            .16
                        ) !important;
                    text-align: left !important;
                }

                #appRoot .account-chip:has(
                    .account-initial.has-local-profile-photo
                ) {
                    min-height: 60px !important;
                    padding:
                        7px
                        12px
                        7px
                        7px !important;
                }

                #appRoot .account-initial,
                #appRoot .account-initial.has-local-profile-photo {
                    width: 46px !important;
                    height: 46px !important;
                    min-width: 46px !important;
                    flex: 0 0 46px !important;
                    background-position: center !important;
                    background-size: cover !important;
                    font-size: 17px !important;
                }

                #appRoot .account-chip-copy {
                    display: block !important;
                    width: 100% !important;
                    min-width: 0 !important;
                    max-width: none !important;
                    overflow: visible !important;
                }

                #appRoot .account-chip-name {
                    display: block !important;
                    width: 100% !important;
                    max-width: none !important;
                    overflow: visible !important;
                    color: #ffffff !important;
                    font-size: 13.5px !important;
                    font-weight: 800 !important;
                    line-height: 1.22 !important;
                    text-overflow: clip !important;
                    white-space: normal !important;
                    overflow-wrap: anywhere !important;
                }

                #appRoot .account-chip-status {
                    display: block !important;
                    width: 100% !important;
                    max-width: none !important;
                    overflow: visible !important;
                    margin-top: 3px !important;
                    color:
                        rgba(
                            255,
                            255,
                            255,
                            .82
                        ) !important;
                    font-size: 9.5px !important;
                    font-weight: 600 !important;
                    line-height: 1.25 !important;
                    text-overflow: clip !important;
                    white-space: normal !important;
                    overflow-wrap: anywhere !important;
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
                    font-size: .62rem;
                }

                .confidence-copy strong {
                    font-size: .83rem;
                }

                .confidence-copy span {
                    font-size: .66rem;
                    white-space: nowrap;
                }
            }

            @media (max-width: 350px) {
                #appRoot .app-header {
                    grid-template-columns:
                        minmax(0, 1fr)
                        40px !important;
                    padding-left: 10px !important;
                    padding-right: 10px !important;
                }

                #appRoot .header-brand {
                    grid-template-columns:
                        42px
                        minmax(0, 1fr);
                    gap: 8px !important;
                }

                #appRoot .brand-mark {
                    width: 42px !important;
                    height: 42px !important;
                    min-width: 42px !important;
                    flex-basis: 42px !important;
                    font-size: 25px !important;
                }

                #appRoot .header-brand h1 {
                    font-size: 16px !important;
                }

                #embeddedSuiteHeaderButton,
                #headerAppSwitcherButton {
                    width: 40px !important;
                    height: 40px !important;
                    min-width: 40px !important;
                }

                #appRoot .account-chip {
                    grid-template-columns:
                        42px
                        minmax(0, 1fr) !important;
                }

                #appRoot .account-initial,
                #appRoot .account-initial.has-local-profile-photo {
                    width: 42px !important;
                    height: 42px !important;
                    min-width: 42px !important;
                    flex-basis: 42px !important;
                }

                #appRoot .account-chip-name {
                    font-size: 12.5px !important;
                }

                #appRoot .account-chip-status {
                    font-size: 9px !important;
                }
            }
        `;

        document.head.appendChild(style);
    }

    function mobileConnectionLabel(element) {
        const status =
            String(
                element?.dataset?.status || ""
            ).toLowerCase();

        const text =
            String(
                element?.textContent || ""
            ).toLowerCase();

        if (
            status === "online" ||
            text.includes("synced")
        ) {
            return "Google Sheets • Synced";
        }

        if (
            status === "offline" ||
            text.includes("offline")
        ) {
            return "Offline • Saved locally";
        }

        if (
            status === "error" ||
            text.includes("retry") ||
            text.includes("failed")
        ) {
            return "Sync • Retry";
        }

        if (
            text.includes("waiting") ||
            text.includes("pending")
        ) {
            return "Sync • Pending";
        }

        if (
            text.includes("syncing") ||
            text.includes("connecting")
        ) {
            return "Google Sheets • Syncing";
        }

        return "Google Sheets";
    }

    function updateMobileConnectionLabel() {
        const element =
            byId("connectionText");

        if (!element) return;

        const next =
            mobileConnectionLabel(element);

        if (
            element.dataset.mobileText !==
            next
        ) {
            element.dataset.mobileText =
                next;
        }
    }

    function normalizeSyncCard() {
        const card =
            byId("syncConfidenceCard");

        const title =
            byId("syncConfidenceTitle");

        const detail =
            byId("syncConfidenceDetail");

        if (
            !card ||
            !title ||
            !detail
        ) {
            return;
        }

        const state =
            String(
                card.dataset.state ||
                "loading"
            );

        const currentTitle =
            String(
                title.textContent || ""
            ).toLowerCase();

        let nextDetail =
            "Google Sheets";

        if (state === "offline") {
            nextDetail =
                "Saved on device";
        } else if (
            state === "error"
        ) {
            nextDetail =
                "Count is safe";
        } else if (
            currentTitle.includes(
                "pending"
            ) ||
            currentTitle.includes(
                "saved locally"
            )
        ) {
            nextDetail =
                "Saved on device";
        } else if (
            currentTitle.includes(
                "syncing"
            )
        ) {
            nextDetail =
                "Google Sheets";
        }

        if (
            detail.textContent !==
            nextDetail
        ) {
            detail.textContent =
                nextDetail;
        }
    }

    function observeStatus() {
        const connection =
            byId("connectionText");

        const syncCard =
            byId("syncConfidenceCard");

        if (connection) {
            const observer =
                new MutationObserver(
                    updateMobileConnectionLabel
                );

            observer.observe(
                connection,
                {
                    attributes: true,
                    attributeFilter: [
                        "data-status"
                    ],
                    childList: true,
                    characterData: true,
                    subtree: true,
                }
            );
        }

        if (syncCard) {
            const observer =
                new MutationObserver(
                    normalizeSyncCard
                );

            observer.observe(
                syncCard,
                {
                    attributes: true,
                    attributeFilter: [
                        "data-state"
                    ],
                    childList: true,
                    characterData: true,
                    subtree: true,
                }
            );
        }
    }

    function initialize() {
        installStyles();
        updateMobileConnectionLabel();
        normalizeSyncCard();
        observeStatus();

        let attempts = 0;

        const timer =
            window.setInterval(
                () => {
                    attempts += 1;
                    updateMobileConnectionLabel();
                    normalizeSyncCard();

                    if (
                        byId(
                            "syncConfidenceCard"
                        ) ||
                        attempts >= 12
                    ) {
                        window.clearInterval(
                            timer
                        );

                        observeStatus();
                    }
                },
                250
            );
    }

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            {
                once: true,
            }
        );
    } else {
        initialize();
    }
})();

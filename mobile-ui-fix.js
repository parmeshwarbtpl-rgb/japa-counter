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
                        19px,
                        5.2vw,
                        22px
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
                    text-overflow: clip !important;
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
                    font-size: 11px !important;
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
            return "Counter • Synced";
        }

        if (
            status === "offline" ||
            text.includes("offline")
        ) {
            return "Counter • Offline";
        }

        if (
            status === "error" ||
            text.includes("retry") ||
            text.includes("failed")
        ) {
            return "Counter • Retry";
        }

        if (
            text.includes("waiting") ||
            text.includes("pending")
        ) {
            return "Counter • Pending";
        }

        if (
            text.includes("syncing") ||
            text.includes("connecting")
        ) {
            return "Counter • Syncing";
        }

        return "Counter • Ready";
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

    function updateCompactBrand() {
        const title =
            document.querySelector(
                "#appRoot .header-brand h1"
            );

        if (title) {
            title.textContent =
                "Naam Jaap";

            title.setAttribute(
                "aria-label",
                "Naam Jaap Counter"
            );

            title.title =
                "Naam Jaap Counter";
        }
    }

    function initialize() {
        installStyles();
        updateCompactBrand();
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


// Phase 4.1 — Today Summary and clear device-sync status.
// Dashboard presentation only. Header, auth, jaap counting and backend remain unchanged.
(() => {
    "use strict";

    if (window.__naamJaapTodaySummaryV41) return;
    window.__naamJaapTodaySummaryV41 = true;

    const REFRESH_DELAY_MS = 90;
    let refreshTimer = null;
    let syncRefreshSerial = 0;

    function byId(id) {
        return document.getElementById(id);
    }

    function numberFromText(value) {
        const parsed = Number(
            String(value || "0")
                .replace(/,/g, "")
                .replace(/[^0-9.-]/g, "")
        );

        return Number.isFinite(parsed)
            ? Math.max(0, parsed)
            : 0;
    }

    function formatNumber(value) {
        return Math.max(0, Number(value || 0))
            .toLocaleString("en-IN");
    }

    function installSummaryStyles() {
        if (byId("todaySummaryStylesV41")) return;

        const style = document.createElement("style");
        style.id = "todaySummaryStylesV41";
        style.textContent = `
            /* Replaced visually by the unified Today Summary card. */
            #dashboardConfidenceGrid {
                display: none !important;
            }

            .today-summary-card {
                position: relative;
                overflow: hidden;
                margin-bottom: 16px;
                border: 1px solid rgba(255, 111, 0, .18);
                border-radius: 22px;
                padding: 17px;
                background: linear-gradient(145deg, #fffaf5, #ffffff 72%);
                box-shadow: 0 9px 26px rgba(87, 55, 28, .07);
            }

            .today-summary-card::before {
                content: "";
                position: absolute;
                inset: 0 0 auto;
                height: 4px;
                background: linear-gradient(90deg, #ff6f00, #ffb000);
            }

            .today-summary-heading {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 12px;
                margin-bottom: 13px;
            }

            .today-summary-heading p,
            .today-summary-heading h3 {
                margin: 0;
            }

            .today-summary-heading h3 {
                margin-top: 3px;
                color: #272b31;
                font-size: 1.12rem;
            }

            .today-summary-mantra {
                max-width: 48%;
                overflow: hidden;
                border-radius: 999px;
                padding: 6px 9px;
                background: #fff0e2;
                color: #bf5100;
                font-size: .68rem;
                font-weight: 800;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .today-summary-grid {
                display: grid;
                grid-template-columns: repeat(4, minmax(0, 1fr));
                gap: 9px;
            }

            .today-summary-metric {
                min-width: 0;
                border: 1px solid #eceff2;
                border-radius: 15px;
                padding: 11px 9px;
                background: rgba(255, 255, 255, .9);
                text-align: center;
            }

            .today-summary-metric span,
            .today-summary-metric strong,
            .today-summary-metric small {
                display: block;
            }

            .today-summary-metric span {
                font-size: 1.18rem;
                line-height: 1;
            }

            .today-summary-metric strong {
                margin-top: 6px;
                overflow: hidden;
                color: #252930;
                font-size: 1.03rem;
                line-height: 1.18;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .today-summary-metric small {
                margin-top: 3px;
                color: #777c84;
                font-size: .67rem;
                font-weight: 700;
                line-height: 1.25;
            }

            .today-summary-sync {
                display: grid;
                grid-template-columns: 40px minmax(0, 1fr) auto;
                align-items: center;
                gap: 10px;
                margin-top: 11px;
                border: 1px solid #dce4e0;
                border-radius: 15px;
                padding: 10px 11px;
                background: #f7fbf9;
            }

            .today-summary-sync-icon {
                display: grid;
                width: 40px;
                height: 40px;
                place-items: center;
                border-radius: 13px;
                background: #e8f8f1;
                font-size: 19px;
            }

            .today-summary-sync-copy {
                min-width: 0;
            }

            .today-summary-sync-copy strong,
            .today-summary-sync-copy small {
                display: block;
            }

            .today-summary-sync-copy strong {
                overflow: hidden;
                color: #147a52;
                font-size: .87rem;
                line-height: 1.25;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .today-summary-sync-copy small {
                overflow: hidden;
                margin-top: 3px;
                color: #65716b;
                font-size: .69rem;
                line-height: 1.3;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .today-summary-sync-badge {
                border-radius: 999px;
                padding: 5px 8px;
                background: #e8f8f1;
                color: #147a52;
                font-size: .63rem;
                font-weight: 900;
                white-space: nowrap;
            }

            .today-summary-sync[data-state="pending"] {
                border-color: #f1d19f;
                background: #fff9ef;
            }

            .today-summary-sync[data-state="pending"] .today-summary-sync-icon,
            .today-summary-sync[data-state="pending"] .today-summary-sync-badge {
                background: #fff0d8;
            }

            .today-summary-sync[data-state="pending"] .today-summary-sync-copy strong,
            .today-summary-sync[data-state="pending"] .today-summary-sync-badge {
                color: #9a5c00;
            }

            .today-summary-sync[data-state="local"],
            .today-summary-sync[data-state="offline"] {
                border-color: #efc9c1;
                background: #fff7f5;
            }

            .today-summary-sync[data-state="local"] .today-summary-sync-icon,
            .today-summary-sync[data-state="local"] .today-summary-sync-badge,
            .today-summary-sync[data-state="offline"] .today-summary-sync-icon,
            .today-summary-sync[data-state="offline"] .today-summary-sync-badge {
                background: #ffebe7;
            }

            .today-summary-sync[data-state="local"] .today-summary-sync-copy strong,
            .today-summary-sync[data-state="local"] .today-summary-sync-badge,
            .today-summary-sync[data-state="offline"] .today-summary-sync-copy strong,
            .today-summary-sync[data-state="offline"] .today-summary-sync-badge {
                color: #a34234;
            }

            .today-summary-sync[data-state="checking"] .today-summary-sync-icon,
            .today-summary-sync[data-state="checking"] .today-summary-sync-badge {
                background: #f0f1f3;
                color: #626871;
            }

            @media (max-width: 520px) {
                .today-summary-card {
                    padding: 15px 13px;
                    border-radius: 19px;
                }

                .today-summary-grid {
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 8px;
                }

                .today-summary-heading {
                    align-items: center;
                }

                .today-summary-mantra {
                    max-width: 46%;
                }

                .today-summary-sync {
                    grid-template-columns: 36px minmax(0, 1fr) auto;
                    gap: 8px;
                    padding: 9px;
                }

                .today-summary-sync-icon {
                    width: 36px;
                    height: 36px;
                    border-radius: 11px;
                    font-size: 17px;
                }

                .today-summary-sync-copy strong {
                    font-size: .8rem;
                }

                .today-summary-sync-copy small {
                    font-size: .64rem;
                }

                .today-summary-sync-badge {
                    padding: 4px 6px;
                    font-size: .57rem;
                }
            }

            @media (max-width: 350px) {
                .today-summary-mantra {
                    display: none;
                }

                .today-summary-sync {
                    grid-template-columns: 34px minmax(0, 1fr);
                }

                .today-summary-sync-badge {
                    display: none;
                }
            }
        `;

        document.head.appendChild(style);
    }

    function createSummaryCard() {
        if (byId("todaySummaryCard")) return byId("todaySummaryCard");

        const dashboard = byId("dashboardView");
        const clockCard = dashboard?.querySelector(".clock-card");
        const counterCard = dashboard?.querySelector(".counter-card");

        if (!dashboard || (!clockCard && !counterCard)) return null;

        const card = document.createElement("section");
        card.id = "todaySummaryCard";
        card.className = "today-summary-card";
        card.setAttribute("aria-labelledby", "todaySummaryTitle");

        card.innerHTML = `
            <div class="today-summary-heading">
                <div>
                    <p class="eyebrow">Daily Overview</p>
                    <h3 id="todaySummaryTitle">Today Summary</h3>
                </div>
                <span id="todaySummaryMantra" class="today-summary-mantra">Selected mantra</span>
            </div>

            <div class="today-summary-grid">
                <div class="today-summary-metric">
                    <span aria-hidden="true">ॐ</span>
                    <strong id="todaySummaryJaap">0</strong>
                    <small>Today Jaap</small>
                </div>

                <div class="today-summary-metric">
                    <span aria-hidden="true">📿</span>
                    <strong id="todaySummaryMalas">0</strong>
                    <small>Malas Complete</small>
                </div>

                <div class="today-summary-metric">
                    <span aria-hidden="true">🎯</span>
                    <strong id="todaySummaryGoal">0%</strong>
                    <small>Daily Goal</small>
                </div>

                <div class="today-summary-metric">
                    <span aria-hidden="true">🔥</span>
                    <strong id="todaySummaryStreak">0 days</strong>
                    <small>Current Streak</small>
                </div>
            </div>

            <div id="todaySummarySync" class="today-summary-sync" data-state="checking">
                <span id="todaySummarySyncIcon" class="today-summary-sync-icon" aria-hidden="true">↻</span>
                <span class="today-summary-sync-copy">
                    <strong id="todaySummarySyncTitle">Checking sync…</strong>
                    <small id="todaySummarySyncDetail">Reading device queue</small>
                </span>
                <span id="todaySummarySyncBadge" class="today-summary-sync-badge">Checking</span>
            </div>
        `;

        if (clockCard) {
            clockCard.insertAdjacentElement("afterend", card);
        } else {
            dashboard.insertBefore(card, counterCard);
        }

        return card;
    }

    function safeDashboardState() {
        try {
            if (
                typeof dashboardState !== "undefined" &&
                dashboardState
            ) {
                return dashboardState;
            }
        } catch (_error) {}

        return {};
    }

    function readCurrentStreak() {
        const existing = byId("streakConfidenceTitle")?.textContent?.trim();
        if (existing) return existing;

        try {
            const dates = JSON.parse(
                localStorage.getItem(
                    "naam-jaap-streak-activity-dates-v1"
                ) || "[]"
            );

            if (!Array.isArray(dates) || !dates.length) return "0 days";

            const keys = new Set(dates.map(String));
            const keyFor = date => {
                const y = date.getFullYear();
                const m = String(date.getMonth() + 1).padStart(2, "0");
                const d = String(date.getDate()).padStart(2, "0");
                return `${y}-${m}-${d}`;
            };

            let cursor = new Date();
            if (!keys.has(keyFor(cursor))) {
                cursor.setDate(cursor.getDate() - 1);
            }

            let count = 0;
            while (keys.has(keyFor(cursor))) {
                count += 1;
                cursor.setDate(cursor.getDate() - 1);
            }

            return `${formatNumber(count)} ${count === 1 ? "day" : "days"}`;
        } catch (_error) {
            return "0 days";
        }
    }

    function updateSummaryMetrics() {
        if (!createSummaryCard()) return;

        const state = safeDashboardState();
        const today = numberFromText(
            byId("today")?.textContent ?? state.today ?? 0
        );
        const malaSize = Math.max(1, Number(state.malaSize || 108));
        const malas = numberFromText(
            byId("todayMalas")?.textContent ?? Math.floor(today / malaSize)
        );

        let goal = String(byId("targetPercent")?.textContent || "").trim();
        if (!goal) {
            const goalMalas = Math.max(1, Number(state.goalMalas || 1));
            const target = goalMalas * malaSize;
            goal = `${Math.min(100, Math.round((today / target) * 100))}%`;
        }

        const mantra = String(
            byId("mantra")?.textContent || state.mantra || "Selected mantra"
        ).trim();

        byId("todaySummaryJaap").textContent = formatNumber(today);
        byId("todaySummaryMalas").textContent = formatNumber(malas);
        byId("todaySummaryGoal").textContent = goal;
        byId("todaySummaryStreak").textContent = readCurrentStreak();
        byId("todaySummaryMantra").textContent = mantra || "Selected mantra";
        byId("todaySummaryMantra").title = mantra || "Selected mantra";
    }

    function currentUserIdSafe() {
        try {
            if (typeof currentUserId === "function") {
                return String(currentUserId() || "");
            }
        } catch (_error) {}

        try {
            if (typeof authState !== "undefined") {
                return String(authState?.user?.id || "");
            }
        } catch (_error) {}

        return "";
    }

    function isAuthenticatedSafe() {
        try {
            return (
                typeof isAuthenticated === "function" &&
                Boolean(isAuthenticated())
            );
        } catch (_error) {
            return false;
        }
    }

    function hasTrustedUser() {
        try {
            return (
                typeof authState !== "undefined" &&
                Boolean(authState?.user)
            );
        } catch (_error) {
            return false;
        }
    }

    function setSyncSummary({
        state,
        icon,
        title,
        detail,
        badge,
    }) {
        const root = byId("todaySummarySync");
        if (!root) return;

        root.dataset.state = state;
        byId("todaySummarySyncIcon").textContent = icon;
        byId("todaySummarySyncTitle").textContent = title;
        byId("todaySummarySyncDetail").textContent = detail;
        byId("todaySummarySyncBadge").textContent = badge;
    }

    async function readPendingSummary() {
        const userId = currentUserIdSafe();

        if (
            !userId ||
            typeof offlineGetPendingSummary !== "function"
        ) {
            return null;
        }

        try {
            return await offlineGetPendingSummary(userId);
        } catch (error) {
            console.warn("Pending sync summary unavailable:", error);
            return null;
        }
    }

    async function updateSummarySync() {
        if (!createSummaryCard()) return;

        const serial = ++syncRefreshSerial;
        const pending = await readPendingSummary();

        if (serial !== syncRefreshSerial) return;

        const operations = Math.max(0, Number(pending?.operations || 0));
        const pendingCount = Math.max(0, Number(pending?.count || 0));

        if (operations > 0) {
            const entryWord = operations === 1 ? "entry" : "entries";
            const detail = pendingCount > 0
                ? `${formatNumber(pendingCount)} jaap safe on this device`
                : `${formatNumber(operations)} changes safe on this device`;

            setSyncSummary({
                state: "pending",
                icon: "⏳",
                title: `${formatNumber(operations)} pending ${entryWord}`,
                detail,
                badge: "Pending",
            });
            return;
        }

        const connection = byId("connectionText");
        const status = String(connection?.dataset?.status || "").toLowerCase();
        const connectionText = String(connection?.textContent || "").toLowerCase();

        if (!navigator.onLine || status === "offline") {
            setSyncSummary({
                state: "offline",
                icon: "📱",
                title: "Saved on device",
                detail: "Offline · sync resumes when online",
                badge: "Offline",
            });
            return;
        }

        if (
            status === "error" ||
            connectionText.includes("failed") ||
            connectionText.includes("retry")
        ) {
            setSyncSummary({
                state: "local",
                icon: "🛡️",
                title: "Saved on device",
                detail: "Count is safe · reconnect to sync",
                badge: "Safe",
            });
            return;
        }

        if (
            status === "loading" ||
            connectionText.includes("syncing") ||
            connectionText.includes("connecting") ||
            connectionText.includes("pending")
        ) {
            setSyncSummary({
                state: "checking",
                icon: "↻",
                title: "Syncing…",
                detail: "Checking Google Sheets",
                badge: "Working",
            });
            return;
        }

        if (isAuthenticatedSafe()) {
            setSyncSummary({
                state: "synced",
                icon: "✓",
                title: "All synced",
                detail: "Google Sheets is up to date",
                badge: "Synced",
            });
            return;
        }

        if (hasTrustedUser()) {
            setSyncSummary({
                state: "local",
                icon: "📱",
                title: "Saved on device",
                detail: "Reconnect only when cloud sync is needed",
                badge: "Local",
            });
            return;
        }

        setSyncSummary({
            state: "local",
            icon: "📱",
            title: "Local mode",
            detail: "Sign in to enable Google Sheets sync",
            badge: "Device",
        });
    }

    function refreshSummary() {
        updateSummaryMetrics();
        updateSummarySync();
    }

    function scheduleRefresh(delay = REFRESH_DELAY_MS) {
        window.clearTimeout(refreshTimer);
        refreshTimer = window.setTimeout(refreshSummary, delay);
    }

    function observeElements() {
        const ids = [
            "today",
            "todayMalas",
            "targetPercent",
            "streakConfidenceTitle",
            "mantra",
            "connectionText",
            "syncConfidenceCard",
        ];

        const observer = new MutationObserver(() => scheduleRefresh());

        ids.forEach(id => {
            const element = byId(id);
            if (!element) return;

            observer.observe(element, {
                attributes: true,
                childList: true,
                characterData: true,
                subtree: true,
            });
        });

        byId("tapBtn")?.addEventListener("click", () => {
            scheduleRefresh(60);
            window.setTimeout(refreshSummary, 850);
        });

        window.addEventListener("online", refreshSummary);
        window.addEventListener("offline", refreshSummary);
        window.addEventListener("focus", refreshSummary);

        document.addEventListener("visibilitychange", () => {
            if (!document.hidden) refreshSummary();
        });
    }

    function initializeTodaySummary() {
        installSummaryStyles();

        let attempts = 0;
        const timer = window.setInterval(() => {
            attempts += 1;

            if (createSummaryCard()) {
                window.clearInterval(timer);
                observeElements();
                refreshSummary();
                window.setInterval(updateSummarySync, 5000);
                return;
            }

            if (attempts >= 20) {
                window.clearInterval(timer);
            }
        }, 150);
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeTodaySummary,
            { once: true }
        );
    } else {
        initializeTodaySummary();
    }
})();

// Naam Jaap Counter v2.9.13 — Dashboard Polish & Sync Confidence.

(() => {
    const ACTIVITY_DATES_KEY =
        "naam-jaap-streak-activity-dates-v1";

    let celebrationTimer = null;
    let streakRefreshPromise = null;

    function byId(id) {
        return document.getElementById(id);
    }

    function localDateKey(date = new Date()) {
        const year = date.getFullYear();
        const month = String(
            date.getMonth() + 1
        ).padStart(2, "0");
        const day = String(
            date.getDate()
        ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    function shiftDateKey(key, deltaDays) {
        const match = String(key || "").match(
            /^(\d{4})-(\d{2})-(\d{2})$/
        );

        if (!match) return "";

        const date = new Date(
            Number(match[1]),
            Number(match[2]) - 1,
            Number(match[3])
        );

        date.setDate(
            date.getDate() +
            Number(deltaDays || 0)
        );

        return localDateKey(date);
    }

    function parseHistoryDate(value) {
        const text =
            String(value || "").trim();

        if (!text) return "";

        let match = text.match(
            /^(\d{4})-(\d{1,2})-(\d{1,2})$/
        );

        if (match) {
            return [
                match[1],
                String(match[2]).padStart(2, "0"),
                String(match[3]).padStart(2, "0"),
            ].join("-");
        }

        match = text.match(
            /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/
        );

        if (match) {
            return [
                match[3],
                String(match[2]).padStart(2, "0"),
                String(match[1]).padStart(2, "0"),
            ].join("-");
        }

        const parsed =
            new Date(text);

        if (
            !Number.isNaN(
                parsed.getTime()
            )
        ) {
            return localDateKey(
                parsed
            );
        }

        return "";
    }

    function readActivityDates() {
        try {
            const value = JSON.parse(
                localStorage.getItem(
                    ACTIVITY_DATES_KEY
                ) || "[]"
            );

            if (!Array.isArray(value)) {
                return [];
            }

            return [
                ...new Set(
                    value
                        .map(String)
                        .filter(date =>
                            /^\d{4}-\d{2}-\d{2}$/.test(
                                date
                            )
                        )
                )
            ].sort();
        } catch (_error) {
            return [];
        }
    }

    function saveActivityDates(dates) {
        try {
            const unique = [
                ...new Set(
                    Array.from(
                        dates || []
                    )
                )
            ]
                .filter(date =>
                    /^\d{4}-\d{2}-\d{2}$/.test(
                        date
                    )
                )
                .sort()
                .slice(-400);

            localStorage.setItem(
                ACTIVITY_DATES_KEY,
                JSON.stringify(unique)
            );
        } catch (_error) {
            // Streak remains an optional UI enhancement.
        }
    }

    function addActivityDate(key) {
        if (
            !/^\d{4}-\d{2}-\d{2}$/.test(
                String(key || "")
            )
        ) {
            return;
        }

        const dates =
            new Set(
                readActivityDates()
            );

        dates.add(
            key
        );

        saveActivityDates(
            dates
        );

        renderStreak();
    }

    function calculateStreak(dates) {
        const set =
            dates instanceof Set
                ? dates
                : new Set(
                    dates || []
                );

        const today =
            localDateKey();

        const yesterday =
            shiftDateKey(
                today,
                -1
            );

        let cursor = "";

        if (
            set.has(today)
        ) {
            cursor = today;
        } else if (
            set.has(yesterday)
        ) {
            cursor = yesterday;
        } else {
            return {
                count: 0,
                activeToday: false,
            };
        }

        let count = 0;

        while (
            cursor &&
            set.has(cursor)
        ) {
            count += 1;
            cursor =
                shiftDateKey(
                    cursor,
                    -1
                );
        }

        return {
            count,
            activeToday:
                set.has(today),
        };
    }

    function installStyles() {
        if (
            byId(
                "dashboardPolishStyles"
            )
        ) {
            return;
        }

        const style =
            document.createElement(
                "style"
            );

        style.id =
            "dashboardPolishStyles";

        style.textContent = `
            .confidence-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 12px;
                margin-bottom: 16px;
            }

            .confidence-card {
                display: flex;
                min-width: 0;
                align-items: center;
                gap: 11px;
                padding: 13px 14px;
                border: 1px solid rgba(229, 231, 235, 0.9);
                border-radius: 16px;
                background: #ffffff;
                box-shadow: 0 6px 18px rgba(33, 33, 33, 0.055);
            }

            .confidence-icon {
                display: grid;
                width: 40px;
                height: 40px;
                flex: 0 0 40px;
                place-items: center;
                border-radius: 13px;
                background: #f3f4f6;
                font-size: 20px;
            }

            .confidence-copy {
                min-width: 0;
            }

            .confidence-copy small,
            .confidence-copy strong,
            .confidence-copy span {
                display: block;
            }

            .confidence-copy small {
                color: #7a7f87;
                font-size: 0.69rem;
                font-weight: 800;
                letter-spacing: 0.05em;
                text-transform: uppercase;
            }

            .confidence-copy strong {
                margin-top: 2px;
                overflow: hidden;
                color: #272b31;
                font-size: 0.92rem;
                line-height: 1.25;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .confidence-copy span {
                margin-top: 2px;
                overflow: hidden;
                color: #777c84;
                font-size: 0.72rem;
                line-height: 1.25;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .sync-confidence-card[data-state="online"] .confidence-icon {
                background: #e8f8f1;
            }

            .sync-confidence-card[data-state="online"] .confidence-copy strong {
                color: #147a52;
            }

            .sync-confidence-card[data-state="loading"] .confidence-icon {
                background: #fff4df;
            }

            .sync-confidence-card[data-state="loading"] .confidence-copy strong {
                color: #8a5400;
            }

            .sync-confidence-card[data-state="offline"] .confidence-icon,
            .sync-confidence-card[data-state="error"] .confidence-icon {
                background: #fff0ee;
            }

            .sync-confidence-card[data-state="offline"] .confidence-copy strong,
            .sync-confidence-card[data-state="error"] .confidence-copy strong {
                color: #a33c32;
            }

            .streak-confidence-card[data-active="true"] .confidence-icon {
                background: #fff0e3;
            }

            .streak-confidence-card[data-active="true"] .confidence-copy strong {
                color: #d85d00;
            }

            .goal-card.goal-polished {
                position: relative;
                overflow: hidden;
                border-color: rgba(255, 111, 0, 0.18);
            }

            .goal-card.goal-polished::before {
                content: "";
                position: absolute;
                inset: 0 0 auto;
                height: 4px;
                background: linear-gradient(90deg, #ff6f00, #ffb300);
            }

            .goal-confidence-row {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 10px;
                margin: 13px 0 2px;
            }

            .goal-confidence-pill {
                min-width: 0;
                padding: 10px 11px;
                border-radius: 13px;
                background: #fff8f1;
            }

            .goal-confidence-pill small,
            .goal-confidence-pill strong {
                display: block;
            }

            .goal-confidence-pill small {
                color: #7d746d;
                font-size: 0.7rem;
                font-weight: 700;
            }

            .goal-confidence-pill strong {
                margin-top: 3px;
                color: #c95800;
                font-size: 0.9rem;
                line-height: 1.25;
            }

            .goal-card[data-goal-complete="true"] .goal-confidence-pill {
                background: #e8f8f1;
            }

            .goal-card[data-goal-complete="true"] .goal-confidence-pill strong {
                color: #147a52;
            }

            .mala-celebration {
                position: fixed;
                z-index: 10040;
                inset: 0;
                display: grid;
                place-items: center;
                padding: 24px;
                pointer-events: none;
            }

            .mala-celebration[hidden] {
                display: none !important;
            }

            .mala-celebration-card {
                position: relative;
                width: min(88vw, 340px);
                overflow: hidden;
                padding: 24px 20px;
                border: 1px solid rgba(255, 176, 102, 0.75);
                border-radius: 24px;
                background: rgba(255, 255, 255, 0.97);
                box-shadow: 0 24px 60px rgba(91, 52, 22, 0.24);
                text-align: center;
                animation: mala-celebrate-in 300ms ease-out;
            }

            .mala-celebration-symbol {
                display: grid;
                width: 72px;
                height: 72px;
                margin: 0 auto 12px;
                place-items: center;
                border-radius: 24px;
                background: linear-gradient(135deg, #fff0e3, #fff9f4);
                font-size: 40px;
            }

            .mala-celebration-card h3 {
                margin: 0;
                color: #c95800;
                font-size: 1.35rem;
            }

            .mala-celebration-card p {
                margin: 7px 0 0;
                color: #686d75;
                font-size: 0.9rem;
                line-height: 1.45;
            }

            .mala-spark {
                position: absolute;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #ff8f00;
                animation: mala-spark 850ms ease-out forwards;
            }

            .mala-spark:nth-child(1) { left: 12%; top: 18%; }
            .mala-spark:nth-child(2) { right: 13%; top: 21%; animation-delay: 60ms; }
            .mala-spark:nth-child(3) { left: 22%; bottom: 17%; animation-delay: 110ms; }
            .mala-spark:nth-child(4) { right: 20%; bottom: 19%; animation-delay: 150ms; }

            @keyframes mala-celebrate-in {
                from {
                    opacity: 0;
                    transform: translateY(12px) scale(0.92);
                }

                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }

            @keyframes mala-spark {
                0% {
                    opacity: 0;
                    transform: scale(0.4);
                }

                45% {
                    opacity: 1;
                    transform: scale(1.25);
                }

                100% {
                    opacity: 0;
                    transform: translateY(-16px) scale(0.6);
                }
            }

            @media (max-width: 420px) {
                .confidence-grid,
                .goal-confidence-row {
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                }

                .confidence-card {
                    gap: 8px;
                    padding: 11px 10px;
                }

                .confidence-icon {
                    width: 34px;
                    height: 34px;
                    flex-basis: 34px;
                    border-radius: 11px;
                    font-size: 17px;
                }

                .confidence-copy strong {
                    font-size: 0.82rem;
                }

                .confidence-copy span {
                    font-size: 0.65rem;
                }

                .goal-confidence-pill {
                    padding: 9px;
                }
            }

            @media (prefers-reduced-motion: reduce) {
                .mala-celebration-card,
                .mala-spark {
                    animation: none !important;
                }
            }
        `;

        document.head.appendChild(
            style
        );
    }

    function createConfidencePanel() {
        if (
            byId(
                "dashboardConfidenceGrid"
            )
        ) {
            return;
        }

        const dashboard =
            byId(
                "dashboardView"
            );

        const counterCard =
            dashboard?.querySelector(
                ".counter-card"
            );

        if (
            !dashboard ||
            !counterCard
        ) {
            return;
        }

        const grid =
            document.createElement(
                "section"
            );

        grid.id =
            "dashboardConfidenceGrid";

        grid.className =
            "confidence-grid";

        grid.setAttribute(
            "aria-label",
            "Sync and streak status"
        );

        grid.innerHTML = `
            <article
                id="syncConfidenceCard"
                class="confidence-card sync-confidence-card"
                data-state="loading"
            >
                <span class="confidence-icon" aria-hidden="true">↻</span>
                <span class="confidence-copy">
                    <small>Sync</small>
                    <strong id="syncConfidenceTitle">Checking…</strong>
                    <span id="syncConfidenceDetail">Google Sheets</span>
                </span>
            </article>

            <article
                id="streakConfidenceCard"
                class="confidence-card streak-confidence-card"
                data-active="false"
            >
                <span class="confidence-icon" aria-hidden="true">🔥</span>
                <span class="confidence-copy">
                    <small>Daily Streak</small>
                    <strong id="streakConfidenceTitle">0 days</strong>
                    <span id="streakConfidenceDetail">Start today</span>
                </span>
            </article>
        `;

        dashboard.insertBefore(
            grid,
            counterCard
        );
    }

    function createGoalPolish() {
        const card =
            document.querySelector(
                ".goal-card"
            );

        if (
            !card ||
            byId(
                "goalConfidenceRow"
            )
        ) {
            return;
        }

        card.classList.add(
            "goal-polished"
        );

        const row =
            document.createElement(
                "div"
            );

        row.id =
            "goalConfidenceRow";

        row.className =
            "goal-confidence-row";

        row.innerHTML = `
            <div class="goal-confidence-pill">
                <small>Today</small>
                <strong id="goalPolishToday">0 / 1 Mala</strong>
            </div>

            <div class="goal-confidence-pill">
                <small>Remaining</small>
                <strong id="goalPolishRemaining">108 Jaap</strong>
            </div>
        `;

        const progress =
            card.querySelector(
                ".progress-track"
            );

        if (progress) {
            progress.insertAdjacentElement(
                "beforebegin",
                row
            );
        } else {
            card.appendChild(
                row
            );
        }

        updateGoalPolish();
    }

    function createCelebration() {
        if (
            byId(
                "malaCelebration"
            )
        ) {
            return;
        }

        const celebration =
            document.createElement(
                "div"
            );

        celebration.id =
            "malaCelebration";

        celebration.className =
            "mala-celebration";

        celebration.hidden =
            true;

        celebration.setAttribute(
            "aria-live",
            "polite"
        );

        celebration.innerHTML = `
            <div class="mala-celebration-card">
                <span class="mala-spark"></span>
                <span class="mala-spark"></span>
                <span class="mala-spark"></span>
                <span class="mala-spark"></span>

                <div class="mala-celebration-symbol" aria-hidden="true">🙏</div>
                <h3 id="malaCelebrationTitle">1 Mala Complete</h3>
                <p id="malaCelebrationText">Your selected mantra</p>
            </div>
        `;

        document.body.appendChild(
            celebration
        );
    }

    function updateSyncCard(
        status,
        text
    ) {
        const card =
            byId(
                "syncConfidenceCard"
            );

        const title =
            byId(
                "syncConfidenceTitle"
            );

        const detail =
            byId(
                "syncConfidenceDetail"
            );

        if (
            !card ||
            !title ||
            !detail
        ) {
            return;
        }

        const safeStatus =
            [
                "online",
                "loading",
                "offline",
                "error",
            ].includes(status)
                ? status
                : "loading";

        card.dataset.state =
            safeStatus;

        const lower =
            String(
                text || ""
            ).toLowerCase();

        if (
            safeStatus === "online"
        ) {
            title.textContent =
                "Synced";

            detail.textContent =
                text ||
                "Google Sheets";
        } else if (
            lower.includes(
                "waiting"
            ) ||
            lower.includes(
                "syncing"
            ) ||
            lower.includes(
                "saved"
            )
        ) {
            title.textContent =
                safeStatus === "error"
                    ? "Saved Locally"
                    : "Sync Pending";

            detail.textContent =
                text ||
                "Safe on this device";
        } else if (
            safeStatus === "offline"
        ) {
            title.textContent =
                "Offline Safe";

            detail.textContent =
                text ||
                "Counts stay on device";
        } else if (
            safeStatus === "error"
        ) {
            title.textContent =
                "Sync Retry";

            detail.textContent =
                text ||
                "Count remains safe";
        } else {
            title.textContent =
                "Syncing";

            detail.textContent =
                text ||
                "Please wait";
        }
    }

    function updateSyncFromExistingHeader() {
        const element =
            byId(
                "connectionText"
            );

        if (!element) return;

        updateSyncCard(
            element.dataset.status ||
            (
                navigator.onLine
                    ? "loading"
                    : "offline"
            ),
            element.textContent
        );
    }

    function installSyncHook() {
        if (
            typeof setConnectionStatus !==
            "function"
        ) {
            return;
        }

        if (
            setConnectionStatus
                .__dashboardPolishWrapped
        ) {
            return;
        }

        const original =
            setConnectionStatus;

        const wrapped =
            function polishedConnectionStatus(
                status,
                text
            ) {
                original(
                    status,
                    text
                );

                updateSyncCard(
                    status,
                    text
                );
            };

        wrapped.__dashboardPolishWrapped =
            true;

        setConnectionStatus =
            wrapped;

        updateSyncFromExistingHeader();
    }

    function renderStreak() {
        const data =
            calculateStreak(
                new Set(
                    readActivityDates()
                )
            );

        const card =
            byId(
                "streakConfidenceCard"
            );

        const title =
            byId(
                "streakConfidenceTitle"
            );

        const detail =
            byId(
                "streakConfidenceDetail"
            );

        if (
            !card ||
            !title ||
            !detail
        ) {
            return;
        }

        card.dataset.active =
            data.count > 0
                ? "true"
                : "false";

        title.textContent =
            `${data.count.toLocaleString(
                "en-IN"
            )} ${
                data.count === 1
                    ? "day"
                    : "days"
            }`;

        if (
            data.count === 0
        ) {
            detail.textContent =
                "Start today";
        } else if (
            data.activeToday
        ) {
            detail.textContent =
                "Today's jaap done";
        } else {
            detail.textContent =
                "Continue today";
        }
    }

    async function hydrateStreakFromHistory() {
        if (
            streakRefreshPromise
        ) {
            return streakRefreshPromise;
        }

        streakRefreshPromise =
            (async () => {
                const dates =
                    new Set(
                        readActivityDates()
                    );

                try {
                    if (
                        navigator.onLine &&
                        typeof isAuthenticated ===
                            "function" &&
                        isAuthenticated() &&
                        typeof getHistory ===
                            "function"
                    ) {
                        const payload =
                            await getHistory(
                                365
                            );

                        const entries =
                            typeof normalizeHistoryPayload ===
                                "function"
                                ? normalizeHistoryPayload(
                                    payload
                                )
                                : [];

                        entries.forEach(
                            entry => {
                                if (
                                    String(
                                        entry.action ||
                                        ""
                                    ).toUpperCase() !==
                                    "ADD_COUNT"
                                ) {
                                    return;
                                }

                                if (
                                    Number(
                                        entry.increment ||
                                        0
                                    ) <= 0
                                ) {
                                    return;
                                }

                                const key =
                                    parseHistoryDate(
                                        entry.date
                                    );

                                if (key) {
                                    dates.add(
                                        key
                                    );
                                }
                            }
                        );
                    }
                } catch (error) {
                    console.warn(
                        "Streak history refresh skipped:",
                        error
                    );
                }

                try {
                    if (
                        typeof dashboardState !==
                            "undefined" &&
                        Number(
                            dashboardState.today ||
                            0
                        ) > 0
                    ) {
                        dates.add(
                            localDateKey()
                        );
                    }
                } catch (_error) {
                    // Dashboard state may not be ready yet.
                }

                saveActivityDates(
                    dates
                );

                renderStreak();
            })().finally(
                () => {
                    streakRefreshPromise =
                        null;
                }
            );

        return streakRefreshPromise;
    }

    function bindStreakEvents() {
        byId(
            "tapBtn"
        )?.addEventListener(
            "click",
            () => {
                addActivityDate(
                    localDateKey()
                );
            }
        );

        const today =
            byId(
                "today"
            );

        if (today) {
            const observer =
                new MutationObserver(
                    () => {
                        const value =
                            Number(
                                String(
                                    today.textContent ||
                                    "0"
                                ).replace(
                                    /,/g,
                                    ""
                                )
                            );

                        if (
                            Number.isFinite(
                                value
                            ) &&
                            value > 0
                        ) {
                            addActivityDate(
                                localDateKey()
                            );
                        }

                        updateGoalPolish();
                    }
                );

            observer.observe(
                today,
                {
                    childList: true,
                    characterData: true,
                    subtree: true,
                }
            );
        }

        window.addEventListener(
            "online",
            () => {
                window.setTimeout(
                    hydrateStreakFromHistory,
                    1000
                );
            }
        );
    }

    function updateGoalPolish() {
        const todayText =
            byId(
                "today"
            )?.textContent ||
            "0";

        const todayJaap =
            Math.max(
                0,
                Number(
                    todayText.replace(
                        /,/g,
                        ""
                    )
                ) ||
                0
            );

        let malaSize = 108;
        let goalMalas = 1;

        try {
            malaSize =
                Math.max(
                    1,
                    Number(
                        dashboardState?.malaSize ||
                        108
                    )
                );

            goalMalas =
                Math.max(
                    1,
                    Number.parseInt(
                        dashboardState?.goalMalas,
                        10
                    ) ||
                    1
                );
        } catch (_error) {
            // Use safe defaults until dashboard state is ready.
        }

        const target =
            goalMalas *
            malaSize;

        const completed =
            Math.floor(
                todayJaap /
                malaSize
            );

        const remaining =
            Math.max(
                0,
                target -
                todayJaap
            );

        const todayElement =
            byId(
                "goalPolishToday"
            );

        const remainingElement =
            byId(
                "goalPolishRemaining"
            );

        const card =
            document.querySelector(
                ".goal-card"
            );

        if (todayElement) {
            todayElement.textContent =
                `${Math.min(
                    completed,
                    goalMalas
                ).toLocaleString(
                    "en-IN"
                )} / ${goalMalas.toLocaleString(
                    "en-IN"
                )} ${
                    goalMalas === 1
                        ? "Mala"
                        : "Malas"
                }`;
        }

        if (remainingElement) {
            remainingElement.textContent =
                remaining > 0
                    ? `${remaining.toLocaleString(
                        "en-IN"
                    )} Jaap`
                    : "Goal Complete";
        }

        if (card) {
            card.dataset.goalComplete =
                remaining === 0
                    ? "true"
                    : "false";
        }
    }

    function installGoalHook() {
        if (
            typeof updateTargetProgress !==
            "function"
        ) {
            updateGoalPolish();
            return;
        }

        if (
            updateTargetProgress
                .__dashboardPolishWrapped
        ) {
            return;
        }

        const original =
            updateTargetProgress;

        const wrapped =
            function polishedTargetProgress() {
                const result =
                    original.apply(
                        this,
                        arguments
                    );

                updateGoalPolish();

                return result;
            };

        wrapped.__dashboardPolishWrapped =
            true;

        updateTargetProgress =
            wrapped;

        updateGoalPolish();
    }

    function showCelebration({
        title,
        text,
        symbol = "🙏",
    }) {
        const root =
            byId(
                "malaCelebration"
            );

        if (!root) return;

        const titleElement =
            byId(
                "malaCelebrationTitle"
            );

        const textElement =
            byId(
                "malaCelebrationText"
            );

        const symbolElement =
            root.querySelector(
                ".mala-celebration-symbol"
            );

        if (titleElement) {
            titleElement.textContent =
                title ||
                "1 Mala Complete";
        }

        if (textElement) {
            textElement.textContent =
                text ||
                "Keep going 🙏";
        }

        if (symbolElement) {
            symbolElement.textContent =
                symbol;
        }

        window.clearTimeout(
            celebrationTimer
        );

        root.hidden =
            false;

        const card =
            root.querySelector(
                ".mala-celebration-card"
            );

        if (card) {
            card.style.animation =
                "none";

            void card.offsetWidth;

            card.style.animation =
                "";
        }

        celebrationTimer =
            window.setTimeout(
                () => {
                    root.hidden =
                        true;
                },
                2300
            );
    }

    function installCelebrationHooks() {
        if (
            typeof showMalaCompletion ===
            "function" &&
            !showMalaCompletion
                .__dashboardPolishWrapped
        ) {
            const originalMala =
                showMalaCompletion;

            const wrappedMala =
                function polishedMalaCompletion(
                    completed = 1
                ) {
                    const result =
                        originalMala.apply(
                            this,
                            arguments
                        );

                    const count =
                        Math.max(
                            1,
                            Number(
                                completed ||
                                1
                            )
                        );

                    showCelebration({
                        title:
                            count === 1
                                ? "1 Mala Complete"
                                : `${count} Malas Complete`,
                        text:
                            typeof dashboardState !==
                                "undefined"
                                ? dashboardState.mantra
                                : "Naam Jaap",
                        symbol: "🙏",
                    });

                    return result;
                };

            wrappedMala
                .__dashboardPolishWrapped =
                true;

            showMalaCompletion =
                wrappedMala;
        }

        if (
            typeof showDailyMalaGoalCompletion ===
            "function" &&
            !showDailyMalaGoalCompletion
                .__dashboardPolishWrapped
        ) {
            const originalGoal =
                showDailyMalaGoalCompletion;

            const wrappedGoal =
                function polishedGoalCompletion() {
                    const result =
                        originalGoal.apply(
                            this,
                            arguments
                        );

                    let goal = 1;
                    let mantra =
                        "Naam Jaap";

                    try {
                        goal =
                            Math.max(
                                1,
                                Number.parseInt(
                                    dashboardState?.goalMalas,
                                    10
                                ) ||
                                1
                            );

                        mantra =
                            dashboardState?.mantra ||
                            mantra;
                    } catch (_error) {}

                    showCelebration({
                        title:
                            "Daily Goal Complete",
                        text:
                            `${goal.toLocaleString(
                                "en-IN"
                            )} ${
                                goal === 1
                                    ? "Mala"
                                    : "Malas"
                            } • ${mantra}`,
                        symbol: "🎯",
                    });

                    return result;
                };

            wrappedGoal
                .__dashboardPolishWrapped =
                true;

            showDailyMalaGoalCompletion =
                wrappedGoal;
        }
    }

    function initializeDashboardPolish() {
        installStyles();
        createConfidencePanel();
        createGoalPolish();
        createCelebration();
        installSyncHook();
        installGoalHook();
        installCelebrationHooks();
        bindStreakEvents();

        updateSyncFromExistingHeader();
        renderStreak();
        updateGoalPolish();

        window.setTimeout(
            hydrateStreakFromHistory,
            1600
        );
    }

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initializeDashboardPolish,
            {
                once: true,
            }
        );
    } else {
        initializeDashboardPolish();
    }
})();
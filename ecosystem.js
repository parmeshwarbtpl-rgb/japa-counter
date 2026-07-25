(() => {
    function addStyles() {
        if (document.getElementById("unifiedSafetyStyles")) return;

        const style = document.createElement("style");
        style.id = "unifiedSafetyStyles";
        style.textContent = `
            .unified-safety-card {
                overflow: hidden;
            }

            .unified-safety-heading {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 12px;
                margin-bottom: 12px;
            }

            .unified-safety-heading h3 {
                margin: 0;
            }

            .unified-safety-badge {
                flex: 0 0 auto;
                border: 1px solid #bce8d5;
                border-radius: 999px;
                padding: 6px 9px;
                background: #e8f8f1;
                color: #147a52;
                font-size: 0.72rem;
                font-weight: 800;
                white-space: nowrap;
            }

            .unified-safety-list {
                overflow: hidden;
                border: 1px solid #e1e5ea;
                border-radius: 14px;
                background: #fafbfd;
            }

            .unified-safety-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                padding: 10px 12px;
                border-bottom: 1px solid #e1e5ea;
                font-size: 0.83rem;
            }

            .unified-safety-row:last-child {
                border-bottom: 0;
            }

            .unified-safety-row span {
                color: #6f7379;
            }

            .unified-safety-row strong {
                color: #147a52;
                text-align: right;
            }

            .unified-safety-note {
                margin-top: 12px;
                padding: 11px 12px;
                border: 1px solid #c8d9ee;
                border-radius: 14px;
                background: #f7fbff;
                color: #656b73;
                font-size: 0.82rem;
                line-height: 1.55;
            }

            .unified-safety-note strong {
                color: #20252b;
            }

            .trusted-device-status {
                margin-top: 10px;
                padding: 10px 12px;
                border-radius: 12px;
                background: #fff8ef;
                color: #7b4b18;
                font-size: 0.8rem;
                line-height: 1.5;
            }

            .app-family-note {
                display: block;
                margin-top: 10px;
                color: #737373;
                font-size: 0.78rem;
                line-height: 1.5;
            }

            @media (max-width: 520px) {
                .unified-safety-heading {
                    flex-direction: column;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function buildSafetyCard() {
        if (document.getElementById("unifiedDataSafetyCard")) return;

        const settingsView = document.querySelector(
            '#settingsView, [data-view="settings"]'
        );
        if (!settingsView) return;

        const accountCard = settingsView.querySelector(".account-card");
        if (!accountCard) return;

        const card = document.createElement("section");
        card.id = "unifiedDataSafetyCard";
        card.className = "card unified-safety-card";
        card.innerHTML = `
            <div class="unified-safety-heading">
                <div>
                    <p class="eyebrow">Data Safety</p>
                    <h3>Shared Data Safety Standard</h3>
                </div>
                <span class="unified-safety-badge">Privacy First</span>
            </div>

            <div class="unified-safety-list">
                <div class="unified-safety-row">
                    <span>Google password / client secret</span>
                    <strong>Never stored</strong>
                </div>
                <div class="unified-safety-row">
                    <span>Analytics / advertising SDK</span>
                    <strong>Not used</strong>
                </div>
                <div class="unified-safety-row">
                    <span>User-controlled Sign Out</span>
                    <strong>Available</strong>
                </div>
                <div class="unified-safety-row">
                    <span>Birthday Reminder personal data received</span>
                    <strong>None</strong>
                </div>
            </div>

            <div class="unified-safety-note">
                <strong>Naam Jaap data flow:</strong>
                verified Google account details and jaap activity are synced through
                Google Apps Script to Google Sheets. Offline counts and the trusted
                profile stay on this device until sync. The raw Google password is never
                stored, and the raw browser device ID is not stored in Sheets.
            </div>

            <div id="trustedDeviceStatus" class="trusted-device-status">
                Trusted device access: checking…
            </div>
        `;

        accountCard.parentElement.insertBefore(card, accountCard);
    }

    function standardizeIntegration() {
        const card = document.querySelector(".more-apps-card");
        if (!card) return;

        const eyebrow = card.querySelector(".eyebrow");
        const heading = card.querySelector("h3");
        if (eyebrow) eyebrow.textContent = "Integrated Apps";
        if (heading) heading.textContent = "App Family";

        if (!card.querySelector(".app-family-note")) {
            const note = document.createElement("small");
            note.className = "app-family-note";
            note.textContent =
                "Opening Birthday Reminder only navigates to the other app. Jaap counts, Google account data and Birthday Reminder contacts/profile are not transferred between apps.";
            card.appendChild(note);
        }
    }

    function updateTrustedStatus() {
        const status = document.getElementById("trustedDeviceStatus");
        if (!status) return;

        const hasUser =
            typeof authState !== "undefined" &&
            Boolean(authState.user);

        const live =
            typeof isAuthenticated === "function" &&
            isAuthenticated();

        if (live) {
            status.textContent =
                "Trusted Device: active · Cloud sync is connected. This device can reopen locally for up to 30 days after verification.";
            return;
        }

        if (hasUser) {
            status.textContent =
                "Trusted Device: local mode active · App stays usable without a login gate. Tap Reconnect Sync only when you want cloud sync restored.";
            return;
        }

        status.textContent =
            "Trusted Device: sign in once to verify this device. After verification, the installed app can reopen locally for up to 30 days.";
    }

    function improveLoginCopy() {
        const privacyNote = document.querySelector("#authGate .privacy-note");
        if (
            privacyNote &&
            !privacyNote.textContent.includes("Trusted device")
        ) {
            const extra = document.createElement("div");
            extra.style.marginTop = "8px";
            extra.textContent =
                "Trusted device: after one verified sign-in, this installed app can reopen locally for up to 30 days. A fresh Google sign-in is needed only when cloud sync must be reconnected.";
            privacyNote.appendChild(extra);
        }
    }

    function initializeUnifiedSafety() {
        addStyles();
        buildSafetyCard();
        standardizeIntegration();
        improveLoginCopy();
        updateTrustedStatus();

        window.setInterval(updateTrustedStatus, 3000);
        window.addEventListener("online", updateTrustedStatus);
        window.addEventListener("offline", updateTrustedStatus);

        const reconnect = document.getElementById("reconnectBtn");
        if (reconnect) reconnect.textContent = "Reconnect Sync";
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeUnifiedSafety,
            { once: true }
        );
    } else {
        initializeUnifiedSafety();
    }
})();
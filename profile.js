// Naam Jaap Counter v2.9.12 — manual profile photo crop, face position and zoom.

(() => {
    const PROFILE_KEY = "naam-jaap-local-profile-v1";
    const PROFILE_DB_NAME = "NaamJaapLocalProfile";
    const PROFILE_DB_VERSION = 1;
    const PROFILE_STORE = "profile";
    const PHOTO_KEY = "photo";

    let profilePhotoUrl = "";
    let pendingPhotoFile = null;
    let pendingPhotoImage = null;
    let pendingPhotoObjectUrl = "";

    function byId(id) {
        return document.getElementById(id);
    }

    function readLocalProfile() {
        try {
            const saved = JSON.parse(
                localStorage.getItem(PROFILE_KEY) || "{}"
            );

            return {
                name: String(saved.name || "").trim(),
                status: String(saved.status || "").trim(),
            };
        } catch (_error) {
            return {
                name: "",
                status: "",
            };
        }
    }

    function writeLocalProfile(profile) {
        const safe = {
            name: String(profile?.name || "").trim().slice(0, 60),
            status: String(profile?.status || "").trim().slice(0, 100),
        };

        localStorage.setItem(
            PROFILE_KEY,
            JSON.stringify(safe)
        );

        return safe;
    }

    function openProfileDb() {
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                reject(new Error("IndexedDB is not available."));
                return;
            }

            const request = indexedDB.open(
                PROFILE_DB_NAME,
                PROFILE_DB_VERSION
            );

            request.onupgradeneeded = () => {
                const db = request.result;

                if (
                    !db.objectStoreNames.contains(
                        PROFILE_STORE
                    )
                ) {
                    db.createObjectStore(
                        PROFILE_STORE
                    );
                }
            };

            request.onsuccess = () =>
                resolve(request.result);

            request.onerror = () =>
                reject(
                    request.error ||
                    new Error(
                        "Profile database could not be opened."
                    )
                );
        });
    }

    async function saveProfilePhoto(blob) {
        const db = await openProfileDb();

        await new Promise((resolve, reject) => {
            const tx = db.transaction(
                PROFILE_STORE,
                "readwrite"
            );

            tx.objectStore(
                PROFILE_STORE
            ).put(
                {
                    blob,
                    savedAt: Date.now(),
                },
                PHOTO_KEY
            );

            tx.oncomplete = resolve;
            tx.onerror = () =>
                reject(
                    tx.error ||
                    new Error(
                        "Profile photo could not be saved."
                    )
                );
        });

        db.close();
    }

    async function loadProfilePhoto() {
        try {
            const db = await openProfileDb();

            const record = await new Promise(
                (resolve, reject) => {
                    const tx = db.transaction(
                        PROFILE_STORE,
                        "readonly"
                    );

                    const request =
                        tx.objectStore(
                            PROFILE_STORE
                        ).get(
                            PHOTO_KEY
                        );

                    request.onsuccess = () =>
                        resolve(
                            request.result || null
                        );

                    request.onerror = () =>
                        reject(
                            request.error
                        );
                }
            );

            db.close();

            return (
                record?.blob instanceof Blob
                    ? record.blob
                    : null
            );
        } catch (error) {
            console.warn(
                "Saved profile photo could not be loaded:",
                error
            );

            return null;
        }
    }

    async function clearProfilePhoto() {
        try {
            const db = await openProfileDb();

            await new Promise((resolve, reject) => {
                const tx = db.transaction(
                    PROFILE_STORE,
                    "readwrite"
                );

                tx.objectStore(
                    PROFILE_STORE
                ).delete(
                    PHOTO_KEY
                );

                tx.oncomplete = resolve;
                tx.onerror = () =>
                    reject(
                        tx.error
                    );
            });

            db.close();
        } catch (error) {
            console.warn(
                "Profile photo could not be removed:",
                error
            );
        }
    }

    function clearPhotoObjectUrl() {
        if (profilePhotoUrl) {
            URL.revokeObjectURL(
                profilePhotoUrl
            );

            profilePhotoUrl = "";
        }
    }

    function currentGoogleName() {
        return String(
            authState?.user?.name ||
            authState?.user?.email ||
            "Google User"
        ).trim();
    }

    function effectiveName() {
        const local = readLocalProfile();

        return (
            local.name ||
            currentGoogleName()
        );
    }

    function effectiveStatus() {
        const local = readLocalProfile();

        return (
            local.status ||
            "Naam Jaap • Trusted Device"
        );
    }

    function updateProfileText() {
        const name = effectiveName();
        const status = effectiveStatus();

        document
            .querySelectorAll(
                "[data-user-name]"
            )
            .forEach(element => {
                element.textContent =
                    name;
            });

        document
            .querySelectorAll(
                "[data-local-profile-status]"
            )
            .forEach(element => {
                element.textContent =
                    status;
            });

        const initial =
            name
                .trim()
                .charAt(0)
                .toUpperCase() ||
            "G";

        document
            .querySelectorAll(
                "[data-user-initial]"
            )
            .forEach(element => {
                if (
                    !element.classList.contains(
                        "has-local-profile-photo"
                    )
                ) {
                    element.textContent =
                        initial;
                }
            });

        const nameInput =
            byId("localProfileName");

        const statusInput =
            byId("localProfileStatus");

        if (
            nameInput &&
            document.activeElement !==
                nameInput
        ) {
            nameInput.value =
                readLocalProfile().name;
        }

        if (
            statusInput &&
            document.activeElement !==
                statusInput
        ) {
            statusInput.value =
                readLocalProfile().status;
        }
    }

    function applyPhotoToUi(blob) {
        clearPhotoObjectUrl();

        if (blob) {
            profilePhotoUrl =
                URL.createObjectURL(
                    blob
                );
        }

        document
            .querySelectorAll(
                "[data-user-initial], #localProfilePreview"
            )
            .forEach(element => {
                if (!element) return;

                if (profilePhotoUrl) {
                    element.style.backgroundImage =
                        `url("${profilePhotoUrl}")`;

                    element.classList.add(
                        "has-local-profile-photo"
                    );

                    if (
                        element.hasAttribute(
                            "data-user-initial"
                        )
                    ) {
                        element.textContent =
                            "";
                    }
                } else {
                    element.style.backgroundImage =
                        "";

                    element.classList.remove(
                        "has-local-profile-photo"
                    );
                }
            });

        updateProfileText();
    }

    async function refreshPhotoFromDevice() {
        const blob =
            await loadProfilePhoto();

        applyPhotoToUi(
            blob
        );
    }

    function installProfileStyles() {
        if (
            byId(
                "localProfileStyles"
            )
        ) {
            return;
        }

        const style =
            document.createElement(
                "style"
            );

        style.id =
            "localProfileStyles";

        style.textContent = `
            .local-profile-card {
                overflow: hidden;
            }

            .local-profile-editor {
                display: grid;
                grid-template-columns: 92px minmax(0, 1fr);
                gap: 16px;
                align-items: center;
                margin: 14px 0 18px;
                padding: 14px;
                border: 1px solid #e3e5e8;
                border-radius: 18px;
                background: #fafbfc;
            }

            .local-profile-preview,
            [data-user-initial].has-local-profile-photo {
                background-size: cover;
                background-repeat: no-repeat;
            }

            .local-profile-preview {
                background-position: center;
            }

            .account-initial.has-local-profile-photo,
            .account-avatar.has-local-profile-photo {
                background-position: center;
                image-rendering: auto;
                -webkit-font-smoothing: antialiased;
            }

            .local-profile-preview {
                display: grid;
                width: 88px;
                height: 88px;
                place-items: center;
                overflow: hidden;
                border: 3px solid #ffffff;
                border-radius: 50%;
                background-color: #fff4e8;
                color: #d85d00;
                box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
                font-size: 32px;
                font-weight: 800;
            }

            .local-profile-photo-actions {
                display: grid;
                gap: 9px;
            }

            .local-profile-upload {
                display: flex;
                min-height: 44px;
                align-items: center;
                justify-content: center;
                border: 1px solid #ffd2ad;
                border-radius: 12px;
                padding: 0 14px;
                background: #fff4e8;
                color: #a94c00;
                font-weight: 800;
                cursor: pointer;
            }

            .photo-adjust-panel {
                grid-column: 1 / -1;
                width: 100%;
                padding: 14px;
                border: 1px solid #ffd2ad;
                border-radius: 16px;
                background: #fffaf5;
            }

            .photo-adjust-panel[hidden] {
                display: none !important;
            }

            .photo-adjust-title {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
                margin-bottom: 10px;
            }

            .photo-adjust-title strong {
                color: #33383f;
                font-size: 0.9rem;
            }

            .photo-adjust-title small {
                color: #d85d00;
                font-size: 0.72rem;
                font-weight: 800;
            }

            .photo-adjust-field {
                margin-top: 12px;
            }

            .photo-adjust-field label {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
                margin-bottom: 7px;
                color: #555a61;
                font-size: 0.8rem;
                font-weight: 800;
            }

            .photo-adjust-field output {
                color: #d85d00;
                font-size: 0.76rem;
                font-weight: 800;
            }

            .photo-adjust-field input[type="range"] {
                width: 100%;
                min-height: 32px;
                margin: 0;
                padding: 0;
                accent-color: #ff6f00;
            }

            .photo-adjust-actions {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 9px;
                margin-top: 14px;
            }

            .photo-adjust-help {
                margin-top: 10px;
                color: #73777e;
                font-size: 0.76rem;
                line-height: 1.45;
            }

            .local-profile-fields {
                display: grid;
                gap: 13px;
            }

            .local-profile-field label {
                display: block;
                margin-bottom: 6px;
                color: #555a61;
                font-size: 0.84rem;
                font-weight: 800;
            }

            .local-profile-field input {
                width: 100%;
                box-sizing: border-box;
            }

            .local-profile-help {
                margin-top: 10px;
                color: #73777e;
                font-size: 0.8rem;
                line-height: 1.5;
            }

            .account-profile [data-local-profile-status] {
                margin: 3px 0 0;
                color: #73777e;
                font-size: 0.82rem;
            }

            .account-chip {
                display: flex;
                align-items: center;
                gap: 9px;
                max-width: min(280px, 48vw);
            }

            .account-chip-copy {
                display: flex;
                min-width: 0;
                flex-direction: column;
                align-items: flex-start;
                text-align: left;
            }

            .account-chip-name {
                display: block;
                max-width: 180px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                font-weight: 800;
                line-height: 1.15;
            }

            .account-chip-status {
                display: block;
                max-width: 180px;
                margin-top: 2px;
                overflow: hidden;
                color: #787d84;
                font-size: 0.69rem;
                line-height: 1.15;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .account-local-status {
                margin: 3px 0 5px;
                color: #d85d00;
                font-size: 0.84rem;
                font-weight: 700;
                line-height: 1.35;
            }

            .account-profile h3 {
                margin-bottom: 0;
            }

            .account-initial.has-local-profile-photo,
            .account-avatar.has-local-profile-photo {
                color: transparent;
                overflow: hidden;
                border: 2px solid rgba(255, 255, 255, 0.94);
                box-shadow: 0 3px 10px rgba(0, 0, 0, 0.16);
            }

            .account-initial.has-local-profile-photo {
                width: 48px;
                height: 48px;
                flex: 0 0 48px;
                border-radius: 50%;
            }

            .account-avatar.has-local-profile-photo {
                width: 68px;
                height: 68px;
                flex: 0 0 68px;
                border-radius: 50%;
                background-color: #fff4e8;
            }

            .account-chip:has(.account-initial.has-local-profile-photo) {
                min-height: 60px;
                padding: 5px 12px 5px 5px;
            }

            @media (max-width: 520px) {
                .local-profile-editor {
                    grid-template-columns: 1fr;
                    justify-items: center;
                }

                .local-profile-photo-actions {
                    width: 100%;
                }

                .account-chip {
                    max-width: 52vw;
                    gap: 7px;
                }

                .account-initial.has-local-profile-photo {
                    width: 44px;
                    height: 44px;
                    flex-basis: 44px;
                }

                .account-chip-name,
                .account-chip-status {
                    max-width: 124px;
                }

                .account-chip-status {
                    font-size: 0.62rem;
                }

                .photo-adjust-actions {
                    grid-template-columns: 1fr;
                }
            }
        `;

        document.head.appendChild(
            style
        );
    }

    function createProfileCard() {
        if (
            byId(
                "localProfileCard"
            )
        ) {
            return;
        }

        const settingsView =
            document.querySelector(
                '#settingsView, [data-view="settings"]'
            );

        const accountCard =
            settingsView?.querySelector(
                ".account-card"
            );

        if (
            !settingsView ||
            !accountCard
        ) {
            return;
        }

        const card =
            document.createElement(
                "section"
            );

        card.id =
            "localProfileCard";

        card.className =
            "card local-profile-card";

        card.innerHTML = `
            <p class="eyebrow">Profile</p>
            <h3>Profile Settings</h3>
            <p class="field-help">
                Profile photo, display name and status are saved only on this device.
            </p>

            <div class="local-profile-editor">
                <div
                    id="localProfilePreview"
                    class="local-profile-preview"
                    aria-label="Profile photo preview"
                >
                    ${effectiveName().charAt(0).toUpperCase() || "G"}
                </div>

                <div class="local-profile-photo-actions">
                    <label class="local-profile-upload">
                        🖼 Choose Photo
                        <input
                            id="localProfilePhotoInput"
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            hidden
                        >
                    </label>

                    <button
                        id="removeLocalProfilePhotoBtn"
                        class="secondary-btn"
                        type="button"
                    >
                        Remove Photo
                    </button>

                    <small class="field-help">
                        Stored only on this device · max source file 10 MB
                    </small>
                </div>

                <div
                    id="photoAdjustPanel"
                    class="photo-adjust-panel"
                    hidden
                >
                    <div class="photo-adjust-title">
                        <strong>Adjust Profile Photo</strong>
                        <small>Preview before saving</small>
                    </div>

                    <div class="photo-adjust-field">
                        <label for="profilePhotoPosition">
                            <span>Face Position</span>
                            <output id="profilePhotoPositionValue">18%</output>
                        </label>
                        <input
                            id="profilePhotoPosition"
                            type="range"
                            min="0"
                            max="100"
                            step="1"
                            value="18"
                        >
                    </div>

                    <div class="photo-adjust-field">
                        <label for="profilePhotoZoom">
                            <span>Zoom</span>
                            <output id="profilePhotoZoomValue">115%</output>
                        </label>
                        <input
                            id="profilePhotoZoom"
                            type="range"
                            min="100"
                            max="240"
                            step="5"
                            value="115"
                        >
                    </div>

                    <div class="photo-adjust-actions">
                        <button
                            id="applyAdjustedPhotoBtn"
                            class="primary-btn"
                            type="button"
                        >
                            Apply Photo
                        </button>

                        <button
                            id="cancelAdjustedPhotoBtn"
                            class="secondary-btn"
                            type="button"
                        >
                            Cancel
                        </button>
                    </div>

                    <p class="photo-adjust-help">
                        Move Face Position until the full face is centred in the circle.
                        Use Zoom only if the face is still too small.
                    </p>
                </div>
            </div>

            <form id="localProfileForm" class="local-profile-fields">
                <div class="local-profile-field">
                    <label for="localProfileName">Display Name</label>
                    <input
                        id="localProfileName"
                        type="text"
                        maxlength="60"
                        autocomplete="off"
                        placeholder="e.g. Parmeshwar"
                    >
                </div>

                <div class="local-profile-field">
                    <label for="localProfileStatus">Status</label>
                    <input
                        id="localProfileStatus"
                        type="text"
                        maxlength="100"
                        autocomplete="off"
                        placeholder="e.g. हरि नाम ही जीवन है 🙏"
                    >
                </div>

                <button
                    class="primary-btn full-width"
                    type="submit"
                >
                    Save Profile & Status
                </button>
            </form>

            <p class="local-profile-help">
                This changes only how your profile appears on this device.
                Your verified Google email/account identity and cloud ownership are not changed.
            </p>
        `;

        accountCard.parentElement.insertBefore(
            card,
            accountCard
        );

        if (
            !accountCard.querySelector(
                "[data-local-profile-status]"
            )
        ) {
            const email =
                accountCard.querySelector(
                    "[data-user-email]"
                );

            const status =
                document.createElement(
                    "p"
                );

            status.setAttribute(
                "data-local-profile-status",
                ""
            );

            if (email?.parentElement) {
                email.insertAdjacentElement(
                    "afterend",
                    status
                );
            }
        }

        bindProfileEvents();
        updateProfileText();
    }

    function bindProfileEvents() {
        byId(
            "localProfileForm"
        )?.addEventListener(
            "submit",
            event => {
                event.preventDefault();

                const saved =
                    writeLocalProfile({
                        name:
                            byId(
                                "localProfileName"
                            )?.value ||
                            "",
                        status:
                            byId(
                                "localProfileStatus"
                            )?.value ||
                            "",
                    });

                updateProfileText();

                if (
                    typeof showToast ===
                    "function"
                ) {
                    showToast(
                        "Profile and status saved on this device.",
                        "success"
                    );
                }
            }
        );

        byId(
            "localProfilePhotoInput"
        )?.addEventListener(
            "change",
            handlePhotoSelection
        );

        byId(
            "profilePhotoPosition"
        )?.addEventListener(
            "input",
            handlePhotoAdjustInput
        );

        byId(
            "profilePhotoZoom"
        )?.addEventListener(
            "input",
            handlePhotoAdjustInput
        );

        byId(
            "applyAdjustedPhotoBtn"
        )?.addEventListener(
            "click",
            applyAdjustedPhoto
        );

        byId(
            "cancelAdjustedPhotoBtn"
        )?.addEventListener(
            "click",
            cancelPhotoAdjustment
        );

        byId(
            "removeLocalProfilePhotoBtn"
        )?.addEventListener(
            "click",
            async () => {
                clearPendingPhoto();
                await clearProfilePhoto();
                applyPhotoToUi(null);

                const input =
                    byId(
                        "localProfilePhotoInput"
                    );

                if (input) {
                    input.value =
                        "";
                }

                if (
                    typeof showToast ===
                    "function"
                ) {
                    showToast(
                        "Profile photo removed from this device.",
                        "success"
                    );
                }
            }
        );
    }

    async function handlePhotoSelection(event) {
        const file =
            event.target.files?.[0];

        if (!file) return;

        if (
            !/^image\/(png|jpeg|webp)$/i.test(
                file.type
            )
        ) {
            event.target.value = "";

            showProfileError(
                "Choose a PNG, JPG or WebP image."
            );

            return;
        }

        if (
            file.size >
            10 * 1024 * 1024
        ) {
            event.target.value = "";

            showProfileError(
                "Choose a photo smaller than 10 MB."
            );

            return;
        }

        try {
            clearPendingPhoto();

            pendingPhotoFile = file;
            pendingPhotoObjectUrl =
                URL.createObjectURL(file);

            pendingPhotoImage =
                await loadImageElement(
                    pendingPhotoObjectUrl
                );

            const position =
                byId("profilePhotoPosition");

            const zoom =
                byId("profilePhotoZoom");

            if (position) {
                position.value = "18";
            }

            if (zoom) {
                zoom.value = "115";
            }

            byId(
                "photoAdjustPanel"
            ).hidden = false;

            renderPendingPhotoPreview();

            if (
                typeof showToast ===
                "function"
            ) {
                showToast(
                    "Adjust the face position and zoom, then tap Apply Photo.",
                    "info"
                );
            }
        } catch (error) {
            console.error(
                "Profile photo preview failed:",
                error
            );

            clearPendingPhoto();

            showProfileError(
                "Profile photo could not be opened."
            );
        } finally {
            event.target.value = "";
        }
    }

    function handlePhotoAdjustInput() {
        updatePhotoAdjustOutputs();
        renderPendingPhotoPreview();
    }

    function updatePhotoAdjustOutputs() {
        const position =
            Number(
                byId(
                    "profilePhotoPosition"
                )?.value ||
                18
            );

        const zoom =
            Number(
                byId(
                    "profilePhotoZoom"
                )?.value ||
                115
            );

        const positionOutput =
            byId(
                "profilePhotoPositionValue"
            );

        const zoomOutput =
            byId(
                "profilePhotoZoomValue"
            );

        if (positionOutput) {
            positionOutput.textContent =
                `${position}%`;
        }

        if (zoomOutput) {
            zoomOutput.textContent =
                `${zoom}%`;
        }
    }

    function drawAdjustedPhoto(
        image,
        canvas,
        positionPercent,
        zoomPercent
    ) {
        const context =
            canvas.getContext(
                "2d",
                {
                    alpha: false,
                }
            );

        const size =
            canvas.width;

        const sourceWidth =
            image.naturalWidth ||
            image.width;

        const sourceHeight =
            image.naturalHeight ||
            image.height;

        const baseScale =
            Math.max(
                size / sourceWidth,
                size / sourceHeight
            );

        const zoomFactor =
            Math.max(
                1,
                Number(
                    zoomPercent ||
                    100
                ) / 100
            );

        const scale =
            baseScale *
            zoomFactor;

        const drawWidth =
            sourceWidth *
            scale;

        const drawHeight =
            sourceHeight *
            scale;

        const overflowX =
            Math.max(
                0,
                drawWidth -
                size
            );

        const overflowY =
            Math.max(
                0,
                drawHeight -
                size
            );

        const x =
            -overflowX /
            2;

        const position =
            Math.max(
                0,
                Math.min(
                    100,
                    Number(
                        positionPercent ||
                        0
                    )
                )
            ) / 100;

        const y =
            -overflowY *
            position;

        context.imageSmoothingEnabled =
            true;

        context.imageSmoothingQuality =
            "high";

        context.fillStyle =
            "#ffffff";

        context.fillRect(
            0,
            0,
            size,
            size
        );

        context.drawImage(
            image,
            x,
            y,
            drawWidth,
            drawHeight
        );
    }

    function renderPendingPhotoPreview() {
        if (!pendingPhotoImage) return;

        updatePhotoAdjustOutputs();

        const position =
            Number(
                byId(
                    "profilePhotoPosition"
                )?.value ||
                18
            );

        const zoom =
            Number(
                byId(
                    "profilePhotoZoom"
                )?.value ||
                115
            );

        const canvas =
            document.createElement(
                "canvas"
            );

        canvas.width = 320;
        canvas.height = 320;

        drawAdjustedPhoto(
            pendingPhotoImage,
            canvas,
            position,
            zoom
        );

        const preview =
            byId(
                "localProfilePreview"
            );

        if (!preview) return;

        preview.style.backgroundImage =
            `url("${canvas.toDataURL(
                "image/jpeg",
                0.9
            )}")`;

        preview.style.backgroundPosition =
            "center";

        preview.style.backgroundSize =
            "cover";

        preview.classList.add(
            "has-local-profile-photo"
        );

        preview.textContent = "";
    }

    async function applyAdjustedPhoto() {
        if (
            !pendingPhotoImage ||
            !pendingPhotoFile
        ) {
            showProfileError(
                "Choose a photo first."
            );

            return;
        }

        const button =
            byId(
                "applyAdjustedPhotoBtn"
            );

        if (button) {
            button.disabled = true;
            button.textContent =
                "Applying…";
        }

        try {
            const position =
                Number(
                    byId(
                        "profilePhotoPosition"
                    )?.value ||
                    18
                );

            const zoom =
                Number(
                    byId(
                        "profilePhotoZoom"
                    )?.value ||
                    115
                );

            const optimized =
                await createAdjustedProfilePhoto(
                    pendingPhotoImage,
                    position,
                    zoom
                );

            await saveProfilePhoto(
                optimized
            );

            applyPhotoToUi(
                optimized
            );

            clearPendingPhoto();

            if (
                typeof showToast ===
                "function"
            ) {
                showToast(
                    "Profile photo saved with your crop.",
                    "success"
                );
            }
        } catch (error) {
            console.error(
                "Adjusted profile photo save failed:",
                error
            );

            showProfileError(
                "Adjusted profile photo could not be saved."
            );
        } finally {
            if (button) {
                button.disabled = false;
                button.textContent =
                    "Apply Photo";
            }
        }
    }

    function cancelPhotoAdjustment() {
        clearPendingPhoto();

        refreshPhotoFromDevice()
            .catch(
                () => undefined
            );

        if (
            typeof showToast ===
            "function"
        ) {
            showToast(
                "Photo adjustment cancelled.",
                "info"
            );
        }
    }

    function clearPendingPhoto() {
        pendingPhotoFile = null;
        pendingPhotoImage = null;

        if (pendingPhotoObjectUrl) {
            URL.revokeObjectURL(
                pendingPhotoObjectUrl
            );

            pendingPhotoObjectUrl = "";
        }

        const panel =
            byId(
                "photoAdjustPanel"
            );

        if (panel) {
            panel.hidden = true;
        }
    }

    async function createAdjustedProfilePhoto(
        image,
        position,
        zoom
    ) {
        const size = 768;

        const canvas =
            document.createElement(
                "canvas"
            );

        canvas.width = size;
        canvas.height = size;

        drawAdjustedPhoto(
            image,
            canvas,
            position,
            zoom
        );

        const webp =
            await canvasToBlob(
                canvas,
                "image/webp",
                0.94
            );

        if (webp) {
            return webp;
        }

        const jpeg =
            await canvasToBlob(
                canvas,
                "image/jpeg",
                0.94
            );

        if (!jpeg) {
            throw new Error(
                "Image crop could not be created."
            );
        }

        return jpeg;
    }

    function showProfileError(message) {
        if (
            typeof showToast ===
            "function"
        ) {
            showToast(
                message,
                "error"
            );
        }
    }

    function loadImageElement(url) {
        return new Promise(
            (resolve, reject) => {
                const image =
                    new Image();

                image.onload =
                    () => resolve(
                        image
                    );

                image.onerror =
                    () => reject(
                        new Error(
                            "Image could not be opened."
                        )
                    );

                image.src =
                    url;
            }
        );
    }

    function canvasToBlob(canvas, type, quality) {
        return new Promise(resolve => {
            canvas.toBlob(
                resolve,
                type,
                quality
            );
        });
    }

    const originalRenderAccountProfile =
        typeof renderAccountProfile ===
        "function"
            ? renderAccountProfile
            : null;

    if (originalRenderAccountProfile) {
        renderAccountProfile =
            function localProfileAwareRenderAccountProfile(
                user,
                deviceKey = ""
            ) {
                originalRenderAccountProfile(
                    user,
                    deviceKey
                );

                updateProfileText();

                if (profilePhotoUrl) {
                    document
                        .querySelectorAll(
                            "[data-user-initial]"
                        )
                        .forEach(element => {
                            element.style.backgroundImage =
                                `url("${profilePhotoUrl}")`;

                            element.classList.add(
                                "has-local-profile-photo"
                            );

                            element.textContent =
                                "";
                        });
                }
            };
    }

    async function initializeLocalProfile() {
        installProfileStyles();
        createProfileCard();
        updateProfileText();
        await refreshPhotoFromDevice();

        window.addEventListener(
            "focus",
            updateProfileText
        );
    }

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initializeLocalProfile,
            { once: true }
        );
    } else {
        initializeLocalProfile();
    }
})();
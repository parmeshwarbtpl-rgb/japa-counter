// Naam Jaap Counter v2.9.11 — clearer profile photo, larger avatars and face-focused crop.

(() => {
    const PROFILE_KEY = "naam-jaap-local-profile-v1";
    const PROFILE_DB_NAME = "NaamJaapLocalProfile";
    const PROFILE_DB_VERSION = 1;
    const PROFILE_STORE = "profile";
    const PHOTO_KEY = "photo";

    let profilePhotoUrl = "";

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
                background-position: center 30%;
            }

            .account-initial.has-local-profile-photo,
            .account-avatar.has-local-profile-photo {
                background-position: center 28%;
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
                        Stored only on this device · face-focused crop · max source file 10 MB
                    </small>
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
            "removeLocalProfilePhotoBtn"
        )?.addEventListener(
            "click",
            async () => {
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
            event.target.value =
                "";

            showProfileError(
                "Choose a PNG, JPG or WebP image."
            );

            return;
        }

        if (
            file.size >
            10 * 1024 * 1024
        ) {
            event.target.value =
                "";

            showProfileError(
                "Choose a photo smaller than 10 MB."
            );

            return;
        }

        try {
            const optimized =
                await optimizeProfilePhoto(
                    file
                );

            await saveProfilePhoto(
                optimized
            );

            applyPhotoToUi(
                optimized
            );

            event.target.value =
                "";

            if (
                typeof showToast ===
                "function"
            ) {
                showToast(
                    "Profile photo saved on this device.",
                    "success"
                );
            }
        } catch (error) {
            console.error(
                "Profile photo update failed:",
                error
            );

            showProfileError(
                "Profile photo could not be processed."
            );
        }
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

    async function optimizeProfilePhoto(file) {
        const sourceUrl =
            URL.createObjectURL(
                file
            );

        try {
            const image =
                await loadImageElement(
                    sourceUrl
                );

            const sourceWidth =
                image.naturalWidth ||
                image.width;

            const sourceHeight =
                image.naturalHeight ||
                image.height;

            const side =
                Math.min(
                    sourceWidth,
                    sourceHeight
                );

            // Portrait photos usually place the face in the upper half.
            // Bias the square crop upward so the face remains prominent
            // instead of centering too much torso/body inside the avatar.
            const horizontalOverflow =
                Math.max(
                    0,
                    sourceWidth -
                    side
                );

            const verticalOverflow =
                Math.max(
                    0,
                    sourceHeight -
                    side
                );

            const sx =
                Math.floor(
                    horizontalOverflow /
                    2
                );

            const sy =
                sourceHeight >
                sourceWidth
                    ? Math.floor(
                        verticalOverflow *
                        0.18
                    )
                    : Math.floor(
                        verticalOverflow /
                        2
                    );

            const size =
                768;

            const canvas =
                document.createElement(
                    "canvas"
                );

            canvas.width =
                size;

            canvas.height =
                size;

            const context =
                canvas.getContext(
                    "2d",
                    {
                        alpha: false,
                    }
                );

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
                sx,
                sy,
                side,
                side,
                0,
                0,
                size,
                size
            );

            const webp =
                await canvasToBlob(
                    canvas,
                    "image/webp",
                    0.92
                );

            if (webp) {
                return webp;
            }

            const jpeg =
                await canvasToBlob(
                    canvas,
                    "image/jpeg",
                    0.92
                );

            if (!jpeg) {
                throw new Error(
                    "Image optimization failed."
                );
            }

            return jpeg;
        } finally {
            URL.revokeObjectURL(
                sourceUrl
            );
        }
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
// Background temple music module v2.9.1
// The audio starts only after a user gesture because modern browsers block autoplay with sound.

(() => {
    "use strict";

    const STORAGE_KEY = "naam-jaap-counter-background-music-v1";
    const DEFAULT_STATE = Object.freeze({
        enabled: false,
        volume: 20,
    });

    const audio = document.getElementById("templeBackgroundAudio");
    const enabledInput = document.getElementById("backgroundMusicEnabled");
    const volumeInput = document.getElementById("backgroundMusicVolume");
    const volumeText = document.getElementById("backgroundMusicVolumeText");
    const playPauseButton = document.getElementById("backgroundMusicPlayPause");
    const statusText = document.getElementById("backgroundMusicStatus");
    const floatingButton = document.getElementById("backgroundMusicFloatingButton");
    const floatingIcon = document.getElementById("backgroundMusicFloatingIcon");
    const appRoot = document.getElementById("appRoot");

    if (!audio || !enabledInput || !volumeInput || !playPauseButton || !floatingButton) {
        console.warn("Background music controls are not available.");
        return;
    }

    let state = readState();
    let pausedForHiddenPage = false;
    let lastDucked = false;

    audio.loop = true;
    audio.preload = "none";

    function clampVolume(value) {
        const number = Number.parseInt(value, 10);
        if (!Number.isFinite(number)) return DEFAULT_STATE.volume;
        return Math.min(100, Math.max(0, number));
    }

    function readState() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
            return {
                enabled: Boolean(saved.enabled),
                volume: clampVolume(saved.volume ?? DEFAULT_STATE.volume),
            };
        } catch (_error) {
            return { ...DEFAULT_STATE };
        }
    }

    function saveState() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function appIsVisible() {
        return Boolean(appRoot && !appRoot.hidden && document.visibilityState !== "hidden");
    }

    function baseVolume() {
        return state.volume / 100;
    }

    function applyVolume() {
        const speaking = Boolean(window.speechSynthesis?.speaking);
        const target = speaking ? baseVolume() * 0.22 : baseVolume();
        audio.volume = Math.min(1, Math.max(0, target));
        lastDucked = speaking;
    }

    function setStatus(message, type = "info") {
        if (!statusText) return;
        statusText.textContent = message;
        statusText.dataset.type = type;
    }

    function updateUI() {
        const playing = !audio.paused && !audio.ended;

        enabledInput.checked = state.enabled;
        volumeInput.value = String(state.volume);
        if (volumeText) volumeText.textContent = `${state.volume}%`;

        playPauseButton.textContent = playing ? "⏸ Pause Music" : "▶ Start Music";
        floatingIcon.textContent = playing ? "🔊" : "🔇";
        floatingButton.setAttribute("aria-pressed", String(playing));
        floatingButton.setAttribute(
            "aria-label",
            playing ? "Pause background temple music" : "Start background temple music"
        );
        floatingButton.classList.toggle("is-playing", playing);
    }

    async function startMusic({ quiet = false } = {}) {
        state.enabled = true;
        saveState();
        applyVolume();

        if (!appIsVisible()) {
            updateUI();
            return false;
        }

        try {
            await audio.play();
            setStatus("Temple music is playing softly.", "success");
            updateUI();
            return true;
        } catch (error) {
            console.info("Music needs a user gesture before playback:", error);
            if (!quiet) {
                setStatus("Tap Start Music once to allow audio in this browser.", "info");
            }
            updateUI();
            return false;
        }
    }

    function pauseMusic({ disable = false, message = "Music is paused." } = {}) {
        audio.pause();
        if (disable) {
            state.enabled = false;
            saveState();
        }
        setStatus(message, "info");
        updateUI();
    }

    async function toggleMusic() {
        if (!audio.paused) {
            pauseMusic({ disable: true, message: "Music is off." });
            return;
        }
        await startMusic();
    }

    enabledInput.addEventListener("change", async () => {
        if (enabledInput.checked) {
            await startMusic();
        } else {
            pauseMusic({ disable: true, message: "Music is off." });
        }
    });

    volumeInput.addEventListener("input", () => {
        state.volume = clampVolume(volumeInput.value);
        saveState();
        applyVolume();
        updateUI();
    });

    playPauseButton.addEventListener("click", toggleMusic);
    floatingButton.addEventListener("click", toggleMusic);

    audio.addEventListener("play", updateUI);
    audio.addEventListener("pause", updateUI);
    audio.addEventListener("error", () => {
        setStatus("Music file could not be loaded. Check temple-music.mp3 in GitHub.", "error");
        updateUI();
    });

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
            pausedForHiddenPage = state.enabled && !audio.paused;
            if (pausedForHiddenPage) audio.pause();
            return;
        }

        if (pausedForHiddenPage && state.enabled) {
            pausedForHiddenPage = false;
            startMusic({ quiet: true });
        }
    });

    // Keep background audio softer while browser text-to-speech speaks the mantra.
    window.setInterval(() => {
        const speaking = Boolean(window.speechSynthesis?.speaking);
        if (speaking !== lastDucked && !audio.paused) applyVolume();
    }, 150);

    // A saved ON setting resumes after the first user gesture once the signed-in app is visible.
    const resumeAfterGesture = () => {
        if (!state.enabled || !audio.paused || !appIsVisible()) return;
        startMusic({ quiet: true });
    };
    document.addEventListener("pointerdown", resumeAfterGesture, { passive: true });
    document.addEventListener("keydown", resumeAfterGesture);

    applyVolume();
    updateUI();
    setStatus(
        state.enabled
            ? "Music is enabled. Tap the music button once if your browser has paused it."
            : "Music is off. Tap Start Music to begin.",
        "info"
    );
})();

// Local settings module

const SETTINGS_KEY = "naam-jaap-counter-settings-v2";

const DEFAULT_SETTINGS = Object.freeze({
    voiceEnabled: true,
    autoSpeakEnabled: true,
    selectedVoiceURI: "",
    dailyTarget: 108,
});

function readSettings() {
    try {
        const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
        return sanitizeSettings({ ...DEFAULT_SETTINGS, ...saved });
    } catch (_error) {
        return { ...DEFAULT_SETTINGS };
    }
}

function saveSettings(nextSettings) {
    const clean = sanitizeSettings(nextSettings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(clean));
    return clean;
}

function sanitizeSettings(settings) {
    const target = Number.parseInt(settings.dailyTarget, 10);

    return {
        voiceEnabled: Boolean(settings.voiceEnabled),
        autoSpeakEnabled: Boolean(settings.autoSpeakEnabled),
        selectedVoiceURI: String(settings.selectedVoiceURI || ""),
        dailyTarget: Number.isFinite(target) && target > 0
            ? Math.min(target, 1000000)
            : DEFAULT_SETTINGS.dailyTarget,
    };
}

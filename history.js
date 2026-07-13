// History normalization and rendering helpers

function normalizeHistoryPayload(payload) {
    let unwrapped = payload;

    for (let depth = 0; depth < 3; depth += 1) {
        if (Array.isArray(unwrapped)) break;
        if (!unwrapped || typeof unwrapped !== "object") break;

        const next = unwrapped.history
            ?? unwrapped.rows
            ?? unwrapped.items
            ?? unwrapped.data
            ?? unwrapped.result;

        if (next === undefined || next === unwrapped) break;
        unwrapped = next;
    }

    if (!Array.isArray(unwrapped)) {
        return [];
    }

    return unwrapped
        .map((entry, index) => normalizeHistoryEntry(entry, index))
        .filter(Boolean);
}

function normalizeHistoryEntry(entry, index) {
    if (Array.isArray(entry)) {
        return {
            id: `row-${index}`,
            date: safeText(entry[0]),
            time: safeText(entry[1]),
            mantra: safeText(entry[2]) || "Mantra Jaap",
            count: safeNumber(entry[3]),
            increment: safeNumber(entry[4], 1),
            action: safeText(entry[5]) || "ADD_COUNT",
            deviceKey: safeText(entry[6]),
        };
    }

    if (!entry || typeof entry !== "object") {
        return null;
    }

    const increment = safeNumber(
        entry.increment ?? entry.added ?? entry.num ?? entry.delta ?? entry.change,
        1
    );

    return {
        id: safeText(entry.id ?? entry.row ?? entry.timestamp) || `row-${index}`,
        date: safeText(entry.date ?? entry.Date ?? entry.day),
        time: safeText(entry.time ?? entry.Time),
        mantra: safeText(entry.mantra ?? entry.Mantra ?? entry.name) || "Mantra Jaap",
        count: safeNumber(entry.count ?? entry.Count ?? entry.total ?? entry.today ?? entry.todayCount),
        increment,
        action: safeText(entry.action ?? entry.Action ?? entry.type) || "ADD_COUNT",
        deviceKey: safeText(entry.deviceKey ?? entry.DeviceKey ?? entry.device),
    };
}

function safeText(value) {
    if (value === undefined || value === null) return "";
    return String(value).trim();
}

function safeNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
}

function historySummary(entries) {
    return entries.reduce(
        (summary, item) => {
            summary.entries += 1;
            summary.added += Number.isFinite(item.increment) ? item.increment : 0;
            return summary;
        },
        { entries: 0, added: 0 }
    );
}

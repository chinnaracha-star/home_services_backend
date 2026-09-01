const BANGKOK_OFFSET = "+07:00";

export function normalizeClockTime(serviceTime) {
    const match = String(serviceTime ?? "").trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (!match) return null;

    const hour = Number(match[1]);
    const minute = Number(match[2]);
    const second = Number(match[3] ?? 0);
    if (hour > 23 || minute > 59 || second > 59) return null;

    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;
}

export function toScheduledAt(serviceDate, serviceTime) {
    const date = String(serviceDate ?? "").trim();
    const time = normalizeClockTime(serviceTime);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !time) return null;

    const scheduled = new Date(`${date}T${time}${BANGKOK_OFFSET}`);
    if (Number.isNaN(scheduled.getTime())) return null;
    return scheduled.toISOString();
}

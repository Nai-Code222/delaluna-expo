import * as Localization from "expo-localization";

/**
 * Normalizes timezone strings so all devices return consistent values.
 * - Converts UTC/GMT variations to "UTC"
 * - Trims spacing
 * - Leaves valid IANA names untouched
 */
function normalizeTimezone(tz: string): string {
  const trimmed = tz.trim();

  const upper = trimmed.toUpperCase();
  if (upper === "UTC" || upper === "GMT") {
    return "UTC";
  }

  return trimmed;
}

/**
 * Returns the device's timezone in a safe, normalized format.
 * Handles:
 * - Expo Localization (iOS/Android)
 * - Intl fallback
 * - Error fallback → "UTC"
 */
const getTimezone = (): string => {
  try {
    const calendars = Localization.getCalendars?.() ?? [];
    const tzFromExpo = calendars[0]?.timeZone;

    if (typeof tzFromExpo === "string" && tzFromExpo.length > 0) {
      return normalizeTimezone(tzFromExpo);
    }

    const tzFromIntl = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (typeof tzFromIntl === "string" && tzFromIntl.length > 0) {
      return normalizeTimezone(tzFromIntl);
    }

    // Last-resort fallback
    return "UTC";
  } catch (err) {
    console.warn("getTimezone fallback due to error:", err);
    return "UTC";
  }
};

export default getTimezone;

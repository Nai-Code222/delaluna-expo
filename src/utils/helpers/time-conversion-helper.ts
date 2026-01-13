// src/utils/helpers/getUserLocalDate.ts

import dayjs from "dayjs";
import * as Localization from "expo-localization";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Resolves the user's IANA timezone safely.
 */
export function getUserTimeZone(): string {
  return (
    Localization.getCalendars()?.[0]?.timeZone ??
    Intl.DateTimeFormat().resolvedOptions().timeZone ??
    "UTC"
  );
}

/**
 * Converts a local date-time (in user's timezone) → UTC ISO string.
 * Safe for Swiss Ephemeris.
 */
export function localToUTC(
  date: string | Date,
  timeZone?: string
): string {
  const tz = timeZone ?? getUserTimeZone();
  return dayjs.tz(date, tz).utc().toISOString();
}

/**
 * Converts a UTC date-time → user's local timezone ISO string.
 * Safe for UI display.
 */
export function utcToLocal(
  date: string | Date,
  timeZone?: string
): string {
  const tz = timeZone ?? getUserTimeZone();
  return dayjs.utc(date).tz(tz).toISOString();
}

/**
 * Returns local + UTC day boundaries for tarot / horoscope logic.
 *
 * Local is for user-facing meaning.
 * UTC is for Swiss Ephemeris calculations.
 */
export function getUserLocalDates() {
  const tz = getUserTimeZone();
  const localNow = dayjs().tz(tz);

  const local = {
    yesterday: localNow.subtract(1, "day").format("YYYY-MM-DD"),
    today: localNow.format("YYYY-MM-DD"),
    tomorrow: localNow.add(1, "day").format("YYYY-MM-DD"),
  };

  const utc = {
    yesterday: localToUTC(`${local.yesterday}T12:00:00`, tz),
    today: localToUTC(`${local.today}T12:00:00`, tz),
    tomorrow: localToUTC(`${local.tomorrow}T12:00:00`, tz),
  };

  return {
    timezone: tz,
    local,
    utc,
  };
}
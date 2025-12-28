// src/utils/answers.helpers.ts
import type { AnswerRecord } from "@/types/signup.types";

// Standard default place used when user does not know birth location
export const DEFAULT_PLACE = {
  label: "Greenwich, London, United Kingdom",
  lat: 51.4779,
  lon: 0.0015,
  timezone: "Europe/London",
};


// Detects a wide set of "unknown" text inputs
export const isIDK = (s?: string | null): boolean => {
  if (!s) return false;
  const t = s.trim().toLowerCase();
  return (
    t === "i don't know" ||
    t === "i dont know" ||
    t === "i don’t know" ||
    t === "idk" ||
    t === "unknown" ||
    t === "don't remember" ||
    t === "dont remember"
  );
};

/**
 * Apply unknown place fallback using expected internal keys.
 * Returns a new partial AnswerRecord with canonical fields + flag.
 * 
 * "I don't know" logic: UI displays “I don’t know” but backend receives null or fallback values.
 */
export const applyUnknownPlace = (
  person: Partial<AnswerRecord>
): Partial<AnswerRecord> => ({
  ...person,
  placeOfBirth: DEFAULT_PLACE.label,
  birthLat: DEFAULT_PLACE.lat,
  birthLon: DEFAULT_PLACE.lon,
  birthTimezone: DEFAULT_PLACE.timezone,
  placeOfBirthUnknown: true,
});

/**
 * Apply unknown birth time fallback using internal fields.
 * IDK logic: UI displays “I don’t know” but backend receives null.
 * No Date formatting here; formatting occurs in buildFinalPayload.
 */
export const applyUnknownTime = (
  person: Partial<AnswerRecord>
): Partial<AnswerRecord> => ({
  ...person,
  birthtime: null,
  birthtimeUnknown: true,
});

/**
 * Resolve birth-related fields for the final payload.
 * Uses `*_Unknown` flags to decide when to fall back to DEFAULT_PLACE or null birthtime.
 * 
 * IDK logic: UI displays “I don’t know” but backend receives null.
 * No Date formatting here; formatting occurs in buildFinalPayload.
 */
export const resolveBirthDetails = (a: AnswerRecord) => {
  const birthtime = a.birthtimeUnknown ? null : a.birthtime ?? null;

  const placeOfBirthUnknown = !!a.placeOfBirthUnknown;

  const placeLabel = placeOfBirthUnknown
    ? DEFAULT_PLACE.label
    : a.placeOfBirth || DEFAULT_PLACE.label;

  const birthLat = placeOfBirthUnknown
    ? DEFAULT_PLACE.lat
    : a.birthLat ?? DEFAULT_PLACE.lat;

  const birthLon = placeOfBirthUnknown
    ? DEFAULT_PLACE.lon
    : a.birthLon ?? DEFAULT_PLACE.lon;

  const birthTimezone = placeOfBirthUnknown
    ? DEFAULT_PLACE.timezone
    : a.birthTimezone || DEFAULT_PLACE.timezone;

  return {
    birthtime,
    placeLabel,
    birthLat,
    birthLon,
    birthTimezone,
    isBirthTimeUnknown: !!a.birthtimeUnknown,
    isPlaceOfBirthUnknown: placeOfBirthUnknown,
  };
};

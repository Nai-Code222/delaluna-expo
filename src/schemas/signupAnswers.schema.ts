// src/schemas/signupAnswers.schema.ts
import { z } from "zod";

/**
 * Shared regex validators
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIME_12H_REGEX = /^(\d{1,2}):(\d{2})[ \u202F]?(AM|PM)$/i;
const TIME_24H_REGEX = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
const DATE_MMDDYYYY_REGEX = /^(0[1-9]|1[0-2])\/([0-2][0-9]|3[01])\/\d{4}$/;
const DATE_ISO_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Normalizes strings → trims & converts empty → null
 */
const cleanString = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v));

const normalizeBirthdayToISO = (raw: unknown): string => {
  const v = String(raw ?? "").trim();
  if (DATE_ISO_REGEX.test(v)) return v;

  const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const mm = m[1].padStart(2, "0");
    const dd = m[2].padStart(2, "0");
    const yyyy = m[3];
    return `${yyyy}-${mm}-${dd}`;
  }

  // Let schema validation catch unknown formats
  return v;
};

const normalizeBirthtimeToHHmm = (raw: unknown): string => {
  const v = String(raw ?? "").trim();
  if (!v) return "12:00";

  // 24h (HH:mm or H:mm, optionally with seconds)
  const m24 = v.match(TIME_24H_REGEX);
  if (m24) {
    const hh = String(parseInt(m24[1], 10)).padStart(2, "0");
    const mm = m24[2];
    return `${hh}:${mm}`;
  }

  // 12h (h:mm AM/PM)
  const m12 = v.match(TIME_12H_REGEX);
  if (m12) {
    let hh = parseInt(m12[1], 10);
    const mm = m12[2];
    const ap = m12[3].toLowerCase();
    if (ap === "pm" && hh < 12) hh += 12;
    if (ap === "am" && hh === 12) hh = 0;
    return `${String(hh).padStart(2, "0")}:${mm}`;
  }

  // Unknown format → default (server/client should not choke)
  return "12:00";
};

/**
 * Full schema for FinalSignupPayload from ChatFlow
 * BEFORE sending to the backend finishUserSignup() function.
 * birthday and birthtime are normalized to ISO date and 24h time respectively.
 */
export const FinalSignupPayloadSchema = z.object({
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().min(1, "Last name required"),

  pronouns: cleanString.nullish(),

  email: z
    .string()
    .min(1)
    .regex(EMAIL_REGEX, "Invalid email format"),

  password: z.string().min(8, "Password must be at least 8 characters"),

  themeKey: cleanString.nullish(),

  // Birthdate is stored/sent as ISO (YYYY-MM-DD). Accept MM/DD/YYYY input but normalize.
  birthday: z
    .any()
    .transform((v) => normalizeBirthdayToISO(v))
    .refine((v) => DATE_ISO_REGEX.test(v), "Birthday must be YYYY-MM-DD"),

  /**
   * Birth time is NEVER null.
   * - Known time: normalized to 24h "HH:mm"
   * - Unknown time: defaults to "12:00"
   *
   * Accepts:
   * - "4:15 PM" / "12:07 AM"
   * - "16:15" / "04:15" / "16:15:00"
   */
  birthtime: z
    .any()
    .transform((v) => normalizeBirthtimeToHHmm(v))
    .refine((v) => /^\d{2}:\d{2}$/.test(v), "Birthtime must be HH:mm"),

  birthTimezone: cleanString.nullish(),

  birthLat: z.number().min(-90).max(90),
  birthLon: z.number().min(-180).max(180),

  placeOfBirth: cleanString.nullish(),

  isBirthTimeUnknown: z.boolean(),
  isPlaceOfBirthUnknown: z.boolean(),

  currentTimezone: cleanString.nullish(),
});

/**
 * Helper for safely parsing + returning clean data
 */
export function validateAndCleanSignupPayload(raw: unknown) {
  const parsed = FinalSignupPayloadSchema.safeParse(raw);

  if (!parsed.success) {
    const errors = parsed.error.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    }));

    return {
      ok: false as const,
      errors,
    };
  }

  return {
    ok: true as const,
    data: parsed.data,
  };
}

export type SignupAnswers = z.infer<typeof FinalSignupPayloadSchema>;
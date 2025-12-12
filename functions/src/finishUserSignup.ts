import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { FieldValue } from "firebase-admin/firestore";
import { DateTime } from "luxon";
import { z } from "zod";
import { db } from "./initAdmin";
import { calculateSignsInternal } from "./utils/calcSigns";
import { getDailyTarotCard } from "./utils/tarot";

/**
 * Zod schema for client onboarding payload.
 * Validates inputs before running expensive or critical logic.
 */
const finishUserSignupSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  pronouns: z.string().optional().nullable(),
  email: z.string().email(),

  birthday: z.string().min(1),
  birthtime: z.string().optional().nullable(),

  birthLat: z.coerce.number(),
  birthLon: z.coerce.number(),
  birthTimezone: z.string().optional().nullable(),

  placeOfBirth: z.string().optional().nullable(),

  isBirthTimeUnknown: z.boolean().optional(),
  isPlaceOfBirthUnknown: z.boolean().optional(),

  themeKey: z.string().optional().nullable(),
  currentTimezone: z.string().optional().nullable(),
});

/**
 * Builds a DateTime object from date, time, and timezone.
 */
function buildBirthDateTime(
  birthday: string,
  birthtime: string | null | undefined,
  birthTimezone: string | null | undefined
): DateTime {
  const zone = birthTimezone || "UTC";

  if (birthtime && birthtime.includes("T")) {
    return DateTime.fromISO(birthtime, { zone });
  }

  if (birthtime) {
    return DateTime.fromISO(`${birthday}T${birthtime}`, { zone });
  }

  return DateTime.fromISO(`${birthday}T12:00:00`, { zone });
}

export const finishUserSignup = onCall(async (req) => {
  if (!req.auth) {
    throw new HttpsError("unauthenticated", "User must be signed in.");
  }

  const uid = req.auth.uid;

  // Validate incoming data
  const parsed = finishUserSignupSchema.safeParse(req.data);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");

    logger.warn(`Invalid signup payload for uid=${uid}: ${message}`);
    throw new HttpsError("invalid-argument", message);
  }

  const payload = parsed.data;

  const userRef = db.collection("users").doc(uid);
  await userRef.set(
    {
      signupStatus: "processing",
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  try {
    const authEmail = req.auth.token.email as string | undefined;
    if (authEmail && authEmail.toLowerCase() !== payload.email.toLowerCase()) {
      logger.warn(
        `Email mismatch for uid=${uid}: auth=${authEmail}, payload=${payload.email}`
      );
    }

    const birthDT = buildBirthDateTime(
      payload.birthday,
      payload.birthtime ?? null,
      payload.birthTimezone ?? null
    );

    if (!birthDT.isValid) {
      throw new Error("Invalid birthday or birthtime.");
    }

    const timezoneOffsetHours = birthDT.offset / 60;

    const astroParams = {
      day: birthDT.day,
      month: birthDT.month,
      year: birthDT.year,
      hour: birthDT.hour,
      min: birthDT.minute,
      lat: payload.birthLat,
      lon: payload.birthLon,
      tzone: timezoneOffsetHours,
    };

    // Calculate signs using Swiss ephemeris
    const signs = await calculateSignsInternal(astroParams);

    const sunSign = signs.raw.sun.sign;
    const moonSign = signs.raw.moon.sign;
    const risingSign = signs.raw.ascendant.sign;

    const displayName = `${payload.firstName.trim()} ${payload.lastName.trim()}`
      .replace(/\s+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    const now = FieldValue.serverTimestamp();

    // Final user record
    const updateDoc = {
      id: uid,

      firstName: payload.firstName,
      lastName: payload.lastName,
      displayName,
      pronouns: payload.pronouns ?? null,

      email: payload.email,
      isEmailVerified: req.auth.token.email_verified ?? false,

      birthday: payload.birthday,
      birthtime: payload.birthtime ?? null,
      placeOfBirth: payload.placeOfBirth ?? null,

      birthLat: payload.birthLat,
      birthLon: payload.birthLon,
      birthTimezone: payload.birthTimezone ?? null,

      birthDateTimeUTC: birthDT.toUTC().toISO(),
      tZoneOffset: timezoneOffsetHours,

      isBirthTimeUnknown: payload.isBirthTimeUnknown ?? false,
      isPlaceOfBirthUnknown: payload.isPlaceOfBirthUnknown ?? false,

      sunSign,
      moonSign,
      risingSign,
      astroParams,

      themeKey: payload.themeKey || "default",
      currentTimezone: payload.currentTimezone ?? null,

      signupStatus: "complete",
      updatedAt: now,
      lastLoginDate: now,
    };

    await userRef.set(updateDoc, { merge: true });

    // Generate daily tarot card
    try {
      const tarot = getDailyTarotCard(uid);
      await userRef.collection("tarot").doc("daily").set(tarot, { merge: true });
      logger.info(`Daily tarot card generated for uid=${uid}`);
    } catch (err) {
      logger.warn("Tarot generation failed:", err);
    }

    logger.info(`finishUserSignup completed successfully for uid=${uid}`);

    return {
      user: {
        ...updateDoc,
      },
    };
  } catch (err: any) {
    logger.error(`finishUserSignup failed for uid=${uid}:`, err);

    await userRef.set(
      {
        signupStatus: "error",
        signupError: {
          message: err?.message ?? String(err),
          at: FieldValue.serverTimestamp(),
        },
      },
      { merge: true }
    );

    throw new HttpsError(
      "internal",
      "Signup failed. Please verify your information and try again."
    );
  }
});

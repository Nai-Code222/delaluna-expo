// functions/src/finishUserSignup.ts

import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { FieldValue } from "firebase-admin/firestore";
import { DateTime } from "luxon";
import { z } from "zod";
import { db } from "./initAdmin";
import { calculateSignsInternal } from "./utils/calcSigns";
import type { NatalChartResult } from "./utils/calcSigns";

/**
 * Zod schema for the FLATTENED request payload.
 */
const finishUserSignupSchema = z.object({
  uid: z.string(),
  displayName: z.string(),

  firstName: z.string().min(1),
  lastName: z.string().min(1),
  pronouns: z.string().optional().nullable(),

  email: z.string().email(),
  birthday: z.string(),
  birthtime: z.string().nullable().optional(),

  birthLat: z.coerce.number(),
  birthLon: z.coerce.number(),
  birthTimezone: z.string().nullable().optional(),

  placeOfBirth: z.string().nullable().optional(),

  isBirthTimeUnknown: z.boolean().optional(),
  isPlaceOfBirthUnknown: z.boolean().optional(),

  themeKey: z.string().nullable().optional(),
  currentTimezone: z.string().nullable().optional(),
});

/**
 * Build Luxon birth datetime
 */
function buildBirthDateTime(birthday: string, birthtime: string | null, tz: string | null) {
  const zone = tz || "UTC";

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

  // ---------------------------
  // 1. Validate flattened input
  // ---------------------------
  const parsed = finishUserSignupSchema.safeParse(req.data);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new HttpsError("invalid-argument", message);
  }

  const {
    uid,
    displayName,
    firstName,
    lastName,
    pronouns,
    email,
    birthday,
    birthtime,
    birthLat,
    birthLon,
    birthTimezone,
    placeOfBirth,
    isBirthTimeUnknown,
    isPlaceOfBirthUnknown,
    themeKey,
    currentTimezone,
  } = parsed.data;

  const userRef = db.collection("users").doc(uid);

  await userRef.set(
    {
      signupStatus: "processing",
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  try {
    // ---------------------------
    // 2. Build birth datetime
    // ---------------------------
    const birthDT = buildBirthDateTime(birthday, birthtime ?? null, birthTimezone ?? null);
    if (!birthDT.isValid) throw new Error("Invalid birth date or time");

    const tzOffset = birthDT.offset / 60;

    const astroParams = {
      day: birthDT.day,
      month: birthDT.month,
      year: birthDT.year,
      hour: birthDT.hour,
      min: birthDT.minute,
      lat: birthLat,
      lon: birthLon,
      tzone: tzOffset,
    };

    // ---------------------------
    // 3. Swiss Ephemeris: sun/moon/rising
    // ---------------------------
    const signs: NatalChartResult = await calculateSignsInternal(astroParams);

    const sunSign = signs.planets.sun.sign;
    const moonSign = signs.planets.moon.sign;
    const risingSign = signs.ascendant.sign;

    const now = FieldValue.serverTimestamp();

    // ---------------------------
    // 4. Write user profile
    // ---------------------------
    const updateDoc = {
      id: uid,
      firstName,
      lastName,
      displayName,
      pronouns: pronouns ?? null,
      email,
      isEmailVerified: req.auth.token.email_verified ?? false,

      birthday,
      birthtime: birthtime ?? null,
      placeOfBirth: placeOfBirth ?? null,

      birthLat,
      birthLon,
      birthTimezone: birthTimezone ?? null,

      birthDateTimeUTC: birthDT.toUTC().toISO(),
      tZoneOffset: tzOffset,

      isBirthTimeUnknown: isBirthTimeUnknown ?? false,
      isPlaceOfBirthUnknown: isPlaceOfBirthUnknown ?? false,
      astroParams,
      sunSign,
      moonSign,
      risingSign,
      natalChart: {
        bigThree: {
          sun: sunSign,
          moon: moonSign,
          rising: risingSign,
        },
        planets: signs.planets,
        houses: signs.houses,
        ascendant: signs.ascendant,
        aspects: signs.aspects,
      },

      themeKey: themeKey || "default",
      currentTimezone: currentTimezone ?? null,

      signupStatus: "complete",
      updatedAt: now,
      lastLoginDate: now,
    };

    await userRef.set(updateDoc, { merge: true });

    return { user: updateDoc };

  } catch (err: any) {
    logger.error(`finishUserSignup error for uid=${uid}:`, err);

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

    throw new HttpsError("internal", "Signup failed.");
  }
});
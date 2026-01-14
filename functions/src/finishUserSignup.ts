// functions/src/finishUserSignup.ts

import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { FieldValue } from "firebase-admin/firestore";
import { DateTime } from "luxon";
import { z } from "zod";

import { db } from "./initAdmin";
import { calculateSignsInternal, NatalChartResult } from "./utils/calculateSigns";



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

/**
 * Remove NaN/Infinity values before returning to client
 */
function sanitizeForJSON(obj: any): any {
  return JSON.parse(JSON.stringify(obj, (key, value) => {
    if (typeof value === 'number' && isNaN(value)) {
      logger.warn(`NaN detected in field: ${key}, replacing with 0`);
      return 0;
    }
    if (value === Infinity || value === -Infinity) {
      logger.warn(`Infinity detected in field: ${key}, replacing with 0`);
      return 0;
    }
    return value;
  }));
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

  logger.info("Received signup data:", {
    uid,
    birthday,
    birthtime,
    birthTimezone,
    birthLat,
    birthLon
  });

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
    
    if (!birthDT.isValid) {
      logger.error("Invalid birth datetime:", {
        birthday,
        birthtime,
        birthTimezone,
        reason: birthDT.invalidReason,
        explanation: birthDT.invalidExplanation
      });
      throw new Error(`Invalid birth date or time: ${birthDT.invalidReason}`);
    }

    // ✅ Add safety check for timezone offset
    const rawOffset = birthDT.offset;
    const tzOffset = typeof rawOffset === 'number' && !isNaN(rawOffset) 
      ? rawOffset / 60 
      : 0;

    logger.info("Timezone calculation:", { 
      rawOffset, 
      tzOffset,
      timezone: birthTimezone,
      zone: birthDT.zoneName,
      isValid: birthDT.isValid 
    });

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

      birthday,
      birthtime: birthtime ?? null,
      placeOfBirth: placeOfBirth ?? null,

      birthLat,
      birthLon,
      birthTimezone: birthTimezone ?? null,

      birthDateTimeUTC: birthDT.toUTC().toISO(),
      tZoneOffset: tzOffset,

      isEmailVerified: true,
      isPaidMember: false,
      isBirthTimeUnknown: isBirthTimeUnknown ?? false,
      isPlaceOfBirthUnknown: isPlaceOfBirthUnknown ?? false,

      astroParams,

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

    // ✅ Create response object WITHOUT FieldValue.serverTimestamp()
    // These are Firestore sentinel values that can't be serialized to JSON
    const responseDoc = {
      ...updateDoc,
      updatedAt: new Date().toISOString(),
      lastLoginDate: new Date().toISOString(),
    };

    // ✅ Sanitize before returning to prevent NaN in JSON
    const safeResponse = sanitizeForJSON({ user: responseDoc });
    
    logger.info("✅ Signup completed successfully for uid:", uid);
    
    return safeResponse;

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
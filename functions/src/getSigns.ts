import { onRequest, onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import swe from "@hatijs/core";
import { DateTime } from "luxon";

const db = getFirestore();

interface HousesResult {
  house: number[];
  ascendant?: number;
  asc?: number;
  mc?: number;
  [key: string]: any;
}

const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer",
  "Leo", "Virgo", "Libra", "Scorpio",
  "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

function formatDegree(longitude: number) {
  const signIndex = Math.floor((longitude % 360) / 30);
  const degree = Math.floor(longitude % 30);
  const minute = Math.round((longitude % 1) * 60);
  const sign = ZODIAC_SIGNS[signIndex];
  return `${sign} ${degree}°${minute.toString().padStart(2, "0")}′`;
}

const getZodiacSign = (longitude: number) =>
  ZODIAC_SIGNS[Math.floor((longitude % 360) / 30)];

/** ♈ Swiss Ephemeris core calculation */
async function calculateSigns(data: any) {
  const day   = Number(data.day);
  const month = Number(data.month);
  const year  = Number(data.year);
  const hour  = Number(data.hour);
  const min   = Number(data.min);
  const lat   = Number(data.lat);
  const lon   = Number(data.lon);
  const tzone = Number(data.tzone);

  logger.info("🟣 Request:", { day, month, year, hour, min, lat, lon, tzone });

  const dt = DateTime.fromObject({ year, month, day, hour, minute: min })
    .minus({ hours: tzone });

  const jd = swe.node_swe_julday(
    dt.year,
    dt.month,
    dt.day,
    dt.hour + dt.minute / 60,
    swe.SE_GREG_CAL
  );

  const sun  = swe.node_swe_calc_ut(jd, swe.SE_SUN, swe.SEFLG_SWIEPH) as any;
  const moon = swe.node_swe_calc_ut(jd, swe.SE_MOON, swe.SEFLG_SWIEPH) as any;
  const houses = swe.node_swe_houses_ex2(jd, swe.SEFLG_SWIEPH, lat, lon, "P") as HousesResult;

  const asc = houses.ascendant ?? houses.asc ?? 0;

  const sunSign = getZodiacSign(sun.longitude);
  const moonSign = getZodiacSign(moon.longitude);
  const risingSign = getZodiacSign(asc);

  const sunFormatted = formatDegree(sun.longitude);
  const moonFormatted = formatDegree(moon.longitude);
  const risingFormatted = formatDegree(asc);

  logger.info("☀️ Sun:", sunFormatted);
  logger.info("🌙 Moon:", moonFormatted);
  logger.info("⬆️ Rising:", risingFormatted);

  // 🪶 Debug log (optional)
  await db.collection("debug_sign_logs").add({
    createdAt: FieldValue.serverTimestamp(),
    params: { day, month, year, hour, min, lat, lon, tzone },
    julianDay: jd,
    summary: { sun: sunFormatted, moon: moonFormatted, rising: risingFormatted },
    raw: {
      sun: { longitude: sun.longitude, sign: sunSign },
      moon: { longitude: moon.longitude, sign: moonSign },
      ascendant: { longitude: asc, sign: risingSign },
    },
  });

  return {
    julianDay: jd,
    summary: { sun: sunFormatted, moon: moonFormatted, rising: risingFormatted },
    raw: {
      sun: { longitude: sun.longitude, sign: sunSign },
      moon: { longitude: moon.longitude, sign: moonSign },
      ascendant: { longitude: asc, sign: risingSign },
    },
  };
}

/** 🌐 HTTP endpoint (manual testing / Postman) */
export const getSignsHttp = onRequest(async (req, res) => {
  try {
    const data = req.method === "POST" && req.body ? req.body : req.query;
    const result = await calculateSigns(data);
    res.json({
      message: "Swiss Ephemeris sign calculation successful!",
      ...result,
    });
  } catch (err: any) {
    logger.error("❌ HTTP Error:", err);
    res.status(500).json({ error: err.message });
  }
});

/** 🔮 Callable function (for Expo app) */
export const getSigns = onCall(async (req) => {
  logger.info("📩 Raw callable input:", req.data);

  try {
    const payload = req.data && typeof req.data === "object" ? req.data : {};
    const result = await calculateSigns(payload);

    logger.info("🌟 Calculation successful:", result.summary);

    return {
      sunSign: result.raw.sun.sign,
      moonSign: result.raw.moon.sign,
      risingSign: result.raw.ascendant.sign,
    };
  } catch (err: any) {
    logger.error("❌ Callable Error:", err);
    throw new HttpsError("internal", err.message || "Failed to calculate signs");
  }
});

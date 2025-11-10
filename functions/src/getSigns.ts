import * as functions from "firebase-functions";
import { db, admin } from "./initAdmin";
import swe from "@hatijs/core";
import { DateTime } from "luxon";

interface HousesResult {
  house: number[];
  ascendant?: number;
  asc?: number;
  mc?: number;
  [key: string]: any;
}

const ZODIAC_SIGNS = [
  "Aries","Taurus","Gemini","Cancer",
  "Leo","Virgo","Libra","Scorpio",
  "Sagittarius","Capricorn","Aquarius","Pisces"
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

  console.log("🟣 Request:", { day, month, year, hour, min, lat, lon, tzone });

  const dt = DateTime.fromObject({ year, month, day, hour, minute: min }).minus({ hours: tzone });
  const jd = swe.node_swe_julday(dt.year, dt.month, dt.day, dt.hour + dt.minute / 60, swe.SE_GREG_CAL);

  const sun  = swe.node_swe_calc_ut(jd, swe.SE_SUN,  swe.SEFLG_SWIEPH) as any;
  const moon = swe.node_swe_calc_ut(jd, swe.SE_MOON, swe.SEFLG_SWIEPH) as any;
  const houses = swe.node_swe_houses_ex2(jd, swe.SEFLG_SWIEPH, lat, lon, "P") as HousesResult;

  const asc = houses.ascendant ?? houses.asc ?? 0;

  const sunSign     = getZodiacSign(sun.longitude);
  const moonSign    = getZodiacSign(moon.longitude);
  const risingSign  = getZodiacSign(asc);
  const sunFormatted    = formatDegree(sun.longitude);
  const moonFormatted   = formatDegree(moon.longitude);
  const risingFormatted = formatDegree(asc);

  console.log("☀️ Sun:", sunFormatted);
  console.log("🌙 Moon:", moonFormatted);
  console.log("⬆️ Rising:", risingFormatted);

  // 🪶 optional debug logging
  await db.collection("debug_sign_logs").add({
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
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
    message: "Swiss Ephemeris sign calculation successful!",
    julianDay: jd,
    summary: { sun: sunFormatted, moon: moonFormatted, rising: risingFormatted },
    raw: {
      sun: { longitude: sun.longitude, sign: sunSign },
      moon: { longitude: moon.longitude, sign: moonSign },
      ascendant: { longitude: asc, sign: risingSign },
    },
  };
}

/** 🌐 HTTP endpoint (for Postman / manual testing) */
export const getSignsHttp = functions.https.onRequest(async (req, res) => {
  try {
    const data = req.method === "POST" && req.body ? req.body : req.query;
    const result = await calculateSigns(data);
    res.json(result);
  } catch (err: any) {
    console.error("❌ HTTP Error:", err);
    res.status(500).json({ error: err.message });
  }
});

/** 🔮 Callable function (for Expo app) */
export const getSigns = functions.https.onCall(async (data, context) => {
  console.log("📩 Raw callable input:", JSON.stringify(data, null, 2));

  const payload = data && typeof data === "object" && "data" in data ? (data as any).data : data;
  console.log("✅ Normalized payload:", JSON.stringify(payload, null, 2));

  try {
    const result = await calculateSigns(payload);
    console.log("🌟 Calculation successful:", result.summary);
    const { raw } = result;
    return {
      sunSign: raw.sun.sign,
      moonSign: raw.moon.sign,
      risingSign: raw.ascendant.sign,
    };
  } catch (err: any) {
    console.error("❌ Callable Error:", err);
    throw new functions.https.HttpsError("internal", err.message || "Unknown error");
  }
});

import * as functions from "firebase-functions";
import swe from "@hatijs/core";
import { DateTime } from "luxon";

interface HousesResult {
  house: number[];
  ascendant?: number;
  asc?: number;
  mc?: number;
  [key: string]: any;
}

// Zodiac sign names in order
const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer",
  "Leo", "Virgo", "Libra", "Scorpio",
  "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

// Format longitude into "Sign 00°00′" string
function formatDegree(longitude: number) {
  const signIndex = Math.floor((longitude % 360) / 30);
  const degree = Math.floor(longitude % 30);
  const minute = Math.round((longitude % 1) * 60);
  const sign = ZODIAC_SIGNS[signIndex];
  return `${sign} ${degree}°${minute.toString().padStart(2, "0")}′`;
}

// Helper: convert a degree (0–360) → zodiac sign name
const getZodiacSign = (longitude: number) =>
  ZODIAC_SIGNS[Math.floor((longitude % 360) / 30)];

export const getSignsHttp = functions.https.onRequest(async (req, res) => {
  try {
    const data = req.method === "POST" && req.body ? req.body : req.query;
    const day = Number(data.day) || 9;
    const month = Number(data.month) || 9;
    const year = Number(data.year) || 1988;
    const hour = Number(data.hour) || 16;
    const min = Number(data.min) || 21;
    const lat = Number(data.lat) || 34.9984;
    const lon = Number(data.lon) || -91.9837;
    const tzone = Number(data.tzone) || -5;

    console.log("🟣 Request:", { day, month, year, hour, min, lat, lon, tzone });

    // Convert to UTC and Julian Day
    const dt = DateTime.fromObject({ year, month, day, hour, minute: min }).minus({ hours: tzone });
    const jd = swe.node_swe_julday(dt.year, dt.month, dt.day, dt.hour + dt.minute / 60, swe.SE_GREG_CAL);

    // Calculate planetary positions and houses
    const sun = swe.node_swe_calc_ut(jd, swe.SE_SUN, swe.SEFLG_SWIEPH) as any;
    const moon = swe.node_swe_calc_ut(jd, swe.SE_MOON, swe.SEFLG_SWIEPH) as any;
    const houses = swe.node_swe_houses(jd, lat, lon, 'P') as HousesResult;

    const asc = houses.ascendant ?? houses.asc ?? 0;

    // Get zodiac data
    const sunSign = getZodiacSign(sun.longitude);
    const moonSign = getZodiacSign(moon.longitude);
    const risingSign = getZodiacSign(asc);

    const sunFormatted = formatDegree(sun.longitude);
    const moonFormatted = formatDegree(moon.longitude);
    const risingFormatted = formatDegree(asc);

    console.log("☀️ Sun:", sunFormatted);
    console.log("🌙 Moon:", moonFormatted);
    console.log("⬆️ Asc:", risingFormatted);

    // ✅ Clean response
    res.json({
      message: "Swiss Ephemeris sign calculation successful!",
      julianDay: jd,
      summary: {
        sun: sunFormatted,
        moon: moonFormatted,
        rising: risingFormatted,
      },
      raw: {
        sun: { longitude: sun.longitude, sign: sunSign },
        moon: { longitude: moon.longitude, sign: moonSign },
        ascendant: { longitude: asc, sign: risingSign },
      },
    });

  } catch (err: any) {
    console.error("❌ Calculation error:", err);
    res.status(500).json({ error: err.message });
  }
});

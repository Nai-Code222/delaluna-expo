import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import swe from "@hatijs/core";
import { DateTime } from "luxon";

const db = getFirestore();

// Define required input
interface BirthData {
  day: number;
  month: number;
  year: number;
  hour?: number;
  min?: number;
  lat: number;
  lon: number;
  tzone?: number;
}

/** Validate request data; throw HttpsError if invalid. */
function validateBirthData(data: any): BirthData {
  const required = ["day", "month", "year", "lat", "lon"];
  for (const key of required) {
    if (data[key] === undefined || data[key] === null || data[key] === "") {
      throw new HttpsError("invalid-argument", `Missing required field: ${key}`);
    }
  }
  return {
    day: Number(data.day),
    month: Number(data.month),
    year: Number(data.year),
    hour: data.hour !== undefined ? Number(data.hour) : 12,
    min: data.min !== undefined ? Number(data.min) : 0,
    lat: Number(data.lat),
    lon: Number(data.lon),
    tzone: data.tzone !== undefined ? Number(data.tzone) : 0,
  };
}

/** Format degrees into a sign + degrees + minutes string. */
const ZODIAC = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
function formatDegree(longitude: number): string {
  const signIndex = Math.floor((longitude % 360) / 30);
  const degrees = Math.floor(longitude % 30);
  const minutes = Math.round((longitude % 1) * 60);
  return `${ZODIAC[signIndex]} ${degrees}°${minutes.toString().padStart(2, "0")}′`;
}

async function calculateSignsCore(data: BirthData) {
  const dt = DateTime.fromObject({
    year: data.year,
    month: data.month,
    day: data.day,
    hour: data.hour,
    minute: data.min,
  }).minus({ hours: data.tzone || 0 });

  const jd = swe.node_swe_julday(
    dt.year, dt.month, dt.day,
    dt.hour + dt.minute / 60, swe.SE_GREG_CAL
  );
  const sun = swe.node_swe_calc_ut(jd, swe.SE_SUN, swe.SEFLG_SWIEPH) as any;
  const moon = swe.node_swe_calc_ut(jd, swe.SE_MOON, swe.SEFLG_SWIEPH) as any;
  const houses = swe.node_swe_houses_ex2(
    jd, swe.SEFLG_SWIEPH, data.lat, data.lon, "P"
  ) as any;

  const asc = houses.ascendant ?? houses.asc ?? 0;

  return {
    julianDay: jd,
    raw: {
      sun: { longitude: sun.longitude, sign: ZODIAC[Math.floor((sun.longitude % 360) / 30)] },
      moon: { longitude: moon.longitude, sign: ZODIAC[Math.floor((moon.longitude % 360) / 30)] },
      ascendant: { longitude: asc, sign: ZODIAC[Math.floor((asc % 360) / 30)] },
    },
    summary: {
      sun: formatDegree(sun.longitude),
      moon: formatDegree(moon.longitude),
      rising: formatDegree(asc),
    },
  };
}

/** HTTP function (for testing). */
export const getSignsHttp = onRequest(async (req, res) => {
  try {
    const data = req.method === "POST" ? req.body : req.query;
    const birth = validateBirthData(data);
    const result = await calculateSignsCore(birth);
    res.status(200).json({ message: "Success", ...result });
  } catch (err: any) {
    logger.error(err);
    const status = err.code === "invalid-argument" ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
});

/** Callable function for clients. */
export const getSigns = onCall(async (req) => {
  if (!req.auth) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }
  const birth = validateBirthData(req.data || {});
  const result = await calculateSignsCore(birth);

  // Optional debug logging in non-production
  if (process.env.LOG_SIGN_CALCS === "true") {
    await db.collection("debug_sign_logs").add({
      createdAt: FieldValue.serverTimestamp(),
      uid: req.auth.uid,
      params: birth,
      summary: result.summary,
      raw: result.raw,
    });
  }

  return {
    sunSign: result.raw.sun.sign,
    moonSign: result.raw.moon.sign,
    risingSign: result.raw.ascendant.sign,
  };
});

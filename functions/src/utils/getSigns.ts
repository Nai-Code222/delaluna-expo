import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { calculateSignsInternal } from "./calculateSigns";

const db = getFirestore();

// Define required input
interface BirthData {
  day: number;
  month: number;
  year: number;
  hour: number;
  min: number;
  lat: number;
  lon: number;
  tzone: number;
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

/** HTTP function (for testing). */
export const getSignsHttp = onRequest(async (req, res) => {
  try {
    const data = req.method === "POST" ? req.body : req.query;
    const birth = validateBirthData(data);

    const chart = await calculateSignsInternal(birth);

    res.status(200).json({
      message: "Success",
      julianDay: chart.julianDay,
      sun: chart.planets.sun,
      moon: chart.planets.moon,
      ascendant: chart.ascendant,
    });
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
  const chart = await calculateSignsInternal(birth);

  // Optional debug logging
  if (process.env.LOG_SIGN_CALCS === "true") {
    await db.collection("debug_sign_logs").add({
      createdAt: FieldValue.serverTimestamp(),
      uid: req.auth.uid,
      params: birth,
      bigThree: {
        sun: chart.planets.sun.sign,
        moon: chart.planets.moon.sign,
        rising: chart.ascendant.sign,
      },
    });
  }

  return {
    sunSign: chart.planets.sun.sign,
    moonSign: chart.planets.moon.sign,
    risingSign: chart.ascendant.sign,
  };
});

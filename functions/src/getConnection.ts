import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import swe from "@hatijs/core";
import { DateTime } from "luxon";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

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

/**
 * 🔮 Reuseable Swiss Ephemeris calculation logic
 */
async function calculateSigns(data: any) {
  const day = Number(data.day);
  const month = Number(data.month);
  const year = Number(data.year);
  const hour = Number(data.hour);
  const min = Number(data.min);
  const lat = Number(data.lat);
  const lon = Number(data.lon);
  const tzone = Number(data.tzone);

  const dt = DateTime.fromObject({ year, month, day, hour, minute: min })
    .minus({ hours: tzone });
  const jd = swe.node_swe_julday(
    dt.year, dt.month, dt.day, dt.hour + dt.minute / 60, swe.SE_GREG_CAL
  );

  const sun = swe.node_swe_calc_ut(jd, swe.SE_SUN, swe.SEFLG_SWIEPH) as any;
  const moon = swe.node_swe_calc_ut(jd, swe.SE_MOON, swe.SEFLG_SWIEPH) as any;
  const houses = swe.node_swe_houses_ex2(jd, swe.SEFLG_SWIEPH, lat, lon, "P") as HousesResult;

  const asc = houses.ascendant ?? houses.asc ?? 0;
  const sunSign = getZodiacSign(sun.longitude);
  const moonSign = getZodiacSign(moon.longitude);
  const risingSign = getZodiacSign(asc);

  return {
    sunSign,
    moonSign,
    risingSign,
    formatted: {
      sun: formatDegree(sun.longitude),
      moon: formatDegree(moon.longitude),
      rising: formatDegree(asc),
    },
  };
}

/**
 * 💞 getConnection
 * Full compatibility creation pipeline:
 * 1️⃣ Calculates both signs
 * 2️⃣ Builds Gemini prompt
 * 3️⃣ Saves to Firestore with "pending" status
 */
interface ConnectionInput {
  userId: string;
  isMe: boolean;
  relationshipType: string;
  firstPerson: Record<string, any>;
  secondPerson: Record<string, any>;
}

export const getConnection = functions.https.onCall(
  async (request: functions.https.CallableRequest<ConnectionInput>) => {
    try {
      const { userId, firstPerson, secondPerson, relationshipType, isMe } = request.data;

      if (!userId) throw new functions.https.HttpsError("invalid-argument", "Missing userId.");
      if (!secondPerson) throw new functions.https.HttpsError("invalid-argument", "Missing secondPerson.");

      console.log("💫 Starting getConnection for:", { userId, relationshipType, isMe });

      // 🌞 Calculate signs for both individuals
      const userSigns = !isMe ? await calculateSigns(firstPerson) : null;
      const partnerSigns = await calculateSigns(secondPerson);

      console.log("✅ Signs calculated:", { userSigns, partnerSigns });

      // 🧠 Build Gemini prompt
      const userLine = isMe
        ? "User: (use stored profile signs)"
        : `User: Sun ${userSigns?.sunSign}, Moon ${userSigns?.moonSign}, Rising ${userSigns?.risingSign}`;

      const partnerLine = `Partner: Sun ${partnerSigns.sunSign}, Moon ${partnerSigns.moonSign}, Rising ${partnerSigns.risingSign}`;

      const prompt = `
You are Delaluna, a modern astrologer and intuitive best friend.
Your tone is confident, chic, and emotionally intelligent — witty, feminine, and empowering.

Generate a compatibility report between:
- ${userLine}
- ${partnerLine}
- Relationship type: ${relationshipType}

Use these exact compatibility keywords with percentage scores (0–100):
Resonation, Chemistry, Vibe, Attraction, Intensity,
Understanding, Communication, Logic, Empathy, Reasoning,
Romance, Loyalty, Devotion, Trust, Sacrifice,
Stubbornness, PowerStruggle, Patience, Boundaries, Independence

Respond ONLY with valid JSON using this structure:
{
  "title": "string",
  "summary": "string",
  "scores": {
    "Resonation": number,
    "Chemistry": number,
    "Vibe": number,
    "Attraction": number,
    "Intensity": number,
    "Understanding": number,
    "Communication": number,
    "Logic": number,
    "Empathy": number,
    "Reasoning": number,
    "Romance": number,
    "Loyalty": number,
    "Devotion": number,
    "Trust": number,
    "Sacrifice": number,
    "Stubbornness": number,
    "PowerStruggle": number,
    "Patience": number,
    "Boundaries": number,
    "Independence": number
  },
  "closing": "string"
}`;

      // 🔮 Firestore write
      const connectionId = isMe
        ? `${secondPerson.firstName}-${secondPerson.lastName}`
        : `${firstPerson.firstName}-${firstPerson.lastName}`;
      const safeId = connectionId.toLowerCase().replace(/\s+/g, "-");

      const connectionRef = db
        .collection("users")
        .doc(userId)
        .collection("connections")
        .doc(safeId);

      await connectionRef.set(
        {
          firstPerson: isMe ? undefined : firstPerson,
          secondPerson,
          relationshipType: relationshipType.toLowerCase(),
          prompt,
          status: "pending",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      console.log(`🪩 Connection saved → ${connectionRef.path}`);

      return {
        success: true,
        connectionId: safeId,
        message: "Compatibility generation started. Gemini extension will respond soon.",
      };
    } catch (err: any) {
      console.error("❌ Error in getConnection:", err);
      throw new functions.https.HttpsError("internal", err.message || "Unknown error");
    }
  }
);

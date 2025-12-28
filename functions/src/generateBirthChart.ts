// generateBirthChart.ts — FINALIZED FIRST FILE
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { buildBirthChartPrompt } from "./utils/buildBirthChartPrompt";

export const generateBirthChart = onCall(
  { region: "us-central1" },
  async (req) => {
    const { uid, birthDate, birthTime, lat, lon, timezone } = req.data ?? {};

    // VALIDATION
    if (!uid) throw new HttpsError("invalid-argument", "Missing uid");
    if (!birthDate) throw new HttpsError("invalid-argument", "Missing birthDate");
    if (!birthTime) throw new HttpsError("invalid-argument", "Missing birthTime");
    if (typeof lat !== "number" || typeof lon !== "number") {
      throw new HttpsError("invalid-argument", "Invalid latitude/longitude");
    }
    if (timezone === undefined || timezone === null) {
      throw new HttpsError("invalid-argument", "Missing timezone");
    }

    // Build Prompt
    const prompt = buildBirthChartPrompt({
      birthDate,
      birthTime,
      lat,
      lon,
      timezone,
    });

    // Write doc

    const db = getFirestore();
    const docRef = db.doc(`users/${uid}/birthChart/default`);

    logger.info("🔮 Starting birth chart generation", { uid });

    await docRef.set(
      {
        status: "image_pending",
        prompt,
        requestedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    logger.info("✨ Birth chart generation doc created", { uid });

    return {
      ok: true,
      started: true,
      message: "Birth chart generation queued.",
    };
  }
);
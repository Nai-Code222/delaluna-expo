// generateBirthChart.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { buildBirthChartPrompt } from "./utils/buildBirthChartPrompt";

export const generateBirthChart = onCall(
  { region: "us-central1" },
  async (req) => {
    // ----------------------------
    // AUTH
    // ----------------------------
    if (!req.auth) {
      throw new HttpsError("unauthenticated", "User must be signed in.");
    }

    const uid = req.auth.uid;

    const { birthDate, birthTime, lat, lon, timezone } = req.data ?? {};

    // ----------------------------
    // VALIDATION
    // ----------------------------
    if (!birthDate) throw new HttpsError("invalid-argument", "Missing birthDate");
    if (!birthTime) throw new HttpsError("invalid-argument", "Missing birthTime");
    if (typeof lat !== "number" || typeof lon !== "number") {
      throw new HttpsError("invalid-argument", "Invalid latitude/longitude");
    }
    if (timezone === undefined || timezone === null) {
      throw new HttpsError("invalid-argument", "Missing timezone");
    }

    const db = getFirestore();

    // ----------------------------
    // 1️⃣ Build Gemini prompt
    // ----------------------------
    const prompt = buildBirthChartPrompt({
      birthDate,
      birthTime,
      lat,
      lon,
      timezone,
    });

    // ----------------------------
    // 2️⃣ Ensure summary doc exists
    // ----------------------------
    const summaryRef = db.doc(`users/${uid}/birthChart/default`);

    await summaryRef.set(
      {
        status: "processing",
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // ----------------------------
    // 3️⃣ Create Gemini TASK doc
    // ----------------------------
    const taskRef = summaryRef.collection("tasks").doc();

    await taskRef.set({
      prompt,
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
    });

    logger.info("🌌 Birth chart task created", {
      uid,
      taskId: taskRef.id,
    });

    return {
      ok: true,
      started: true,
      taskId: taskRef.id,
      message: "Birth chart generation queued.",
    };
  }
);
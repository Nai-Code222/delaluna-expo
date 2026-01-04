// functions/src/callables/generateBirthChartImage.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { generateAndSaveBirthChart } from "../services/generateAndSaveBirthChart";

export const generateBirthChartImage = onCall(
  { region: "us-central1" },
  async (req) => {
    const uid = req.auth?.uid;

    if (!uid) {
      throw new HttpsError("unauthenticated", "User not authenticated");
    }

    logger.info("🪐 Callable: generateBirthChartImage", { uid });

    try {
      const result = await generateAndSaveBirthChart(uid);
      return { ok: true, ...result };
    } catch (err: any) {
      logger.error("❌ Birth chart generation failed", err);
      throw new HttpsError("internal", err.message);
    }
  }
);
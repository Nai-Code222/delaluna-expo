// functions/src/services/generateAndSaveBirthChart.ts
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import * as logger from "firebase-functions/logger";
import { HttpsError } from "firebase-functions/v1/https";

import { buildBirthChartPrompt } from "../prompts/natalChart.prompt";
import { generateGeminiImage } from "./gemini.service";
import { NatalChart } from "../types/natal-chart.types";
import { buildFreeBirthChartInterpretationPrompt } from "../prompts/birthChart.free.prompt";
import { buildPremiumBirthChartInterpretationPrompt } from "../prompts/birthChart.premium.prompt";

const db = getFirestore();
const storage = getStorage();

function buildNatalTable(natalChart: NatalChart) {
  return Object.entries(natalChart.planets ?? {}).map(([planet, data]: any) => ({
    planet,
    sign: data.sign,
    house: data.house,
    degree: data.formatted,
  }));
}

export async function generateAndSaveBirthChart(uid: string) {
  const userSnap = await db.doc(`users/${uid}`).get();

  if (!userSnap.exists) {
    throw new HttpsError(
      "failed-precondition",
      "User document not found."
    );
  }

  const userData = userSnap.data();
  const natalChart = userData?.natalChart as NatalChart | undefined;

  if (!natalChart) {
    throw new HttpsError(
      "failed-precondition",
      "Natal chart missing on user document."
    );
  }

  const birthChartRef = db.doc(`users/${uid}/birthChart/default`);
  await birthChartRef.set(
    {
      imageStatus: "processing",
      imageRequestedAt: FieldValue.serverTimestamp(),
      natalSnapshot: natalChart,
      natalTable: buildNatalTable(natalChart),
    },
    { merge: true }
  );

  const prompt = buildBirthChartPrompt(natalChart);

  try {
    const svg = await generateGeminiImage(prompt);

    if (!svg || !svg.trim().startsWith("<svg")) {
      throw new Error("Invalid SVG returned");
    }

    const bucket = storage.bucket();
    const path = `user-birth-charts/${uid}.svg`;

    await bucket.file(path).save(svg.trim(), {
      contentType: "image/svg+xml",
      resumable: false,
    });

    const imageUrl = `https://storage.googleapis.com/${bucket.name}/${path}`;

    await birthChartRef.set(
      {
        imageStatus: "complete",
        imageUrl,
        imageFormat: "svg",
        promptVersion: "birth-chart-image-v1",
        imageCompletedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    logger.info("✨ Birth chart image generated", { uid });

    // STEP 7: Generate interpretations
const freeText = await generateGeminiImage(
  buildFreeBirthChartInterpretationPrompt(natalChart)
);

const premiumText = await generateGeminiImage(
  buildPremiumBirthChartInterpretationPrompt(natalChart)
);

await birthChartRef.set(
  {
    interpretation: {
      free: {
        status: "complete",
        text: freeText,
        generatedAt: FieldValue.serverTimestamp(),
      },
      premium: {
        status: "complete",
        text: premiumText,
        generatedAt: FieldValue.serverTimestamp(),
      },
    },
  },
  { merge: true }
);


    return { imageUrl };

  } catch (err: any) {
    logger.error("❌ Birth chart image failed", { uid, err });

    await birthChartRef.set(
      {
        imageStatus: "error",
        imageError: err?.message ?? "generation_failed",
        imageFailedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    throw err;
  }

  
}


import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { FieldValue } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { db } from "./initAdmin";

/**
 * Shared Gemini cleanup handler
 */
async function handleGeminiResponse(event: any, type: "horoscope" | "compatibility") {
  const before = event.data?.before?.data();
  const after = event.data?.after?.data();
  const docRef = event.data?.after?.ref;

  if (!docRef || !after) return;

  // Prevent re-processing
  if (before?.response === after.response && before?.output === after.output && before?.result) {
    return;
  }

  // 🧭 Detect Gemini output field
  const raw =
    after.response ||
    after.output ||
    after.result ||
    after.TypeCompatibility_Report ||
    after["Type{Compatibility}_Report"] ||
    null;

  if (!raw) return;

  try {
    logger.info(`🔮 Parsing Gemini response for → ${docRef.path}`);

    const clean = (str: string) =>
      str
        .replace(/^```(?:json)?/i, "")
        .replace(/```$/i, "")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/“|”/g, '"')
        .replace(/‘|’/g, "'")
        .replace(/(\r\n|\n|\r)/gm, " ")
        .replace(/,\s*([}\]])/g, "$1")
        .trim();

    let parsed: any;
    if (typeof raw === "string") {
      parsed = JSON.parse(clean(raw));
    } else {
      parsed = raw;
    }

    let result: any;

    if (type === "horoscope") {
      result = parsed;
    } else {
      const report =
        parsed?.TypeCompatibility_Report ||
        parsed?.["Type{Compatibility}_Report"] ||
        parsed;

      result = {
        title: report.title || "Compatibility Report",
        summary: report.summary || "",
        closing: report.closing || "",
        overallCompatibility: report.overallCompatibility || null,
        scores: report.scores || report.Scores || {},
      };
    }

    await docRef.set(
      {
        result,
        status: {
          state: "complete",
          type,
          completeTime: FieldValue.serverTimestamp(),
        },
        lastProcessedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await docRef.update({
      response: FieldValue.delete(),
      output: FieldValue.delete(),
      TypeCompatibility_Report: FieldValue.delete(),
      "Type{Compatibility}_Report": FieldValue.delete(),
    });

    logger.info(`✅ Clean Gemini result saved → ${docRef.path}`);
  } catch (err: any) {
    logger.error(`❌ Failed to parse Gemini response for ${docRef.path}:`, err);

    await docRef.set(
      {
        status: {
          state: "error",
          type,
          errorAt: FieldValue.serverTimestamp(),
        },
        parseError: {
          message: err.message ?? "Unknown Gemini parse error",
          at: FieldValue.serverTimestamp(),
        },
      },
      { merge: true }
    );
  }
}

/**
 * 🔮 Horoscope Gemini cleanup
 */
export const onHoroscopeGeminiResponse = onDocumentUpdated(
  "users/{userId}/horoscope/{dateId}",
  (event) => handleGeminiResponse(event, "horoscope")
);

/**
 * 💞 Compatibility Gemini cleanup
 */
export const onCompatibilityGeminiResponse = onDocumentUpdated(
  "users/{userId}/connections/{docId}",
  (event) => handleGeminiResponse(event, "compatibility")
);

import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { FieldValue } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { db } from "./initAdmin";

/**
 * 🪩 onGeminiResponse
 * General fallback handler for Gemini “response” fields.
 * Cleans, parses, and writes a structured “result” back to Firestore.
 */
export const onGeminiResponse = onDocumentUpdated(
  "users/{userId}/connections/{docId}",
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    const docRef = event.data?.after?.ref;

    if (!docRef || !after) return;

    // 🛑 Skip redundant triggers
    if (
      before?.response === after.response &&
      before?.TypeCompatibility_Report === after.TypeCompatibility_Report
    ) {
      return;
    }

    // 🧭 Detect Gemini output field
    const raw =
      after.response ||
      after.result ||
      after.TypeCompatibility_Report ||
      after["Type{Compatibility}_Report"] ||
      null;

    if (!raw) return;

    try {
      logger.info(`🔮 Parsing Gemini response for → ${docRef.path}`);

      // 🧠 Normalize raw text before parsing
      const clean = (str: string) =>
        str
          .replace(/^```(?:json)?/i, "")
          .replace(/```$/i, "")
          .replace(/[\u201C\u201D]/g, '"') // smart quotes → "
          .replace(/[\u2018\u2019]/g, "'")
          .replace(/“|”/g, '"')
          .replace(/‘|’/g, "'")
          .replace(/(\r\n|\n|\r)/gm, " ")
          .replace(/,\s*([}\]])/g, "$1")
          .trim();

      let parsed: any;
      if (typeof raw === "string") {
        try {
          parsed = JSON.parse(clean(raw));
        } catch (err) {
          logger.error("⚠️ JSON parse error:", err);
          throw new Error("Malformed Gemini response — could not parse JSON.");
        }
      } else {
        parsed = raw;
      }

      // 🧩 Extract relevant report section
      const report =
        parsed?.TypeCompatibility_Report ||
        parsed?.["Type{Compatibility}_Report"] ||
        parsed;

      // 🪞 Construct clean, uniform result
      const result = {
        title: report.title || report.Title || "Compatibility Report",
        summary: report.summary || report.Summary || "",
        closing: report.closing || report.Closing || "",
        overallCompatibility:
          report.overallCompatibility ||
          report.OverallCompatibility ||
          null,
        scores:
          report.scores ||
          report.Scores ||
          report?.TypeCompatibility_Report?.Scores ||
          {},
      };

      // ✅ Write formatted result to Firestore
      await docRef.set(
        {
          result,
          status: {
            state: "complete",
            type: "compatibility",
            completeTime: FieldValue.serverTimestamp(),
          },
          lastProcessedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // 🧹 Clean up raw Gemini fields
      await docRef.update({
        response: FieldValue.delete(),
        TypeCompatibility_Report: FieldValue.delete(),
        "Type{Compatibility}_Report": FieldValue.delete(),
      });

      logger.info(`✅ Clean Gemini result saved → ${docRef.path}`);
    } catch (err: any) {
      logger.error(`❌ Failed to parse Gemini response for ${docRef.path}:`, err);

      const fallbackRef =
        event.data?.after?.ref ??
        db.doc(`users/${event.params.userId}/connections/${event.params.docId}`);

      await fallbackRef.set(
        {
          status: {
            state: "error",
            type: "compatibility",
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
);

import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { CompatibilityScores } from "./models/connection.model";
import { calculateOverallCompatibility } from "./utils/calculateOverallCompatibility";
import { db } from "./initAdmin";
import * as logger from "firebase-functions/logger";
import { calculateSignsInternal } from "./utils/calcSigns";


/**
 * 🪩 onGeminiCompatibility
 * Cleans Gemini’s response → saves structured result + score breakdown.
 */
export const onGeminiCompatibility = onDocumentUpdated(
  "users/{userId}/connections/{docId}",
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    const docRef = event.data?.after?.ref;

    // 🛑 Guard: Ensure document exists
    if (!docRef) {
      logger.warn("⚠️ No document reference found — skipping trigger.");
      return;
    }

    // 🛑 Skip redundant triggers
    if (!after?.response || before?.response === after.response) return;

    try {
      logger.info(`🔮 Processing Gemini response for → ${docRef.path}`);

      // ♓ Ensure signs exist on both people (fallback / repair)
      const first = after.firstPerson || {};
      const second = after.secondPerson || {};

      const missingFirstSigns = !first.sun || !first.moon || !first.rising;
      const missingSecondSigns = !second.sun || !second.moon || !second.rising;

      if (missingFirstSigns || missingSecondSigns) {
        try {
          const firstCalc = await calculateSignsInternal({
            day: first.day,
            month: first.month,
            year: first.year,
            hour: first.hour,
            min: first.min,
            lat: first.lat,
            lon: first.lon,
            tzone: first.tzone,
          });

          const secondCalc = await calculateSignsInternal({
            day: second.day,
            month: second.month,
            year: second.year,
            hour: second.hour,
            min: second.min,
            lat: second.lat,
            lon: second.lon,
            tzone: second.tzone,
          });

          await docRef.set(
            {
              firstPerson: {
                ...first,
                sun: firstCalc.raw.sun.sign,
                moon: firstCalc.raw.moon.sign,
                rising: firstCalc.raw.ascendant.sign,
              },
              secondPerson: {
                ...second,
                sun: secondCalc.raw.sun.sign,
                moon: secondCalc.raw.moon.sign,
                rising: secondCalc.raw.ascendant.sign,
              },
            },
            { merge: true }
          );

          logger.info("🔧 Repaired missing signs before compatibility processing.");
        } catch (err) {
          logger.error("❌ Failed to calculate signs inside onGeminiCompatibility:", err);
        }
      }

      // 🧽 Clean common Gemini formatting issues
      const cleanJsonString = (raw: string) =>
        raw
          .replace(/^```(?:json)?/i, "")       // remove starting ``` or ```json
          .replace(/```$/i, "")                // remove trailing ```
          .replace(/[\u201C\u201D]/g, '"')     // smart quotes → "
          .replace(/[\u2018\u2019]/g, "'")     // single curly quotes → '
          .replace(/“|”/g, '"')
          .replace(/‘|’/g, "'")
          .replace(/(\r\n|\n|\r)/gm, " ")      // normalize line breaks
          .replace(/,\s*([}\]])/g, "$1")       // trailing commas
          .trim();

      let parsed: any;
      try {
        parsed = JSON.parse(cleanJsonString(after.response));
      } catch (err) {
        logger.error("⚠️ Gemini JSON parse error:", err);
        throw new Error("Failed to parse Gemini JSON — malformed format or code fences present.");
      }

      // 🧩 Extract compatibility scores safely
      const scores: CompatibilityScores =
        parsed?.TypeCompatibility_Report?.Scores ||
        parsed?.scores ||
        {};

      // 🧠 Normalize relationship type
      let relationshipType =
        (after.relationshipType as string)?.toLowerCase() || "consistent";
      if (relationshipType === "it’s complicated") relationshipType = "complicated";
      if (!["consistent", "complicated", "toxic"].includes(relationshipType))
        relationshipType = "consistent";

      // 💫 Calculate overall compatibility
      const overallCompatibility = calculateOverallCompatibility(
        scores,
        relationshipType as "consistent" | "it’s complicated" | "toxic"
      );

      // 🪞 Build structured result
      const result = {
        title: parsed.title ?? "Compatibility Report",
        summary:
          parsed?.TypeCompatibility_Report?.Summary ??
          parsed?.summary ??
          "No summary provided.",
        closing:
          parsed?.TypeCompatibility_Report?.Closing ??
          parsed?.closing ??
          "No closing message provided.",
        scores,
        overallCompatibility,
        createdAt: new Date().toISOString(),
      };

      // 📝 Write structured result → mark as complete
      await docRef.set(
        {
          result,
          status: "complete",
          lastProcessedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      logger.info(`✅ Compatibility result saved → ${docRef.path}`);

      // 🧹 Remove raw Gemini response (to avoid reprocessing)
      await docRef.update({ response: FieldValue.delete() });

      // 📊 Save each score to subcollection (for analytics dashboards)
      if (scores && typeof scores === "object" && Object.keys(scores).length) {
        const batch = db.batch();
        const scoresRef = docRef.collection("scores");

        for (const [keyword, value] of Object.entries(scores)) {
          const keywordId = keyword.replace(/\s+/g, "_").toLowerCase();
          const scoreRef = scoresRef.doc(keywordId);
          batch.set(scoreRef, {
            keyword,
            value: Number(value) || 0,
            updatedAt: FieldValue.serverTimestamp(),
          });
        }

        await batch.commit();
        logger.info(`📈 Score breakdown saved → ${docRef.path}/scores`);
      }
    } catch (error: any) {
      logger.error("❌ Error in onGeminiCompatibility:", error);

      // Fallback ref (in case docRef somehow failed)
      const fallbackRef =
        event.data?.after?.ref ??
        db.doc(`users/${event.params.userId}/connections/${event.params.docId}`);

      await fallbackRef.set(
        {
          status: "error",
          parseError: {
            message: error.message || "Unknown parsing error",
            at: FieldValue.serverTimestamp(),
          },
        },
        { merge: true }
      );
    }
  }
);

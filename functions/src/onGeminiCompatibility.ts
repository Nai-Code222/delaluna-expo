import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { CompatibilityScores } from "./models/connection.model";
import { calculateOverallCompatibility } from "./utils/calculateOverallCompatibility";
import { db } from "./initAdmin";
import * as logger from "firebase-functions/logger";
import { calculateSignsInternal } from "./utils/calculateSigns";

/**
 * onGeminiCompatibility
 * Cleans Gemini JSON → parses → calculates scores → saves → removes raw data.
 */
export const onGeminiCompatibility = onDocumentUpdated(
  "users/{userId}/connections/{docId}",
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    const docRef = event.data?.after?.ref;

    if (!docRef || !after) {
      logger.warn("⚠️ No document reference or data — skipping trigger.");
      return;
    }

    // 🔍 Trigger only when a NEW Gemini response appears
    const newResponse = after.response;
    const hadResponseBefore = before?.response;

    if (!newResponse || newResponse === hadResponseBefore) return;

    logger.info(`🔮 Gemini response detected → ${docRef.path}`);
    logger.info("🔥 RAW GEMINI RESPONSE:", newResponse);

    // ------------------------------------------------------------
    // 1️⃣ Mark as processing so UI can display a spinner
    // ------------------------------------------------------------
    await docRef.set(
      { status: "processing", lastAttemptAt: FieldValue.serverTimestamp() },
      { merge: true }
    );

    try {
      // ------------------------------------------------------------
      // 2️⃣ Repair missing signs (fallback)
      // ------------------------------------------------------------
      const first = after.firstPerson ?? {};
      const second = after.secondPerson ?? {};

      const missing = !first.sun || !first.moon || !first.rising ||
                      !second.sun || !second.moon || !second.rising;

      if (missing) {
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
                sun: firstCalc.planets.sun.sign,
                moon: firstCalc.planets.moon.sign,
                rising: firstCalc.ascendant.sign,
              },
              secondPerson: {
                ...second,
                sun: secondCalc.planets.sun.sign,
                moon: secondCalc.planets.moon.sign,
                rising: secondCalc.ascendant.sign,
              },
            },
            { merge: true }
          );

          logger.info("🔧 Repaired missing signs before score processing.");
        } catch (err) {
          logger.error("❌ Failed repairing signs:", err);
        }
      }

      // ------------------------------------------------------------
      // 3️⃣ Clean and parse Gemini JSON
      // ------------------------------------------------------------
      const cleanJsonString = (raw: string) =>
        raw
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
      try {
        parsed = JSON.parse(cleanJsonString(newResponse));
      } catch (err) {
        logger.error("⚠️ JSON parse error:", err);
        throw new Error("Invalid Gemini response — failed JSON.parse");
      }

      // ------------------------------------------------------------
      // 4️⃣ Extract Scores Safely
      // ------------------------------------------------------------
      const scores: CompatibilityScores =
        parsed?.TypeCompatibility_Report?.Scores ||
        parsed?.scores ||
        {};

      if (!scores || typeof scores !== "object") {
        logger.error("❌ No valid scores object found in Gemini output.");
      }

      // ------------------------------------------------------------
      // 5️⃣ Normalize relationship type
      // ------------------------------------------------------------
      let relationshipType =
        (after.relationshipType as string)?.toLowerCase() || "consistent";

      if (relationshipType === "it’s complicated") relationshipType = "complicated";
      if (!["consistent", "complicated", "toxic"].includes(relationshipType)) {
        relationshipType = "consistent";
      }

      // ------------------------------------------------------------
      // 6️⃣ Calculate final overall score
      // ------------------------------------------------------------
      const overallCompatibility = calculateOverallCompatibility(
        scores,
        relationshipType as "consistent" | "toxic" | "it’s complicated"
      );

      // ------------------------------------------------------------
      // 7️⃣ Build structured result
      // ------------------------------------------------------------
      const result = {
        title: parsed.title ?? "Compatibility Report",
        summary:
          parsed?.TypeCompatibility_Report?.Summary ??
          parsed.summary ??
          "No summary provided.",
        closing:
          parsed?.TypeCompatibility_Report?.Closing ??
          parsed.closing ??
          "No closing message provided.",
        scores,
        overallCompatibility,
        createdAt: new Date().toISOString(),
      };

      // ------------------------------------------------------------
      // 8️⃣ Save cleaned result + mark complete
      // ------------------------------------------------------------
      await docRef.set(
        {
          result,
          status: "complete",
          lastProcessedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      logger.info(`✅ Compatibility result saved → ${docRef.path}`);

      // ------------------------------------------------------------
      // 9️⃣ Remove raw Gemini fields (VERY IMPORTANT)
      // ------------------------------------------------------------
      await docRef.update({
        response: FieldValue.delete(),
        prompt: FieldValue.delete(),
      });

      // ------------------------------------------------------------
      // 🔟 Save score breakdown for analytics
      // ------------------------------------------------------------
      try {
        const batch = db.batch();
        const scoreSub = docRef.collection("scores");

        Object.entries(scores).forEach(([keyword, value]) => {
          const scoreId = keyword.replace(/\s+/g, "_").toLowerCase();
          batch.set(scoreSub.doc(scoreId), {
            keyword,
            value: Number(value) || 0,
            updatedAt: FieldValue.serverTimestamp(),
          });
        });

        await batch.commit();
        logger.info(`📊 Score breakdown saved → ${docRef.path}/scores`);
      } catch (err) {
        logger.warn("⚠️ Failed writing individual score docs:", err);
      }
    }

    // ------------------------------------------------------------
    // 🔥 Global error handler
    // ------------------------------------------------------------
    catch (error: any) {
      logger.error("❌ Fatal error in onGeminiCompatibility:", error);

      await docRef.set(
        {
          status: "error",
          parseError: {
            message: error.message || "Unknown compatibility error",
            at: FieldValue.serverTimestamp(),
          },
        },
        { merge: true }
      );
    }
  }
);
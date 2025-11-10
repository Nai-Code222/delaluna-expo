// functions/src/onGeminiCompatibility.ts

import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { CompatibilityScores } from "./models/connection.model";
import { calculateOverallCompatibility } from "./utils/calculateOverallCompatibility";
import { db, admin } from "./initAdmin";

/**
 * 🪩 onGeminiCompatibility
 * Parses Gemini’s compatibility JSON → creates clean Firestore result.
 * Runs after the Gemini extension writes a `response` field.
 */
export const onGeminiCompatibility = onDocumentUpdated(
  "users/{userId}/connections/{docId}",
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    const docRef = event.data?.after?.ref;

    // ✅ Guard: Make sure we actually have a doc to work with
    if (!docRef) {
      console.warn("⚠️ No document reference found. Skipping...");
      return;
    }

    // 🚫 Skip if no new response or no change
    if (!after || before?.response === after.response) return;
    if (!after.response) return;

    try {
      console.log(`🔮 Processing Gemini response for ${docRef.path}`);

      // 🧠 Clean malformed JSON before parsing
      const clean = (str: string) =>
        str
          .replace(/^```(?:json)?/i, "")      // remove starting ``` or ```json
          .replace(/```$/, "")                // remove ending ```
          .replace(/[\u201C\u201D\u2018\u2019]/g, '"') // smart/single quotes → "
          .replace(/“|”/g, '"')
          .replace(/‘|’/g, "'")
          .replace(/,\s*}/g, "}")
          .replace(/,\s*]/g, "]")
          .trim();

      let parsed: any;
      try {
        parsed = JSON.parse(clean(after.response));
      } catch (err) {
        console.error("⚠️ JSON parse error:", err);
        throw new Error("Failed to parse Gemini JSON — malformed format or code fences.");
      }

      // 🧩 Extract scores safely
      const scores: CompatibilityScores =
        parsed?.TypeCompatibility_Report?.Scores ||
        parsed?.scores ||
        {};

      // 🧩 Normalize relationshipType
      let relationshipType =
        (after.relationshipType as string)?.toLowerCase() || "consistent";

      if (relationshipType === "it’s complicated") relationshipType = "complicated";
      if (!["consistent", "complicated", "toxic"].includes(relationshipType)) {
        relationshipType = "consistent";
      }

      // 💫 Calculate overall compatibility
      const overallCompatibility = calculateOverallCompatibility(
        scores,
        relationshipType as "consistent" | "it’s complicated" | "toxic"
      );

      // 🧾 Build structured result object
      const result = {
        title: parsed.title ?? "Compatibility Report",
        summary:
          parsed?.TypeCompatibility_Report?.Summary ??
          parsed?.summary ??
          "No summary available.",
        closing:
          parsed?.TypeCompatibility_Report?.Closing ??
          parsed?.closing ??
          "No closing message.",
        scores,
        overallCompatibility,
        createdAt: new Date().toISOString(),
      };

      // 📝 Write structured result → mark complete
      await docRef.set(
        {
          result,
          status: "complete",
          lastProcessedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      console.log(`✅ Result saved → ${docRef.path}`);

      // 🧹 Remove raw Gemini response
      await docRef.update({ response: FieldValue.delete() });

      // 📊 Save each score to subcollection for analytics
      if (scores && typeof scores === "object") {
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
        console.log(`📈 Scores saved → ${docRef.path}/scores`);
      }
    } catch (error: any) {
      console.error(`❌ Error in onGeminiCompatibility:`, error);

      // fallback reference if docRef is missing
      const fallbackRef =
        event.data?.after?.ref ??
        db.doc(`users/${event.params.userId}/connections/${event.params.docId}`);

      await fallbackRef.set(
        {
          status: "error",
          parseError: {
            message: error.message || "Unknown error during parsing",
            at: FieldValue.serverTimestamp(),
          },
        },
        { merge: true }
      );
    }
  }
);

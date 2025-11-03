import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as admin from "firebase-admin";

if (!admin.apps.length) admin.initializeApp();

/**
 * 🪩 onGeminiCompatibility
 * Parses Gemini’s compatibility JSON → creates clean Firestore result.
 * Runs after the Gemini extension writes a `response` field.
 */
export const onGeminiCompatibility = onDocumentUpdated(
  "users/{userId}/connections/{docId}",
  async (event) => {
    const db = getFirestore();
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    const docRef = event.data?.after?.ref;

    // ✅ Safety guard
    if (!docRef) {
      console.warn("⚠️ No document reference found. Skipping...");
      return;
    }

    // 🚫 Skip if no new response or nothing changed
    if (!after || before?.response === after.response) return;
    if (!after.response) return;

    try {
      console.log(`🔮 Processing Gemini response for ${docRef.path}`);

      // 🧠 Clean malformed JSON before parsing
      const clean = (str: string) =>
        str
          .replace(/[\u201C\u201D]/g, '"') // smart quotes → "
          .replace(/,\s*}/g, "}")
          .replace(/,\s*]/g, "]")
          .trim();

      let parsed: any;
      try {
        parsed = JSON.parse(clean(after.response));
      } catch (err) {
        console.error("⚠️ JSON parse error:", err);
        throw new Error("Failed to parse Gemini JSON");
      }

      const result = {
        title: parsed.title ?? "Compatibility Report",
        summary: parsed.summary ?? "",
        closing: parsed.closing ?? "",
        scores: parsed.scores ?? {},
      };

      // 📝 Write structured result and update status → complete
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

      // 📊 Save scores to subcollection
      if (result.scores && typeof result.scores === "object") {
        const batch = db.batch();
        const scoresRef = docRef.collection("scores");

        Object.entries(result.scores).forEach(([keyword, value]) => {
          const keywordId = keyword.replace(/\s+/g, "_");
          const scoreRef = scoresRef.doc(keywordId);
          batch.set(scoreRef, {
            keyword,
            value,
            updatedAt: FieldValue.serverTimestamp(),
          });
        });

        await batch.commit();
        console.log(`📈 Scores saved → ${docRef.path}/scores`);
      }
    } catch (error: any) {
      console.error(`❌ Error in onGeminiCompatibility:`, error);

      // Safely handle Firestore reference again
      const fallbackRef =
        event.data?.after?.ref ??
        db.doc(`users/${event.params.userId}/connections/${event.params.docId}`);

      await fallbackRef.set(
        {
          status: "error",
          parseError: {
            message: error.message || "Unknown error",
            at: FieldValue.serverTimestamp(),
          },
        },
        { merge: true }
      );
    }
  }
);

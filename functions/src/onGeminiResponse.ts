import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as admin from "firebase-admin";

/**
 * 🪩 onGeminiResponse (fixed + safe initialization)
 * Parses Gemini 'response' JSON → writes structured 'result'
 * and deletes the raw 'response' field.
 */
export const onGeminiResponse = onDocumentUpdated(
   "users/{userId}/connections/{docId}",
  async (event) => {
    // ✅ Ensure Firebase Admin is initialized before anything else
    if (!admin.apps.length) {
      admin.initializeApp();
      console.log("🔥 Firebase Admin initialized inside onGeminiResponse");
    }

    const db = getFirestore();

    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    const refPath = event.data?.after?.ref?.path;

    if (!refPath) {
      console.warn("⚠️ No Firestore ref path — skipping.");
      return;
    }

    const docRef = db.doc(refPath);

    // 🧠 Skip if no new response or no change
    if (!after || before?.response === after.response) return;
    if (!after.response) return;

    try {
      // 🔮 Parse Gemini's JSON
      const parsed = JSON.parse(after.response);

      const result = {
        Summary: parsed?.["Type{Compatibility}_Report"]?.Summary ?? "",
        Scores: parsed?.["Type{Compatibility}_Report"]?.Scores ?? {},
        Closing: parsed?.["Type{Compatibility}_Report"]?.Closing ?? "",
      };

      // 📝 Write clean result
      await docRef.set(
        {
          result,
          lastProcessedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // 🧹 Delete the raw 'response' field
      await docRef.update({ response: FieldValue.delete() });

      console.log(`✅ Clean result saved → ${refPath}`);
    } catch (err: any) {
      console.error(`❌ Failed to parse Gemini response for ${refPath}:`, err);
      await docRef.set(
        {
          parseError: {
            message: err.message ?? "Unknown error",
            at: FieldValue.serverTimestamp(),
          },
        },
        { merge: true }
      );
    }
  }
);

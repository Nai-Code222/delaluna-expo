import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { db, admin } from "./initAdmin";


/**
 * 🪩 onGeminiResponse
 * Parses Gemini 'response' JSON → writes structured 'result'
 * and deletes the raw 'response' field.
 */
export const onGeminiResponse = onDocumentUpdated(
  "users/{userId}/connections/{docId}",
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    const docRef = event.data?.after?.ref;
    if (!docRef || !after || before?.response === after.response) return;
    if (!after.response) return;

    try {
      console.log(`🔮 Parsing Gemini response for ${docRef.path}`);
      const parsed = JSON.parse(after.response);

      const result = {
        summary:
          parsed?.["Type{Compatibility}_Report"]?.Summary ??
          parsed?.summary ??
          "",
        scores:
          parsed?.["Type{Compatibility}_Report"]?.Scores ??
          parsed?.scores ??
          {},
        closing:
          parsed?.["Type{Compatibility}_Report"]?.Closing ??
          parsed?.closing ??
          "",
      };

      await docRef.set(
        {
          result,
          status: "complete",
          lastProcessedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      await docRef.update({ response: FieldValue.delete() });
      console.log(`✅ Clean result saved → ${docRef.path}`);
    } catch (err: any) {
      console.error(`❌ Failed to parse Gemini response for ${docRef.path}:`, err);
      await docRef.set(
        {
          status: "error",
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

import * as functions from "firebase-functions";
import { db, admin } from "./initAdmin";

/**
 * 🗑️ deleteConnection
 * Deletes a specific connection document for a given user.
 * Path: users/{userId}/connections/{connectionId}
 */
export const deleteConnection = functions.https.onCall(
  async (request: functions.https.CallableRequest<{ userId: string; connectionId: string }>) => {
    try {
      const { userId, connectionId } = request.data;

      if (!userId || !connectionId) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Missing required parameters: userId or connectionId."
        );
      }

      const connectionRef = db
        .collection("users")
        .doc(userId)
        .collection("connections")
        .doc(connectionId);

      const docSnap = await connectionRef.get();

      if (!docSnap.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          `Connection ${connectionId} not found for user ${userId}.`
        );
      }

      await connectionRef.delete();

      console.log(`🗑️ Deleted connection → users/${userId}/connections/${connectionId}`);

      return {
        success: true,
        message: `Connection '${connectionId}' deleted successfully.`,
      };
    } catch (err: any) {
      console.error("❌ Error deleting connection:", err);
      throw new functions.https.HttpsError(
        "internal",
        err.message || "Failed to delete connection."
      );
    }
  }
);

import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { db } from "./initAdmin";

/**
 * 🗑️ deleteConnection (v2)
 * Deletes a specific connection document for a given user.
 * Path: users/{userId}/connections/{connectionId}
 */
export const deleteConnection = onCall(async (request) => {
  try {
    const { userId, connectionId } = request.data || {};

    if (!userId || !connectionId) {
      throw new HttpsError(
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
      throw new HttpsError(
        "not-found",
        `Connection '${connectionId}' not found for user '${userId}'.`
      );
    }

    await connectionRef.delete();
    logger.info(`🗑️ Deleted connection → users/${userId}/connections/${connectionId}`);

    return {
      success: true,
      message: `Connection '${connectionId}' deleted successfully.`,
    };
  } catch (err: any) {
    logger.error("❌ Error deleting connection:", err);
    throw new HttpsError(
      "internal",
      err.message || "Failed to delete connection."
    );
  }
});

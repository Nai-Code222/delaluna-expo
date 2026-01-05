import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { db } from "../initAdmin";

/**
 * 🗑️ deleteConnection (Callable)
 * Deletes a specific connection document for a given user.
 * Path: users/{userId}/connections/{connectionId}
 */
export const deleteConnection = onCall(async (req) => {
  try {
    const { auth, data } = req;

    // --- 1. Auth Required ---
    if (!auth) {
      throw new HttpsError(
        "unauthenticated",
        "You must be signed in to delete a connection."
      );
    }

    const { userId, connectionId } = data || {};

    // --- 2. Basic validation ---
    if (!userId || !connectionId) {
      throw new HttpsError(
        "invalid-argument",
        "Missing required fields: userId or connectionId."
      );
    }

    // --- 3. Ensure user can only delete their own data ---
    if (auth.uid !== userId) {
      throw new HttpsError(
        "permission-denied",
        "You cannot delete a connection for another user."
      );
    }

    // --- 4. Build Firestore reference ---
    const ref = db.doc(`users/${userId}/connections/${connectionId}`);

    const snap = await ref.get();

    if (!snap.exists) {
      throw new HttpsError(
        "not-found",
        `Connection '${connectionId}' does not exist for user '${userId}'.`
      );
    }

    // --- 5. Delete ---
    await ref.delete();

    logger.info(
      `🗑️ Deleted connection → users/${userId}/connections/${connectionId}`
    );

    return {
      success: true,
      connectionId,
      message: `Connection '${connectionId}' deleted successfully.`,
    };
  } catch (err: any) {
    logger.error("❌ Error deleting connection:", err);
    throw new HttpsError(
      "internal",
      err?.message || "Failed to delete the connection."
    );
  }
});

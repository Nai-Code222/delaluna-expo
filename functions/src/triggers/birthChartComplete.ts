import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * birthChartComplete trigger
 * Fires whenever a user's birthChart/default document
 * transitions from status!="complete" → status=="complete"
 *
 * Sends an FCM push notification:
 * "Your Birth Chart is Ready ✨ Tap to view it."
 */
export const birthChartComplete = onDocumentUpdated(
  "users/{userId}/birthChart/default",
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    const userId = event.params.userId;

    if (!before || !after) return;

    // Only fire when status changes to complete
    if (before.status === "complete") return;
    if (after.status !== "complete") return;

    try {
      // Fetch the user's FCM token from users/{uid}
      const userRef = db.collection("users").doc(userId);
      const userSnap = await userRef.get();

      if (!userSnap.exists) {
        console.log(`❌ No user doc found for ${userId}`);
        return;
      }

      const userData = userSnap.data();
      const fcmToken = userData?.fcmToken;

      if (!fcmToken) {
        console.log(`⚠️ No FCM token for ${userId}, skipping push.`);
        return;
      }

      // Build push notification payload
      const payload = {
        notification: {
          title: "Your Birth Chart Is Ready ✨",
          body: "Tap to see your full Delaluna birth chart reading.",
        },
        data: {
          type: "birthChartComplete",
          userId,
        },
      };

      // Send push
      await admin.messaging().sendEachForMulticast({
        tokens: [fcmToken],
        notification: payload.notification,
        data: payload.data,
      });
      console.log(`📩 Birth chart completion push sent to ${userId}`);
    } catch (err) {
      console.error("❌ Error sending birth chart push:", err);
    }
  }
);

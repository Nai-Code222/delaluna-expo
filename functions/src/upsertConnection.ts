import * as functions from "firebase-functions";
import { db, admin } from "./initAdmin";


// Define the shape of the input data
interface UserProfile {
  firstName: string;
  lastName: string;
  sun: string;
  moon: string;
  rising: string;
}

interface PartnerProfile {
  firstName: string;
  lastName: string;
  sun: string;
  moon: string;
  rising: string;
}

interface ConnectionInput {
  userId: string;
  userProfile: UserProfile;
  partnerProfile: PartnerProfile;
  relationshipType?: string;
}

/**
 * Upserts a connection under:
 * users/{userId}/connections/{connectionId}
 * Document ID format:
 * "first_last-first_last"
 */
export const upsertConnection = functions.https.onCall(
  async (request: functions.https.CallableRequest<ConnectionInput>) => {
    try {
      const { userId, userProfile, partnerProfile, relationshipType } = request.data;

      if (!userId || !userProfile || !partnerProfile) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Missing required parameters."
        );
      }

      // Format names for the ID: jeanai_roberts-ferdie_smith
      const formatName = (first: string, last: string) =>
        `${first.trim().toLowerCase().replace(/\s+/g, "_")}_${last
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "_")}`;

      const connectionId = `${formatName(
        userProfile.firstName,
        userProfile.lastName
      )}-${formatName(partnerProfile.firstName, partnerProfile.lastName)}`;

      const ref = db
        .collection("users")
        .doc(userId)
        .collection("connections")
        .doc(connectionId);

      const connectionData = {
        userName: userProfile.firstName,
        partnerName: partnerProfile.firstName,
        userSun: userProfile.sun,
        userMoon: userProfile.moon,
        userRising: userProfile.rising,
        partnerSun: partnerProfile.sun,
        partnerMoon: partnerProfile.moon,
        partnerRising: partnerProfile.rising,
        relationshipType: relationshipType || "complicated",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const existingDoc = await ref.get();

      if (existingDoc.exists) {
        await ref.update(connectionData);
        console.log(`🔁 Updated existing connection: ${connectionId}`);
      } else {
        await ref.set({
          ...connectionData,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`🌟 Created new connection: ${connectionId}`);
      }

      return { success: true, connectionId };
    } catch (error) {
      console.error("❌ Error in upsertConnection:", error);
      throw new functions.https.HttpsError("internal", "Failed to upsert connection");
    }
  }
);

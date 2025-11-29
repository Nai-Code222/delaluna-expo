import * as functions from "firebase-functions";
import { db, admin } from "./initAdmin";
import * as logger from "firebase-functions/logger";

/* -------------------------------------------------
   🔮 TYPES
---------------------------------------------------*/
interface UserProfile {
  firstName: string;
  lastName: string;
  sun: string;
  moon: string;
  rising: string;
  pronouns?: string;
}

interface PartnerProfile {
  firstName: string;
  lastName: string;
  sun: string;
  moon: string;
  rising: string;
  pronouns?: string;
}

interface ConnectionInput {
  userId: string;
  userProfile: UserProfile;
  partnerProfile: PartnerProfile;
  relationshipType?: string;
}

/* -------------------------------------------------
   🪩 upsertConnection
---------------------------------------------------*/
export const upsertConnection = functions.https.onCall(
  async (request: functions.https.CallableRequest<ConnectionInput>) => {
    try {
      const { userId, userProfile, partnerProfile, relationshipType } = request.data;

      if (!userId || !userProfile || !partnerProfile) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Missing required parameters: userId, userProfile, partnerProfile"
        );
      }

      // 🧩 Generate connection ID (first_last-first_last)
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
        type: "compatibility",
        status: "pending",
        userFirstName: userProfile.firstName,
        userLastName: userProfile.lastName,
        partnerFirstName: partnerProfile.firstName,
        partnerLastName: partnerProfile.lastName,
        userSun: userProfile.sun,
        userMoon: userProfile.moon,
        userRising: userProfile.rising,
        userPronouns: userProfile.pronouns || null,
        partnerSun: partnerProfile.sun,
        partnerMoon: partnerProfile.moon,
        partnerRising: partnerProfile.rising,
        partnerPronouns: partnerProfile.pronouns || null,
        relationshipType: relationshipType || "complicated",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // 🧠 Check for existing connection
      const existingDoc = await ref.get();
      if (existingDoc.exists) {
        const existingData = existingDoc.data();
        const hasChanges = JSON.stringify(existingData) !== JSON.stringify(connectionData);

        if (!hasChanges) {
          logger.info(`⚠️ No changes detected for connection ${connectionId}`);
          return { success: true, connectionId, partner: partnerProfile };
        }

        await ref.update(connectionData);
        logger.info(`🔁 Updated existing connection: ${connectionId}`);
      } else {
        await ref.set({
          ...connectionData,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        logger.info(`🌟 Created new connection: ${connectionId}`);
      }

      // ✅ Return only partner’s signs to the frontend
      return {
        success: true,
        connectionId,
        partner: {
          sun: partnerProfile.sun,
          moon: partnerProfile.moon,
          rising: partnerProfile.rising,
          pronouns: partnerProfile.pronouns || null,
        },
      };
    } catch (error: any) {
      logger.error("❌ Error in upsertConnection:", error);
      throw new functions.https.HttpsError(
        "internal",
        error.message || "Failed to upsert connection"
      );
    }
  }
);

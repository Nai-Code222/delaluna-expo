// functions/src/getConnection.ts
import { onCall } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { buildCompatibilityPrompt } from "./utils/buildCompatibilityPrompt";
import { calculateSignsInternal } from "./utils/calcSigns";

export const getConnection = onCall(async (req) => {
  const db = getFirestore();
  const { userId, connectionId, isMe, relationshipType, firstPerson, secondPerson } = req.data;
  console.log("req.data: ", req.data);

  try {
    if (!userId || !firstPerson || !secondPerson)
      throw new Error("Missing required fields");

    const userPerson = firstPerson;
    const partnerPerson = secondPerson;

    // 🧩 STEP 2: Build Gemini prompt
    const prompt = buildCompatibilityPrompt({
      userSun: userPerson["Sun Sign"],
      userMoon: userPerson["Moon Sign"],
      userRising: userPerson["Rising Sign"],
      userPronouns: userPerson["Pronouns"],
      partnerSun: partnerPerson["Sun Sign"],
      partnerMoon: partnerPerson["Moon Sign"],
      partnerRising: partnerPerson["Rising Sign"],
      partnerPronouns: partnerPerson["Pronouns"],
      relationshipType,
    });

    // STEP 3: Combined document structure
    const connectionData = {
      connectionId,
      relationshipType: relationshipType || "consistent",
      type: "compatibility",
      status: { state: "pending" },
      prompt,
      firstPerson: {
        firstName: userPerson["First Name"],
        lastName: userPerson["Last Name"],
        sun: userPerson["Sun Sign"],
        moon: userPerson["Moon Sign"],
        rising: userPerson["Rising Sign"],
        pronouns: userPerson["Pronouns"] || null,
      },
      secondPerson: {
        firstName: partnerPerson["First Name"],
        lastName: partnerPerson["Last Name"],
        sun: partnerPerson["Sun Sign"],
        moon: partnerPerson["Moon Sign"],
        rising: partnerPerson["Rising Sign"],
        pronouns: partnerPerson["Pronouns"] || null,
      },
      updatedAt: FieldValue.serverTimestamp(),
    };

    // 🧩 STEP 4: Write or update connection (merge instead of overwrite)
    const ref = db.doc(`users/${userId}/connections/${connectionId}`);
    const snap = await ref.get();

    if (!snap.exists) {
      await ref.set(
        {
          ...connectionData,
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      logger.info(`🌟 Created new connection: ${connectionId}`);
    } else {
      await ref.set(connectionData, { merge: true });
      logger.info(`🔁 Updated existing connection: ${connectionId}`);
    }

    // 🪩 STEP 5: Return safe info to frontend
    return {
      success: true,
      connectionId,
      message: "Signs verified and connection ready for Gemini",
      userSigns: {
        sun: userPerson["Sun Sign"],
        moon: userPerson["Moon Sign"],
        rising: userPerson["Rising Sign"],
      },
      partnerSigns: {
        sun: partnerPerson["Sun Sign"],
        moon: partnerPerson["Moon Sign"],
        rising: partnerPerson["Rising Sign"],
      },
    };
  } catch (err: any) {
    logger.error("❌ Error in getConnection:", err);
    throw new Error(err.message || "Failed to create or update connection");
  }
});

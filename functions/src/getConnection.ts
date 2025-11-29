// functions/src/getConnection.ts
import { onCall } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { buildCompatibilityPrompt } from "./utils/buildCompatibilityPrompt";
import { calculateSignsInternal } from "./utils/calcSigns";

export const getConnection = onCall(async (req) => {
  const db = getFirestore();
  const { userId, isMe, relationshipType, firstPerson, secondPerson } = req.data;

  try {
    if (!userId || !firstPerson || !secondPerson)
      throw new Error("Missing required fields");

    const formatName = (first: string, last: string) =>
      `${first.trim().toLowerCase().replace(/\s+/g, "_")}_${last
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_")}`;

    const connectionId = `${formatName(
      firstPerson["First Name"],
      firstPerson["Last Name"]
    )}-${formatName(secondPerson["First Name"], secondPerson["Last Name"])}`;

    // 🧩 STEP 1: Ensure both people have signs
    const ensureSigns = async (p: Record<string, any>) => {
      const hasSigns =
        p["Sun Sign"] && p["Moon Sign"] && p["Rising Sign"];
      if (hasSigns) return p;

      const { day, month, year, hour, min, lat, lon, tzone } = p;
      if (!day || !month || !year || lat === undefined || lon === undefined)
        throw new Error(`Incomplete birth data for ${p["First Name"]}`);

      const signs = await calculateSignsInternal({
        day: Number(day),
        month: Number(month),
        year: Number(year),
        hour: Number(hour) || 12,
        min: Number(min) || 0,
        lat: Number(lat),
        lon: Number(lon),
        tzone: Number(tzone) || -5,
      });

      return {
        ...p,
        "Sun Sign": signs.raw.sun.sign,
        "Moon Sign": signs.raw.moon.sign,
        "Rising Sign": signs.raw.ascendant.sign,
      };
    };

    const userPerson = await ensureSigns(firstPerson);
    const partnerPerson = await ensureSigns(secondPerson);

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

    // 🧾 STEP 3: Combined document structure
    const connectionData = {
      connectionId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      relationshipType: relationshipType || "consistent",
      type: "compatibility",
      status: { state: "pending", type: "compatibility" },
      prompt,
      firstPerson: {
        firstName: userPerson["First Name"],
        lastName: userPerson["Last Name"],
        sun: userPerson["Sun Sign"],
        moon: userPerson["Moon Sign"],
        rising: userPerson["Rising Sign"],
      },
      secondPerson: {
        firstName: partnerPerson["First Name"],
        lastName: partnerPerson["Last Name"],
        sun: partnerPerson["Sun Sign"],
        moon: partnerPerson["Moon Sign"],
        rising: partnerPerson["Rising Sign"],
      },
    };

    // 🧩 STEP 4: Write or update connection
    const ref = db.doc(`users/${userId}/connections/${connectionId}`);
    const snap = await ref.get();

    if (snap.exists) {
      await ref.update(connectionData);
      logger.info(`🔁 Updated existing connection: ${connectionId}`);
    } else {
      await ref.set(connectionData);
      logger.info(`🌟 Created new connection: ${connectionId}`);
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

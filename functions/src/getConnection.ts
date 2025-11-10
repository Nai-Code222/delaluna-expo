import { onCall, CallableRequest } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import * as admin from "firebase-admin";

const db = admin.firestore();

interface PersonInput {
  firstName: string;
  lastName: string;
  day: number;
  month: number;
  year: number;
  hour: number;
  min: number;
  lat: number;
  lon: number;
  tzone: number;
}

interface GetConnectionRequest {
  userId: string;
  isMe: boolean;
  relationshipType: "consistent" | "it’s complicated" | "toxic";
  firstPerson: PersonInput;
  secondPerson: PersonInput;
}

export const getConnection = onCall(
  async (request: CallableRequest<GetConnectionRequest>) => {
    try {
      const { userId, firstPerson, secondPerson, relationshipType } =
        request.data;

      if (!userId) throw new Error("Missing userId");

      const normalize = (s: string) =>
        (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

      const firstKey = `${normalize(firstPerson.firstName)}_${normalize(firstPerson.lastName)}`;
      const secondKey = `${normalize(secondPerson.firstName)}_${normalize(secondPerson.lastName)}`;

      // 💡 Deterministic ID, alphabetical to avoid duplicates both ways
      const connectionId = [firstKey, secondKey].sort().join("-");

      const ref = db.doc(`users/${userId}/connections/${connectionId}`);

      // 🔍 Check if it already exists
      const existingSnap = await ref.get();
      if (existingSnap.exists) {
        const existing = existingSnap.data();
        console.log(`⚠️ Connection already exists → ${connectionId}`);
        return {
          connectionId,
          success: true,
          message: "Existing connection found",
          existing,
        };
      }

      // 🧩 Build new connection doc
      const connectionDoc = {
        type: "compatibility",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        status: "pending",
        relationshipType,
        firstPerson,
        secondPerson,
        prompt: null,
        response: null,
        result: null,
      };

      // 📝 Create the new connection doc safely
      await ref.set(connectionDoc, { merge: true });

      console.log(`✅ Connection created → ${connectionId}`);

      return {
        connectionId,
        success: true,
        message: "Connection created successfully",
      };
    } catch (error: any) {
      console.error("❌ Error in getConnection:", error);
      throw new Error(
        error.message || "Failed to create or update connection"
      );
    }
  }
);

// app/services/connection.service.ts
import {
  collection,
  doc,
  getDocs,
  deleteDoc,
  getFirestore,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { app, functions } from "../../firebaseConfig";

const db = getFirestore(app);

/* -------------------------------------------------
   🔮 CALLABLE FUNCTIONS (from Cloud Functions)
--------------------------------------------------- */

/**
 * Create or update a connection using Cloud Function
 * → This ensures Gemini triggers properly and IDs are consistent
 */
export async function upsertConnection(data: {
  userId: string;
  userProfile: {
    firstName: string;
    lastName: string;
    sun: string;
    moon: string;
    rising: string;
  };
  partnerProfile: {
    firstName: string;
    lastName: string;
    sun: string;
    moon: string;
    rising: string;
  };
  relationshipType?: string;
}) {
  const callable = httpsCallable(functions, "upsertConnection");
  const res = await callable(data);
  return res.data as {
    success: boolean;
    connectionId: string;
    partner: { sun: string; moon: string; rising: string };
  };
}

/**
 * Delete a connection using Cloud Function
 */
export async function deleteConnection(data: { userId: string; connectionId: string }) {
  const callable = httpsCallable(functions, "deleteConnection");
  const res = await callable(data);
  return res.data as { success: boolean; connectionId: string };
}

/* -------------------------------------------------
   🧩 LOCAL FIRESTORE HELPERS (read-only)
--------------------------------------------------- */

/**
 * Get all connections for a user (read-only)
 */
export async function getAllConnections(uid: string) {
  const connectionsRef = collection(db, "users", uid, "connections");
  const snapshot = await getDocs(connectionsRef);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Local-only delete (bypass Cloud Function)
 * – Only use for dev cleanup or test mode
 */
export async function deleteConnectionLocal(uid: string, connectionId: string) {
  const connectionRef = doc(db, "users", uid, "connections", connectionId);
  await deleteDoc(connectionRef);
  console.log("🗑️ Locally deleted:", connectionId);
}

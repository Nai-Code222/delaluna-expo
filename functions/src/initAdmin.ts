// functions/src/initAdmin.ts
import * as admin from "firebase-admin";
import { logger } from "firebase-functions/v2";

// --------------------------------------------------
// 🔥 Initialize Admin SDK (Safe, Idempotent)
// --------------------------------------------------
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });

  logger.info("🔥 Firebase Admin initialized (initAdmin.ts)");
}

// --------------------------------------------------
// 🗄️ Firestore Export
// --------------------------------------------------
export const db = admin.firestore();

// --------------------------------------------------
// 🔧 Firestore Reliability Setting
// --------------------------------------------------
db.settings({ ignoreUndefinedProperties: true });

export { admin };

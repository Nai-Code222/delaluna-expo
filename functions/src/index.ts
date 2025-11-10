/**
 * 🪩 Delaluna Cloud Functions Entry Point
 * Ensures Firebase Admin is initialized first
 * Then exports all callable and trigger-based functions.
 */

import * as admin from "firebase-admin";
import { setGlobalOptions } from "firebase-functions";


// ✅ Initialize Admin SDK safely before anything else
if (!admin.apps.length) {
  admin.initializeApp();
  console.log("🔥 Firebase Admin initialized (index.ts)");
}

// ✅ Global default settings for all deployed functions
setGlobalOptions({
  region: "us-central1",
  maxInstances: 10,
  timeoutSeconds: 60,
  memory: "256MiB",
});

// ✅ Export individual functions
export * from "./getSigns";
export * from "./getConnection";
export * from "./upsertConnection";
export * from "./onGeminiCompatibility";
export * from "./onGeminiResponse";

// Export deleteConnection explicitly
export { deleteConnection } from "./deleteConnection";

// ✅ Optional: direct exports for testing / Postman
export { getSigns, getSignsHttp } from "./getSigns";

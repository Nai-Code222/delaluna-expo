/**
 * 🪩 Delaluna Cloud Functions Entry Point
 * Ensures Firebase Admin is initialized before anything else.
 * Then re-exports all callable and trigger-based functions.
 */

import * as admin from "firebase-admin";
import { setGlobalOptions } from "firebase-functions";
import * as logger from "firebase-functions/logger";

/* -------------------------------------------------
   🔥 Initialize Firebase Admin SDK
---------------------------------------------------*/
if (!admin.apps.length) {
  admin.initializeApp();
  logger.info("🔥 Firebase Admin initialized (index.ts)");
}

/* -------------------------------------------------
   ⚙️ Global Runtime Configuration
---------------------------------------------------*/
setGlobalOptions({
  region: "us-central1",
  maxInstances: 10,
  timeoutSeconds: 60,
  memory: "256MiB",
});

/* -------------------------------------------------
   📦 Function Exports
---------------------------------------------------*/

// 🌞 Core Astrology
export * from "./getSigns";

// 💫 Compatibility & Connections
export * from "./getConnection";
export * from "./deleteConnection";

// 🪄 Gemini AI Handlers
export * from "./onGeminiCompatibility";
export * from "./onGeminiResponse";

// 🌐 Optional HTTP endpoints for Postman testing
export { getSigns, getSignsHttp } from "./getSigns";

/* -------------------------------------------------
   🧭 Notes:
   - Admin is initialized *once* globally.
   - All functions inherit region/timeouts from setGlobalOptions().
   - Each function file is fully modular, so deploys remain incremental.
---------------------------------------------------*/

/**
 * 🪩 Delaluna Cloud Functions Entry Point
 * Ensures Firebase Admin is initialized before anything else.
 * Then re-exports all callable and trigger-based functions.
 */

// --------------------------------------------------
// MUST run initAdmin FIRST — side-effect import
// --------------------------------------------------
import "./initAdmin";

import { logger } from "firebase-functions/v2";
import { setGlobalOptions } from "firebase-functions";
import * as functions from "firebase-functions";

/* -------------------------------------------------
   🚀 Functions Version
---------------------------------------------------*/
const FUNCTION_VERSION = "2025.01.06";
const LOG_CONTEXT = { component: "index" };
logger.info(`🚀 Functions version loaded: ${FUNCTION_VERSION}`, LOG_CONTEXT);

/* -------------------------------------------------
   ⚙️ Global Runtime Configuration
---------------------------------------------------*/
setGlobalOptions({
  region: "us-central1",
  maxInstances: 10,
  timeoutSeconds: 60,
  memory: "256MiB",
  minInstances: 0,
});

/* -------------------------------------------------
   ❤️ Health Check Endpoint
---------------------------------------------------*/
export const health = functions.https.onRequest((req, res) => {
  res.status(200).json({
    status: "ok",
    version: FUNCTION_VERSION,
    timestamp: Date.now(),
  });
});

/* -------------------------------------------------
   📦 Function Exports
---------------------------------------------------*/

// 🌞 Core Astrology
export * from "./utils/getSigns";
export * from "./finishUserSignup";

// 💫 Compatibility & Connections
export * from "./callables/getConnection";
export * from "./callables/deleteConnection";

// 🪄 Gemini AI Handlers
export * from "./onGeminiCompatibility";
export * from "./onGeminiResponse";

// 🌙 Birth Chart Generation
export * from "./triggers/generateBirthChart";

// 🌐 Optional HTTP endpoints for Postman testing
export { getSigns, getSignsHttp } from "./utils/getSigns";

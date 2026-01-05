import * as functions from "firebase-functions/v1";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { buildBirthChartPrompt } from "./prompts/natalChart.prompt";
import { FieldValue } from "firebase-admin/firestore";

type GenerateBirthChartRequest = {
  force?: boolean;
};

type GenerateBirthChartResponse = {
  ok: boolean;
  started: boolean;
  message?: string;
  docPath?: string;
};

// Ensure Firebase Admin is initialized only once
if (!admin.apps.length) {
  admin.initializeApp();
}

const now = () => FieldValue.serverTimestamp();

function getApiKey() {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    ""
  );
}

/**
 * Best-effort extractor: removes ``` fences and returns a clean <svg>...</svg>
 */
function extractSvg(raw: string): string {
  if (!raw) return "";

  let t = raw.trim();

  // Remove markdown fences if present
  // ```svg ... ```
  t = t.replace(/^```svg\s*/i, "");
  t = t.replace(/^```\s*/i, "");
  t = t.replace(/```$/i, "");
  t = t.trim();

  // Some models prepend text like "Here is the SVG:"
  const svgStart = t.indexOf("<svg");
  if (svgStart > 0) t = t.slice(svgStart);

  // Ensure we only keep through closing tag if extra text trails
  const svgEnd = t.lastIndexOf("</svg>");
  if (svgEnd !== -1) t = t.slice(0, svgEnd + "</svg>".length);

  // Basic sanity
  if (!t.startsWith("<svg")) return "";

  return t;
}

/**
 * Upload SVG text to Storage and return URL + metadata.
 */
async function uploadSvgToStorage(opts: {
  uid: string;
  svg: string;
}) {
  const { uid, svg } = opts;

  // Your bucket:
  const bucketName = "delaluna-answers.firebasestorage.app";
  const bucket = admin.storage().bucket(bucketName);

  const storagePath = `user-birth-charts/${uid}/birthChart.svg`;
  const file = bucket.file(storagePath);

  const buffer = Buffer.from(svg, "utf8");

  await file.save(buffer, {
    contentType: "image/svg+xml",
    resumable: false,
    metadata: {
      cacheControl: "public, max-age=31536000",
    },
  });

  // Long-lived signed URL (simple + reliable)
  const [downloadUrl] = await file.getSignedUrl({
    action: "read",
    expires: "2100-01-01",
  });

  return {
    storagePath,
    downloadUrl,
    contentType: "image/svg+xml",
    sizeBytes: buffer.byteLength,
  };
}

/**
 * Gemini text call using REST (no extra deps).
 * If you already use @google/generative-ai in functions, we can switch to it.
 */
async function geminiGenerateText(prompt: string): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY / GOOGLE_API_KEY");

  // gemini API endpoint (generative language)
  // Using Gemini "generateContent" REST.
  // NOTE: Works in prod; emulator requires network access.
  const model = "gemini-2.5-flash";
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: 8192,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Gemini API error: ${res.status} ${errText}`);
  }

  const json: any = await res.json();
  const text =
    json?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";

  return text;
}

/**
 * Free + Premium interpretation prompts (simple v1)
 */
function buildFreeInterpretationPrompt(natalChart: any) {
  return `
You are Delaluna — modern astrologer + best friend. 
Write a SHORT, free birth chart interpretation (6-10 sentences max).
Focus on Big Three + one strong theme, no fluff.

Natal chart JSON:
${JSON.stringify(natalChart, null, 2)}

Return plain text only.
`.trim();
}

function buildPremiumInterpretationPrompt(natalChart: any) {
  return `
You are Delaluna — modern astrologer + best friend.
Write a PREMIUM, in-depth interpretation (structured + detailed).
Include:
- Big Three deep dive (Sun/Moon/Rising)
- Love + career themes
- Shadow patterns + growth advice
- “If you’re feeling stuck…” section
Keep it specific, confident, not generic.
No markdown headers, but you can use short labeled paragraphs.

Natal chart JSON:
${JSON.stringify(natalChart, null, 2)}

Return plain text only.
`.trim();
}

export const generateBirthChart = functions
  .region("us-central1")
  .https.onCall(
    async (
      data: GenerateBirthChartRequest,
      context: { auth?: { uid?: string } }
    ): Promise<GenerateBirthChartResponse> => {
      const uid: string | undefined = context.auth?.uid;
      if (!uid) {
        throw new functions.https.HttpsError("unauthenticated", "Must be logged in.");
      }

      const force = !!data?.force;

      const db = admin.firestore();
      const birthChartRef: admin.firestore.DocumentReference = db.doc(`users/${uid}/birthChart/default`);

      // If already processing and not forced, bail
      const existing: admin.firestore.DocumentSnapshot = await birthChartRef.get();
      const existingState = existing.exists ? existing.data()?.status?.state : null;
      const existingAttempts = existing.exists ? existing.data()?.status?.attempts ?? 0 : 0;
      const nextAttempts = existingAttempts + 1;

      if ((existingState === "processing" || existingState === "complete") && !force) {
        return {
          ok: true,
          started: false,
          message: existingState === "processing" ? "Birth chart already processing." : "Birth chart already complete.",
          docPath: birthChartRef.path,
        };
      }

      if (existingState === "error" && nextAttempts > 3 && !force) {
        return {
          ok: true,
          started: false,
          message: "Maximum retry attempts exceeded for birth chart generation.",
          docPath: birthChartRef.path,
        };
      }

      // Load natal chart from user document
      const userSnap: admin.firestore.DocumentSnapshot = await db.doc(`users/${uid}`).get();
      if (!userSnap.exists) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "User document not found at users/{uid}."
        );
      }
      const natalChart = userSnap.data()?.natalChart;
      if (!natalChart) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Natal chart not found in user document."
        );
      }

      logger.info("generateBirthChart start", { uid, force, attempts: nextAttempts });

      // Mark processing
      await birthChartRef.set(
        {
          status: {
            state: "processing",
            step: "svg",
            updatedAt: now(),
            attempts: nextAttempts,
          },
          source: {
            natalChartDocPath: `users/${uid}`,
            generatedFrom: "callable:generateBirthChart",
            model: "gemini-2.5-flash",
          },
          requestedAt: now(),
          error: FieldValue.delete(),
        },
        { merge: true }
      );

      try {
        // 1) Generate SVG chart
        const svgPrompt = buildBirthChartPrompt(natalChart as any);
        const svgRaw = await geminiGenerateText(svgPrompt);
        const svg = extractSvg(svgRaw);

        if (!svg) {
          throw new Error("SVG extraction failed (model did not return valid <svg>...</svg>).");
        }

        const svgUpload = await uploadSvgToStorage({ uid, svg });

        await birthChartRef.set(
          {
            status: {
              state: "processing",
              step: "free",
              updatedAt: now(),
              attempts: nextAttempts,
            },
            svg: svgUpload,
          },
          { merge: true }
        );

        // 2) Free interpretation
        const freeTextRaw = await geminiGenerateText(buildFreeInterpretationPrompt(natalChart));
        const freeText = freeTextRaw.trim();

        await birthChartRef.set(
          {
            status: {
              state: "processing",
              step: "premium",
              updatedAt: now(),
              attempts: nextAttempts,
            },
            free: {
              text: freeText,
              createdAt: now(),
            },
          },
          { merge: true }
        );

        // 3) Premium interpretation
        const premiumTextRaw = await geminiGenerateText(buildPremiumInterpretationPrompt(natalChart));
        const premiumText = premiumTextRaw.trim();

        await birthChartRef.set(
          {
            status: {
              state: "complete",
              step: "done",
              updatedAt: now(),
              attempts: nextAttempts,
            },
            premium: {
              text: premiumText,
              createdAt: now(),
            },
            // for now: you said generate both in v1
            premiumUnlocked: false,
            completedAt: now(),
          },
          { merge: true }
        );

        logger.info("generateBirthChart complete", { uid });

        return {
          ok: true,
          started: true,
          message: "Birth chart generated.",
          docPath: birthChartRef.path,
        };
      } catch (e: any) {
        logger.error("generateBirthChart failed", { uid, error: String(e?.message ?? e) });

        await birthChartRef.set(
          {
            status: {
              state: "error",
              updatedAt: now(),
              attempts: nextAttempts,
            },
            error: {
              message: String(e?.message ?? e),
              code: e?.code ? String(e.code) : "unknown",
            },
          },
          { merge: true }
        );

        throw new functions.https.HttpsError(
          "internal",
          "Birth chart generation failed. Check logs for details."
        );
      }
    }
  );
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { getFirestore } from "firebase-admin/firestore";
import { buildBirthChartPlacementPrompt } from "../prompts/buildBirthChartPlacementPrompt";
import { z } from "zod";
import { getMessaging } from "firebase-admin/messaging";

const PlacementOutputSchema = z.object({
  placements: z.record(z.string(), z.any()).optional(),
  summary: z.string().optional(),
});

/**
 * Step 2 — Extract Placements
 *
 * This listens to users/{uid}/birthChart/default
 * When the chart image is first written, this function:
 * 1. Creates a task in users/{uid}/birthChart/tasks/{taskId}
 * 2. The multimodal extension reads this task → runs Gemini
 * 3. When the extension writes `output`, this function saves it
 */
export const generateBirthChartPlacements = onDocumentUpdated(
  {
    region: "us-central1",
    document: "users/{uid}/birthChart/default",
  },
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    const { uid } = event.params;

    const db = getFirestore();
    const userChartRef = event.data?.after?.ref;
    if (!userChartRef) {
      logger.error("Missing userChartRef – cannot update birth chart document.");
      return;
    }

    // ------------------------------------------------------------
    // 1. RUN ONLY ON FIRST CHART IMAGE APPEARANCE
    // ------------------------------------------------------------
    const prevImage = before?.chartImageUrl;
    const newImage = after?.chartImageUrl;

    const isFirstImage = !prevImage && newImage;

    if (!isFirstImage) {
      logger.info("No new birth chart image — skipping placements.");
      return;
    }

    logger.info("Birth chart image detected — generating placements.", { uid });

    // ------------------------------------------------------------
    // 2. CREATE TASK DOCUMENT FOR MULTIMODAL EXTENSION
    // ------------------------------------------------------------
    const taskPrompt = buildBirthChartPlacementPrompt({ chartImageUrl: newImage });

    const taskRef = db.collection(`users/${uid}/birthChart/tasks`).doc();
    const taskId = taskRef.id;

    await taskRef.set({
      prompt: taskPrompt,      // extension will inject into {{ prompt }}
      imageUrl: newImage,      // extension will use for multimodal input
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    logger.info("Placement extraction task created", {
      uid,
      taskId,
    });

    // ------------------------------------------------------------
    // 3. WAIT FOR EXTENSION TO WRITE `output`
    // ------------------------------------------------------------

    // Small delay — helps avoid race condition
    await new Promise((r) => setTimeout(r, 300));

    // Poll extension result
    let output: unknown = null;
    let lastError: string | null = null;
    for (let i = 0; i < 20; i++) {
      const snap = await taskRef.get();
      const data = snap.data();

      if (data?.output) {
        output = data.output;
        break;
      }
      if (data?.error) {
        lastError = data.error;
      }

      await new Promise((r) => setTimeout(r, 500));
    }

    if (!output) {
      const errMsg = lastError ?? "No placements returned from Gemini";
      logger.error("Extension did not return output", { uid, taskId, errMsg });

      await userChartRef.update({
        status: "error",
        error: errMsg,
      });

      try {
        await getMessaging().send({
          topic: uid,
          notification: {
            title: "Birth Chart Error",
            body: "We couldn't generate your birth chart placements. Tap to retry.",
          },
          data: { type: "birthchart_error" },
        });
      } catch {}

      return;
    }

    logger.info("Placements extracted successfully.", { uid });

    // ------------------------------------------------------------
    // 4. SAVE FINAL PLACEMENTS INTO MAIN DOC
    // ------------------------------------------------------------
    let parsed;
    try {
      parsed = PlacementOutputSchema.parse(output);
    } catch (e) {
      logger.error("Placement output failed schema validation", { error: e });
      await userChartRef.update({
        status: "error",
        error: "Invalid placement format from Gemini",
      });
      return;
    }

    await userChartRef.update({
      placements: parsed.placements ?? null,
      summary: parsed.summary ?? null,
      placementsGeneratedAt: new Date().toISOString(),
      status: "placements_ready",
    });

    try {
      await getMessaging().send({
        topic: uid,
        notification: {
          title: "Your Birth Chart Is Ready ✨",
          body: "Your chart placements have been generated. Tap to view.",
        },
        data: { type: "birthchart_ready" },
      });
    } catch {}

    // ------------------------------------------------------------
    // 5. OPTIONAL: CLEAN UP TASK DOC
    // ------------------------------------------------------------
    await taskRef.delete().catch(() => {});

    logger.info("Birth chart placements saved + task cleaned.", {
      uid,
      taskId,
    });
  }
);
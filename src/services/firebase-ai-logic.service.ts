// src/services/firebase-ai.service.ts

import { app } from "../../firebaseConfig";
import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
  ResponseModality,
} from "firebase/ai";

// Initialize the Gemini API backend
const ai = getAI(app, {
  backend: new GoogleAIBackend(),
});

/** ⭐ General text-only model (fast) */
export const geminiTextModel = getGenerativeModel(ai, {
  model: "gemini-2.5-flash",
});

/** ⭐ Text + Image model (for birth chart images) */
export const geminiImageModel = getGenerativeModel(ai, {
  model: "gemini-2.5-flash-image",
  generationConfig: {
    responseModalities: [ResponseModality.TEXT, ResponseModality.IMAGE],
  },
});

/** Generic generate helper */
export async function generateGemini(model: any, prompt: string) {
  try {
    const result = await model.generateContent(prompt);
    const r = result.response;

    const text = r.text();
    const imagePart = r.inlineDataParts()?.[0]?.inlineData;

    return {
      text,
      imageBase64: imagePart?.data ?? null,
      mimeType: imagePart?.mimeType ?? null,
    };
  } catch (err) {
    console.error("❌ Gemini generation failed:", err);
    throw err;
  }
}
// src/services/firebase-ai.service.ts

import { app } from "../../firebaseConfig";
import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
  ResponseModality,
} from "firebase/ai";

import {
  getStorage,
  ref as storageRef,
  uploadString,
  getDownloadURL,
} from "firebase/storage";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

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

/**
 * 🔮 Generate + Save Birth Chart (Image + Interpretation)
 * Uses Gemini Image model
 * Saves image to: gs://delaluna-answers-birth-charts/birth-charts/{uid}/natal.png
 * Saves Firestore doc to: users/{uid}/birthChart/default
 */
export async function generateAndSaveBirthChart(
  uid: string,
  prompt: string
) {
  if (!uid) throw new Error("Missing uid");
  if (!prompt) throw new Error("Missing prompt");

  // 1️⃣ Generate with Gemini
  const { text, imageBase64, mimeType } = await generateGemini(
    geminiImageModel,
    prompt
  );

  if (!imageBase64) {
    throw new Error("Gemini did not return an image");
  }

  // 2️⃣ Upload image to custom bucket
  const storage = getStorage(
    undefined,
    "gs://delaluna-answers-birth-charts"
  );

  const imageRef = storageRef(
    storage,
    `birth-charts/${uid}/natal.png`
  );

  await uploadString(imageRef, imageBase64, "base64", {
    contentType: mimeType ?? "image/png",
  });

  const imageUrl = await getDownloadURL(imageRef);

  // 3️⃣ Save Firestore document
  const db = getFirestore();

  await setDoc(
    doc(db, "users", uid, "birthChart", "default"),
    {
      interpretation: text,
      imageUrl,
      status: "complete",
      generatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return {
    interpretation: text,
    imageUrl,
  };
}
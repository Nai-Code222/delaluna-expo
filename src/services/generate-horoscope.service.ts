// src/services/generate-horoscope.service.ts

import { doc, setDoc, getFirestore } from "firebase/firestore";
import { buildHoroscopePrompt } from "../../functions/src/prompts/buildHoroscopePrompt";
import { TarotDrawResult } from "@/types/tarot-cards.type";

export async function generateHoroscopes(
  userId: string,
  userRising: string,
  userSun: string,
  userMoon: string,
  cards: TarotDrawResult
) {
  if (!userId) throw new Error("Missing userId");
  if (!cards) throw new Error("Missing tarot cards");

  const entries = [
    cards.yesterday,
    cards.today,
    cards.tomorrow,
  ];

  for (const pack of entries) {
    await generateHoroscope(
      userId,
      pack.date,
      userRising,
      userSun,
      userMoon,
      pack.keywordString,
      pack.meaningString
    );
  }

  return entries;
}

/**
 * Creates (or updates) a daily horoscope scaffold for Gemini processing.
 * Writes to: users/{userId}/horoscope/{date}
 */
export async function generateHoroscope(
  userId: string,
  date: string,
  userRising: string,
  userSun: string,
  userMoon: string,
  tarotCardKeywords: string,
  tarotCardMeanings: string,
 
) {
  

  if (!userId) throw new Error("Missing userId");
  if (!date) throw new Error("Missing date");

  const db = getFirestore();

  // Build horoscope prompt
  const horoscopePrompt = buildHoroscopePrompt({
    date,
    userRising,
    userSun,
    userMoon,
    tarotCardKeywords: tarotCardKeywords,
    tarotCardMeanings: tarotCardMeanings,
  });
  
  // Create / update horoscope document
  const horoscopeRef = doc(db, "users", userId, "horoscope", date);

  await setDoc(
    horoscopeRef,
    {
      date,
      status: "pending",
      prompt: horoscopePrompt,
      createdAt: Date.now(),
    },
    { merge: true }
  );
}
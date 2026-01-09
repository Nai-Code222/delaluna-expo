// src/services/tarotCardDraw.service.ts

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { DrawnTarotCardSchema } from "../schemas/drawnTarotCard.schema";
import { TAROT_CARDS } from "@/data/tarotCards.registry";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import type { DrawnTarotCard } from "@/types/tarot-cards.type";
import { DailyCardPack, DailyCardPackSchema } from "@/schemas/dailyCardPack.schema";
import { DateTime } from "luxon";
import getTimezone from '@/utils/get-current-timezone.util';


dayjs.extend(utc);
dayjs.extend(timezone);

function createSeededRng(seed: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }

  return function () {
    // Mulberry32
    h += 0x6D2B79F5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleDeck<T>(deck: T[], seed: string): T[] {
  const shuffled = [...deck];
  const rand = createSeededRng(seed);

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

function drawDailySpread(userId: string, date: string, count: number): DrawnTarotCard[] {
  const seed = `${userId}_${date}`;
  const shuffledDeck = shuffleDeck(TAROT_CARDS, seed);
  const rand = createSeededRng(seed + "_rev");

  return shuffledDeck.slice(0, count).map(card => {
    const reversed = rand() < (card.reversalProbability ?? 0.35);

    return DrawnTarotCardSchema.parse({
      id: card.id,
      name: card.name,
      imagePath: card.imagePath,
      reversed,
      keywords: reversed ? card.keywordsReversed : card.keywordsUpright,
      meaning: reversed ? card.meaningReversed : card.meaningUpright,
    });
  });
}

function buildTarotJSON(cards: DrawnTarotCard[]): string {
  return JSON.stringify(
    cards.map(c => ({
      name: c.name,
      reversed: c.reversed,
      keywords: c.keywords,
      meaning: c.meaning
    })),
    null,
    2
  );
}

function buildDailyCardPack(date: string, cards: DrawnTarotCard[]): DailyCardPack {
  const keywordList = cards.flatMap(c => c.keywords);
  const keywordString = keywordList.join(", ");
  const meaningString = cards.map(c => c.meaning).join(" ");

  const reversedCount = cards.filter(c => c.reversed).length;
  const uprightCount = cards.length - reversedCount;

  return DailyCardPackSchema.parse({
    date,
    cards,
    keywordList,
    keywordString,
    meaningString,
    tarotJSON: buildTarotJSON(cards),
    reversedCount,
    uprightCount,
    createdAt: Date.now()
  });
}

async function getOrCreateCardsForDate(
  userId: string,
  date: string,
  count: number
) {
  const db = getFirestore();

  const cardsRef = doc(db, "users", userId, "cards", date);
  const cardsSnap = await getDoc(cardsRef);

  // If tarot already exists, return it
  if (cardsSnap.exists()) {
    return DailyCardPackSchema.parse(cardsSnap.data());
  }

  // Create daily tarot pack
  const cards = drawDailySpread(userId, date, count);
  const pack = buildDailyCardPack(date, cards);

  await setDoc(cardsRef, pack);

  return pack;
}

export async function getTarotCardDraw(userId: string, cardDrawCount: number = 1) {
   

  const tz = dayjs.tz.guess();
  
  // Get current moment in the user's timezone
  const now = dayjs.tz(undefined, tz);

  const nowUtc = DateTime.utc();
  const timezone = getTimezone();

  

  console.log("🕐 Current time info:", {
    lastLoginDate: nowUtc.toFormat('MM/dd/yyyy hh:mm:ss a ZZZZ'),
  });

  // Clone 'now' for each operation to avoid mutation
  const yesterday = now.clone().subtract(1, "day").format("YYYY-MM-DD");
  const today = now.format("YYYY-MM-DD");
  const tomorrow = now.clone().add(1, "day").format("YYYY-MM-DD");

  console.log("📅 Generating tarot cards for:", { yesterday, today, tomorrow });

  return {
    yesterday: await getOrCreateCardsForDate(userId, yesterday, cardDrawCount),
    today: await getOrCreateCardsForDate(userId, today, cardDrawCount),
    tomorrow: await getOrCreateCardsForDate(userId, tomorrow, cardDrawCount),
  };
}
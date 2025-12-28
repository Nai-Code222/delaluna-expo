// src/services/tarotCardDraw.service.ts

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { DrawnTarotCardSchema } from "../schemas/drawnTarotCard.schema";
import { TAROT_CARDS } from "@/data/tarotCards.registry";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import type { DrawnTarotCard } from "@/types/tarot-cards.type";
import { DailyCardPack, DailyCardPackSchema } from "@/schemas/dailyCardPack.schema";


dayjs.extend(utc);
dayjs.extend(timezone);

function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  return (h >>> 0) / 4294967296;
}

function drawCard(userId: string, date: string) {
  const seed = `${userId}_${date}`;
  const rand = seededRandom(seed);
  const index = Math.floor(rand * TAROT_CARDS.length);
  const card = TAROT_CARDS[index];

  const reversedRand = seededRandom(seed + "_rev");
  const reversed = reversedRand < (card.reversalProbability ?? 0.35);

  const keywords = reversed
    ? card.keywordsReversed
    : card.keywordsUpright;

  const meaning = reversed ? card.meaningReversed : card.meaningUpright;

  const selected: DrawnTarotCard = {
    id: card.id,
    name: card.name,
    imagePath: card.imagePath,
    reversed,
    keywords,
    meaning,
  };

  return DrawnTarotCardSchema.parse(selected);
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

async function getOrCreateCardsForDate(userId: string, date: string, count: number) {
  const db = getFirestore();
  const ref = doc(db, "users", userId, "cards", date);
  const snap = await getDoc(ref);

  // If DailyCardPack already exists, return the FULL pack
  if (snap.exists()) {
    return DailyCardPackSchema.parse(snap.data());
  }

  // Otherwise: draw cards and build a FULL pack
  const cards = Array.from({ length: count }, () => drawCard(userId, date));
  const pack = buildDailyCardPack(date, cards);

  // Save the entire DailyCardPack (NOT just cards)
  await setDoc(ref, pack);

  return pack;
}

export async function getTarotCardDraw(userId: string, cardDrawCount: number = 1) {
  const tz = dayjs.tz.guess();
  const now = dayjs().tz(tz);

  const yesterday = now.subtract(1, "day").format("YYYY-MM-DD");
  const today = now.format("YYYY-MM-DD");
  const tomorrow = now.add(1, "day").format("YYYY-MM-DD");

  return {
    yesterday: await getOrCreateCardsForDate(userId, yesterday, cardDrawCount),
    today: await getOrCreateCardsForDate(userId, today, cardDrawCount),
    tomorrow: await getOrCreateCardsForDate(userId, tomorrow, cardDrawCount),
  };
}
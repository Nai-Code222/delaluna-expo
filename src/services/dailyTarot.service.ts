// src/services/dailyTarotDraw.ts

// TODO: REMOVE FILE

import { collection, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { z } from "zod";
import { DailyCardPackSchema } from "@/schemas/dailyCardPack.schema";

dayjs.extend(utc);
dayjs.extend(timezone);

const CARD_NUMBER_MAX = 133;
const CARD_NUMBER_MIN = 1;

const DailyTarotSchema = z.object({
  cardNumber: z.number().int().min(CARD_NUMBER_MIN).max(CARD_NUMBER_MAX),
  reversed: z.boolean(),
  date: z.string(), // YYYY-MM-DD
  timezone: z.string(),
  timestamp: z.number(),
});

/* 🔮 Random Helpers ------------------------------------------------- */
// 54 - 133
const randomCard = () =>
  Math.floor(Math.random() * (CARD_NUMBER_MAX - CARD_NUMBER_MIN + 1)) + CARD_NUMBER_MIN;

const isReversed = () =>
  Math.random() < 0.5;

const yesterday = () => {
  const tz = dayjs.tz.guess();
  return dayjs.tz(undefined, tz).subtract(1, "day").format("YYYY-MM-DD");
};

/* 🌙 Daily Tarot Draw ------------------------------------------------ */

function getYesterdayTodayTomorrowDates(): {
  yesterday: Date;
  today: Date;
  tomorrow: Date;
} {
  const today = new Date(); // Gets the current date and time

  // Create new Date objects for yesterday and tomorrow based on 'today'
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  return {
    yesterday,
    today,
    tomorrow,
  };
}

// TODO: Remove Unused METHOD
function generateDateList() {
  const tz = dayjs.tz.guess();
  const now = dayjs.tz(undefined, tz);

  // Clone 'now' for each operation to avoid mutation
  const yesterday = now.clone().subtract(1, "day").format("YYYY-MM-DD");
  const today = now.format("YYYY-MM-DD");
  const tomorrow = now.clone().add(1, "day").format("YYYY-MM-DD");

  const dates: string[] = [yesterday, today, tomorrow];
  return dates;
}

// TODO : Remove Unused METHOD
export async function getDailyCard(
  userId: string,
  cardDrawCount: number,
  userTimezone?: string,

): Promise<z.infer<typeof DailyTarotSchema> | null> {
  const ref = doc(db, "users", userId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  const data = snap.data();

  // 1. Determine timezone
  const tz = userTimezone || dayjs.tz.guess();
  const now = new Date();

  // 2. Format dates in that timezone (use clone to avoid mutation)
  const yesterday = now.clone().subtract(1, "day").format("YYYY-MM-DD");
  const today = now.format("YYYY-MM-DD");
  const tomorrow = now.clone().add(1, "day").format("YYYY-MM-DD");

  console.log("📅 Daily card dates:", { yesterday, today, tomorrow });

  // 3️ Reuse today's card if it already exists
  if (data.dailyTarot?.date === today) {
    const parsed = DailyTarotSchema.safeParse(data.dailyTarot);
    if (parsed.success) return parsed.data;
    console.warn("⚠️ Invalid cached daily tarot, regenerating");
  }

  // 4️. Create a new daily card
  const number = randomCard();
  const reversed = isReversed();

  const newCard = {
    cardNumber: number,
    reversed,
    date: today,
    timezone: tz,
    timestamp: Date.now(),
  };

  const validated = DailyTarotSchema.parse(newCard);

  // 5. Save to Firestore
  await updateDoc(ref, { dailyTarot: validated });

  return validated;
}
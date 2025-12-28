// src/utils/dailyTarotDraw.ts

import { collection, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { z } from "zod";

dayjs.extend(utc);
dayjs.extend(timezone);

const TOTAL_CARDS = 133;
const CARD_NUMBER_MAX = 133;
const CARD_NUMBER_MIN = 54;

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

const yesterday = () =>
  dayjs().subtract(1, "day").tz(dayjs.tz.guess()).format("YYYY-MM-DD");

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

export async function getDailyCard(
  userId: string,
  userTimezone?: string
): Promise<z.infer<typeof DailyTarotSchema> | null> {
  const ref = doc(db, "users", userId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  const data = snap.data();

  // 1️⃣ Determine timezone
  const tz = userTimezone || dayjs.tz.guess();

  // 2️⃣ Format today's date in that timezone
  const today = dayjs().tz(tz).format("YYYY-MM-DD");

  // 3️⃣ Reuse today's card if it already exists
  if (data.dailyTarot?.date === today) {
    const parsed = DailyTarotSchema.safeParse(data.dailyTarot);
    if (parsed.success) return parsed.data;
    console.warn("⚠️ Invalid cached daily tarot, regenerating");
  }

  // 4️⃣ Create a new daily card
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

  // 5️⃣ Save to Firestore
  await updateDoc(ref, { dailyTarot: validated });

  return validated;
}

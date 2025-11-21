import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const TOTAL_CARDS = 133;

/* 🔮 Random Helpers ------------------------------------------------- */
const randomCard = () =>
  Math.floor(Math.random() * TOTAL_CARDS) + 1;

const isReversed = () =>
  Math.random() < 0.5;

/* 🌙 Daily Tarot Draw ------------------------------------------------ */

export async function getDailyCard(userId: string, userTimezone?: string) {
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
    return data.dailyTarot;
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

  // 5️⃣ Save to Firestore
  await updateDoc(ref, { dailyTarot: newCard });

  return newCard;
}

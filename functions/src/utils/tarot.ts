import { FieldValue } from "firebase-admin/firestore";

// TODO: Remove file: Unused

const TAROT_DECK = [
  {
    id: "the_fool",
    name: "The Fool",
    imagePath: "tarot/the_fool.png",
    keywords: ["beginnings", "adventure", "innocence"],
    message: "A new journey is beginning for you. Take the leap."
  },
  {
    id: "the_high_priestess",
    name: "The High Priestess",
    imagePath: "tarot/the_high_priestess.png",
    keywords: ["intuition", "mystery", "inner wisdom"],
    message: "Trust the unknown. Your intuition is speaking loudly today."
  },
  // ... add full 78 cards
];

export function getDailyTarotCard(uid: string) {
  // Deterministic but random-ish: consistent for 24 hours
  const today = new Date().toISOString().slice(0, 10);
  const seed = uid.length + today.length;

  const index = seed % TAROT_DECK.length;
  const card = TAROT_DECK[index];

  return {
    cardId: card.id,
    cardName: card.name,
    imagePath: card.imagePath,
    keywords: card.keywords,
    message: card.message,
    upright: true,
    createdAt: FieldValue.serverTimestamp(),
  };
}

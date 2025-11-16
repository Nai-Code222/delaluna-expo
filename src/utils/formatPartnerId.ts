// utils/formatPartnerId.ts

/**
 * Builds a Firestore-safe partner ID from first and last name.
 */

export const formatPartnerId = (firstName: string, lastName: string): string => {
  const full = `${firstName || ""}-${lastName || ""}`;

  return full
    .normalize("NFD") // separates accent marks
    .replace(/[\u0300-\u036f]/g, "") // removes accents
    .replace(/[^a-zA-Z0-9- ]/g, "") // removes emojis, punctuation, quotes
    .trim()
    .replace(/\s+/g, "-") // replaces spaces with hyphens
    .toLowerCase();
};

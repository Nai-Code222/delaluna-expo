// app/components/utils/time.utils.ts

/**
 * Parse a 12-hour "hh:mm AM/PM" string into 24-hour hour/minute numbers.
 * If invalid or empty, returns noon (12:00).
 */
export defaultfunction parseBirthtime12h(birthtime?: string): { hour: number; minute: number } {
  let hour = 12;
  let minute = 0;

  if (birthtime && typeof birthtime === "string") {
    const [timePart, periodRaw] = birthtime.trim().split(" ");
    if (timePart) {
      const [hhRaw, mmRaw] = timePart.split(":");
      const hh = parseInt(hhRaw ?? "", 10);
      const mm = parseInt(mmRaw ?? "", 10);
      if (!Number.isNaN(hh)) hour = hh;
      if (!Number.isNaN(mm)) minute = mm;
    }

    const period = periodRaw?.toLowerCase();
    if (period === "pm" && hour < 12) hour += 12;
    if (period === "am" && hour === 12) hour = 0;
  }

  // clamp to valid ranges just in case
  hour = Math.min(23, Math.max(0, hour));
  minute = Math.min(59, Math.max(0, minute));

  return { hour, minute };
}

/**
 * Format 24-hour hour/minute into a 12-hour "hh:mm AM/PM" string.
 */
export function formatBirthtime12h(hour: number, minute: number): string {
  const safeH = Math.min(23, Math.max(0, Math.trunc(hour)));
  const safeM = Math.min(59, Math.max(0, Math.trunc(minute)));

  const period = safeH >= 12 ? "PM" : "AM";
  let displayHour = safeH % 12;
  if (displayHour === 0) displayHour = 12;

  const paddedMinute = safeM.toString().padStart(2, "0");
  return `${displayHour}:${paddedMinute} ${period}`;
}

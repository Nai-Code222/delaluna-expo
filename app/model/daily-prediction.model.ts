interface DailyPrediction {
  date: string;
  userSign: string;
  moonSign: string;
  transit: string;
  theme: string;
  toneMode: "chic" | "savage" | "soft" | "mystic";
  cardPull?: string;
  compatibility?: string[];
  header: string;
  mainMessage: string;
  guidance: string;
  closing: string;
}
export { DailyPrediction };
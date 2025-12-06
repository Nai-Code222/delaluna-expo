// buildBirthChartPrompt.ts
// -------------------------------------------------------------
// This file builds the exact prompt string used by the
// Firestore Multimodal GenAI Extension to generate
// a natal birth chart wheel image via Gemini.
// -------------------------------------------------------------
//
// IMPORTANT:
// - Field names must match Firestore doc fields EXACTLY.
// - Do NOT include invalid characters in {{variables}}.
// - The extension will substitute the values automatically.

export function buildBirthChartPrompt() {
  return `
You are an expert astrologer and chart designer. Generate a clean, accurate, visually balanced natal birth chart wheel image based on the user's exact birth data.

Chart requirements:
- 12 houses clearly marked
- Outer zodiac ring with correct glyphs
- All major planets placed at their correct degrees
- Ascendant, Midheaven, Descendant, and Imum Coeli included
- Retrograde planets marked with ℞
- House cusps labeled
- Professional, modern, minimal astrology-app style

Chart Theme:
If {{chartTheme}} is "dark":
  - Use dark background (black, deep navy, or midnight)
  - Use neon accents: purple, teal, silver
  - High contrast and glowing glyphs
If {{chartTheme}} is "light":
  - Use pastel or neutral tones
  - Clear and soft accents
  - High readability on a light background

User's Birth Data:
Date: {{birthDate}}
Time: {{birthTime}}
Latitude: {{lat}}
Longitude: {{lon}}
Timezone Offset: {{timezone}}

OUTPUT RULES:
Return ONLY a base64-encoded PNG image of the birth chart wheel.
No text. No JSON. No explanation. Only the base64 string.
`;
}

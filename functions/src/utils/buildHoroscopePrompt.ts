// buildHoroscopePrompt.ts
// ------------------------------------------
// Generates the full Gemini prompt string
// for the Delaluna 3-day horoscope handler
// ------------------------------------------

export function buildHoroscopePrompt(options: {
  date: string;
  userRising: string;
  userSun: string;
  userMoon: string;
  tarotCardKeywords: string;
  tarotCardMeanings: string;
}) {
  const {
    date,
    userRising,
    userSun,
    userMoon,
    tarotCardKeywords,
    tarotCardMeanings,
    
  } = options;

  return `

Generate a DAILY horoscope for the user for the given date.

Astrology (Rising sign, Moon, and planetary transits) is the PRIMARY driver of the horoscope.

ASTROLOGY — PRIMARY DRIVER
====================================================
Use astrology as the FOUNDATION of the horoscope.

You MUST:
- Anchor the interpretation to the user’s Rising, Sun and Moon signs
- Describe the Moon sign and phase for the date
- Reference relevant planetary transits influencing mood, timing, and decisions

Astrology determines:
- the tone of the day
- emotional climate
- decision-making guidance
- relationship dynamics
- timing and momentum

Astrology MUST directly influence:
- quote
- advice
- affirmation
- warning
- moon
- transits
- release
- newLove (sign compatibility ONLY)
- dos
- donts


====================================================
TAROT INTERPRETATION
====================================================
Use Tarot Keyword List and Meaning List to generate an interpretation of the meaning of today’s cards.

Tarot Keyword List:
${tarotCardKeywords}

Tarot Meaning List:
${tarotCardMeanings}

Tarot ONLY influence:
- the "tarot" field (card interpretation)

====================================================
📥 USER DATA
====================================================
Rising: ${userRising}
Sun: ${userSun}
Moon: ${userMoon}
Date: ${date}

====================================================
📝 STYLE REQUIREMENTS
====================================================
Write like Delaluna:
- witty, honest, emotionally intelligent, empowering
- confident, grounded, and specific
- spice and savage allowed, never cruel to the user

Avoid:
- clichés
- vague astrology
- over-explaining
- generic self-help language

====================================================
⚠️ OUTPUT RULES
====================================================
- Return JSON ONLY. No markdown. No commentary.
- All values must be strings or arrays of strings.
- "do" MUST contain exactly 3 list style items or phrases.
- "dont" MUST contain exactly 3 list style items or phrases.
- "newLove" MUST contain exactly 3 zodiac sign names (strings only).
- "luckyNumbers" MUST contain 3 numbers as strings (e.g. ["3","7","14"]).
- Tarot interpretation must be isolated to the "tarot" field.
- Astrology must clearly drive the rest of the horoscope.

====================================================
📤 OUTPUT FORMAT
====================================================

{
  "quote": "",
  "advice": "",
  "affirmation": "",
  "do": [],
  "dont": [],
  "warning": "",
  "moon": "",
  "transits": "",
  "tarot": "",
  "newLove": [],
  "luckyNumbers": [],
  "release": ""
}
`;
}

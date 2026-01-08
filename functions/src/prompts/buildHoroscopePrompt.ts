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
- Anchor the interpretation to the user Rising, Sun and Moon signs
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
- transits
- moon
- moonPhaseDetails
- planetsRetrograde
- returns (signs ONLY)
- newLove (sign compatibility ONLY)
- do
- dont
- release


====================================================
TAROT INTERPRETATION
====================================================
Use Tarot Keywords and Tarot Meanings to generate an interpretation of the meaning of today’s cards. 
MUST BE be 5-7 sentences NO LONGER OR SHORTER.

Tarot Keywords:
${tarotCardKeywords}

Tarot Meanings:
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
STYLE REQUIREMENTS
====================================================
Write like Delaluna:
- witty, honest, emotionally intelligent, empowering, wise, honest
- confident, grounded, and specific
- spice and savage allowed, never cruel to the user
- tarot MUST BE 5-7 sentences. No shorter or Longer.
- moonPhaseDetails should be moon phase name, type and degree (example: Aries Moon, Waxing Gibbous, 22°)
- moon MUST BE 5-7 sentences No shorter or Longer.
- planetsRetrograde should ONLY be the names of currently planets in retrograde if there are none enter "none".  
- new love should be zodiacs that the user has a higher likelihood of vibing with or feeling attraction toward the user today. 
- return is zodiac signs have a higher likelihood of seeking for closure, clarification or continuation.
- transits must be 5-7 sentences

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
- "do" MUST contain exactly 3 list style items or phrases containg no more than 3 words. (example. keep it real, tighten up, on dnd, fix your crown, keep head up)
- "dont" MUST contain exactly 3 list style items or phrases. (excample. stop lying, overspend, keep it dl, dont enetertain scrubs)
- "newLove" MUST contain exactly 3 zodiac sign names (strings only).
- "luckyNumbers" MUST contain 3 numbers as strings (e.g. ["3","7","14"]).
- Tarot interpretation must be isolated to ONLY the "tarot" field.
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
  "moonPhaseDetails": "",
  "moon": "",
  "planetsRetrograde": [],
  "transits": "",
  "tarot": "",
  "returns": [],
  "newLove": [],
  "luckyNumbers": [],
  "release": ""
}
`;
}

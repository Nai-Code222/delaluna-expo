const XLSX = require("xlsx");
const fs = require("fs");

const INPUT = process.argv[2];
const OUTPUT = process.argv[3] || "src/data/tarotCards.registry.ts";

if (!INPUT) {
  console.error("❌ Usage: node generateTarotRegistry.js <file.xlsx>");
  process.exit(1);
}

const wb = XLSX.readFile(INPUT);
const cards = [];

for (const sheetName of wb.SheetNames) {
  if (sheetName === "Spreads") continue;
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
  cards.push(...rows);
}

const content = `
// ⚠️ AUTO-GENERATED FILE — DO NOT EDIT
// Generated from Tarot_Deck_Master.xlsx

export const TAROT_CARDS = ${JSON.stringify(
  cards.map(r => ({
    id: Number(r.id),
    arcana: r.arcana,
    suit: r.suit || undefined,
    number: r.number,
    name: r.name,
    slug: r.slug,
    keywordsUpright: String(r.keywords_upright).split(";").map(s => s.trim()),
    keywordsReversed: String(r.keywords_reversed).split(";").map(s => s.trim()),
    meaningUpright: r.meaning_upright,
    meaningReversed: r.meaning_reversed,
    imagePath: r.image_path,
    reversalProbability: Number(r.reversal_probability || 0.35),
    allowedSpreads: String(r.allowed_spreads || "").split("|"),
  })),
  null,
  2
)};

export const TAROT_BY_ID = new Map(
  TAROT_CARDS.map(c => [c.id, c])
);
export const TAROT_BY_SLUG = new Map(
  TAROT_CARDS.map(c => [c.slug, c])
);
`;

fs.writeFileSync(OUTPUT, content.trim() + "\n");
console.log(`✅ Generated ${OUTPUT}`);
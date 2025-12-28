

import { z } from "zod";

export const DrawnTarotCardSchema = z.object({
  id: z.string(),
  name: z.string(),
  imagePath: z.string(),
  reversed: z.boolean(),
  keywords: z.array(z.string()),
  meaning: z.string(),
});

export type DrawnTarotCard = z.infer<typeof DrawnTarotCardSchema>;
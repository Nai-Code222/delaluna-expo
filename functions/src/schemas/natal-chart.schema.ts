// natal-chart.schema.ts
import { z } from "zod";

export const NatalChartSchema = z.object({
  bigThree: z.object({
    sun: z.string(),
    moon: z.string(),
    rising: z.string(),
  }),
  planets: z.record(
    z.string(),
    z.object({
      sign: z.string(),
      degree: z.number(),
      house: z.number(),
      retrograde: z.boolean().optional(),
    })
  ),
  houses: z.array(
    z.object({
      house: z.number(),
      sign: z.string(),
    })
  ),
  aspects: z.array(
    z.object({
      from: z.string(),
      to: z.string(),
      type: z.enum([
        "conjunction",
        "opposition",
        "trine",
        "square",
        "sextile",
      ]),
      orb: z.number(),
    })
  ),
});
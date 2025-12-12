import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { z } from "zod";
import { buildCompatibilityPrompt } from "./utils/buildCompatibilityPrompt";
import { calculateSignsInternal } from "./utils/calcSigns";

const db = getFirestore();

/**
 * Zod schema: Validates person input at runtime.
 * Ensures either signs or core birth data are provided.
 */
const personInputSchema = z
  .object({
    "First Name": z.string().min(1),
    "Last Name": z.string().min(1),
    "Sun Sign": z.string().optional(),
    "Moon Sign": z.string().optional(),
    "Rising Sign": z.string().optional(),
    Pronouns: z.string().optional(),
    day: z.number().optional(),
    month: z.number().optional(),
    year: z.number().optional(),
    hour: z.number().optional(),
    min: z.number().optional(),
    lat: z.number().optional(),
    lon: z.number().optional(),
    tzone: z.number().optional(),
  })
  .superRefine((p, ctx) => {
    const hasSigns =
      !!p["Sun Sign"] && !!p["Moon Sign"] && !!p["Rising Sign"];

    const hasBirthData =
      p.day != null &&
      p.month != null &&
      p.year != null &&
      p.lat != null &&
      p.lon != null;

    if (!hasSigns && !hasBirthData) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Must provide either all signs (Sun, Moon, Rising) or core birth data.",
      });
    }
  });

/**
 * Zod schema: Validates the full callable payload.
 */
const getConnectionPayloadSchema = z.object({
  userId: z.string().min(1),
  connectionId: z.string().min(1),
  relationshipType: z.string().optional(),
  firstPerson: personInputSchema,
  secondPerson: personInputSchema,
});

type PersonInput = z.infer<typeof personInputSchema>;

/**
 * Ensures that signs are present. If missing, calculates them using ephemeris.
 */
async function ensureSigns(p: PersonInput): Promise<PersonInput> {
  if (p["Sun Sign"] && p["Moon Sign"] && p["Rising Sign"]) {
    return p;
  }

  if (
    p.day == null ||
    p.month == null ||
    p.year == null ||
    p.lat == null ||
    p.lon == null
  ) {
    throw new HttpsError(
      "invalid-argument",
      `Incomplete birth data for ${p["First Name"]}`
    );
  }

  const signs = await calculateSignsInternal({
    day: p.day,
    month: p.month,
    year: p.year,
    hour: p.hour ?? 12,
    min: p.min ?? 0,
    lat: p.lat,
    lon: p.lon,
    tzone: p.tzone ?? 0,
  });

  return {
    ...p,
    "Sun Sign": signs.raw.sun.sign,
    "Moon Sign": signs.raw.moon.sign,
    "Rising Sign": signs.raw.ascendant.sign,
  };
}

/**
 * Callable function: Creates or updates a compatibility connection.
 * Performs validation, sign enrichment, prompt construction, and Firestore write.
 */
export const getConnection = onCall(async (req) => {
  const { auth, data } = req;

  if (!auth) {
    throw new HttpsError("unauthenticated", "User must be signed in.");
  }

  const parsed = getConnectionPayloadSchema.safeParse(data);

  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => {
        const path = issue.path.join(".");
        return path ? `${path}: ${issue.message}` : issue.message;
      })
      .join("; ");

    throw new HttpsError("invalid-argument", `Invalid payload: ${message}`);
  }

  const { userId, connectionId, relationshipType, firstPerson, secondPerson } =
    parsed.data;

  if (auth.uid !== userId) {
    throw new HttpsError(
      "permission-denied",
      "User cannot create a connection for another user."
    );
  }

  const userPerson = await ensureSigns(firstPerson);
  const partnerPerson = await ensureSigns(secondPerson);

  const prompt = buildCompatibilityPrompt({
    userSun: userPerson["Sun Sign"] ?? "",
    userMoon: userPerson["Moon Sign"] ?? "",
    userRising: userPerson["Rising Sign"] ?? "",
    userPronouns: userPerson.Pronouns ?? "",
    partnerSun: partnerPerson["Sun Sign"] ?? "",
    partnerMoon: partnerPerson["Moon Sign"] ?? "",
    partnerRising: partnerPerson["Rising Sign"] ?? "",
    partnerPronouns: partnerPerson.Pronouns ?? "",
    relationshipType: relationshipType ?? "",
  });

  const docData = {
    connectionId,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    relationshipType: relationshipType || "unspecified",
    type: "compatibility",
    status: { state: "pending", type: "compatibility" },
    prompt,
    firstPerson: {
      firstName: userPerson["First Name"],
      lastName: userPerson["Last Name"],
      sun: userPerson["Sun Sign"],
      moon: userPerson["Moon Sign"],
      rising: userPerson["Rising Sign"],
    },
    secondPerson: {
      firstName: partnerPerson["First Name"],
      lastName: partnerPerson["Last Name"],
      sun: partnerPerson["Sun Sign"],
      moon: partnerPerson["Moon Sign"],
      rising: partnerPerson["Rising Sign"],
    },
  };

  const ref = db.doc(`users/${userId}/connections/${connectionId}`);
  await ref.set(docData, { merge: true });

  logger.info(`Connection stored: ${ref.path}`);

  return { connectionId };
});

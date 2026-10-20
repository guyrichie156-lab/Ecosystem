import { desc, eq } from "drizzle-orm";
import { db } from "./client";
import { bodyMeasurements } from "./schema";
import { settingsStorage as storage } from "./settings";

export type Sex = "male" | "female";

/** The user's body data that more than one module needs (workouts, food). */
export type Profile = {
  /** Height in millimetres, like the circumferences. */
  heightMm: number | null;
  sex: Sex | null;
  birthYear: number | null;
};

// The first two keys predate the shared profile (they were Health's); kept so saved values stay.
const HEIGHT_KEY = "health.heightMm";
const SEX_KEY = "health.sex";
const BIRTH_YEAR_KEY = "profile.birthYear";

export function getProfile(): Profile {
  const height = Number(storage.getItemSync(HEIGHT_KEY));
  const sex = storage.getItemSync(SEX_KEY);
  const birthYear = Number(storage.getItemSync(BIRTH_YEAR_KEY));
  return {
    heightMm: height > 0 ? height : null,
    sex: sex === "male" || sex === "female" ? sex : null,
    birthYear: birthYear > 0 ? birthYear : null,
  };
}

export function saveProfile(profile: Profile): void {
  const entries: [string, string | null][] = [
    [HEIGHT_KEY, profile.heightMm ? String(profile.heightMm) : null],
    [SEX_KEY, profile.sex],
    [BIRTH_YEAR_KEY, profile.birthYear ? String(profile.birthYear) : null],
  ];
  for (const [key, value] of entries) {
    if (value) storage.setItemSync(key, value);
    else storage.removeItemSync(key);
  }
}

/** The most recent weigh-in, in grams, or null if there is none. */
export async function getLatestWeightGrams(): Promise<number | null> {
  const [row] = await db
    .select({ value: bodyMeasurements.value })
    .from(bodyMeasurements)
    .where(eq(bodyMeasurements.kind, "weight"))
    .orderBy(desc(bodyMeasurements.measuredAt))
    .limit(1);
  return row?.value ?? null;
}

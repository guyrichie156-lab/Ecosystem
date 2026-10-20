import { getLatestWeightGrams, getProfile, settingsStorage } from "@ecosystem/db";
import { activityFactor, restingKcal, type ActivityLevel, type Sex } from "./nutrition";

const ACTIVITY_KEY = "food.activity";
const GOAL_KEY = "food.goalKcal";

export function getActivityLevel(): ActivityLevel {
  const value = settingsStorage.getItemSync(ACTIVITY_KEY);
  return value === "moderate" || value === "vigorous" ? value : "light";
}

export function saveActivityLevel(level: ActivityLevel): void {
  settingsStorage.setItemSync(ACTIVITY_KEY, level);
}

/** The norm the user typed in, which wins over the formula; null to use the formula. */
export function getManualGoal(): number | null {
  const value = Number(settingsStorage.getItemSync(GOAL_KEY));
  return value > 0 ? value : null;
}

export function saveManualGoal(kcal: number | null): void {
  if (kcal) settingsStorage.setItemSync(GOAL_KEY, String(kcal));
  else settingsStorage.removeItemSync(GOAL_KEY);
}

export type FormulaInputs = { weightKg: number; heightCm: number; age: number; sex: Sex };

export type Norm = {
  /** Kcal a day, or null when neither a typed norm nor all the formula's inputs exist. */
  kcal: number | null;
  manual: boolean;
  /** The formula's inputs, when all are known. */
  inputs: FormulaInputs | null;
  /** What the formula still needs, in Russian. */
  missing: string[];
  resting: number | null;
  level: ActivityLevel;
};

/** The daily norm: the typed one, else Mifflin–St Jeor × activity from the shared profile. */
export async function getNorm(now = new Date()): Promise<Norm> {
  const profile = getProfile();
  const weightGrams = await getLatestWeightGrams();
  const missing = [
    weightGrams === null ? "вес" : null,
    profile.heightMm === null ? "рост" : null,
    profile.sex === null ? "пол" : null,
    profile.birthYear === null ? "год рождения" : null,
  ].filter((m): m is string => m !== null);
  const inputs: FormulaInputs | null =
    missing.length === 0
      ? {
          weightKg: weightGrams! / 1000,
          heightCm: profile.heightMm! / 10,
          // By the year of birth only, so it can be a year more than the real age.
          age: now.getFullYear() - profile.birthYear!,
          sex: profile.sex!,
        }
      : null;
  const level = getActivityLevel();
  const resting = inputs ? restingKcal(inputs) : null;
  const manual = getManualGoal();
  const kcal = manual ?? (resting === null ? null : Math.round(resting * activityFactor(level)));
  return { kcal, manual: manual !== null, inputs, missing, resting, level };
}

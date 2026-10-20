import { getExercise } from "./exercises";
import { MUSCLE_IDS, type Muscle } from "./muscles";

/**
 * Pure workout logic (no database, no UI), so it can be unit-tested.
 *
 * Recovery follows one published rule, not a measurement of the muscle: the ACSM position stand
 * (Garber et al., Med Sci Sports Exerc 2011) advises at least 48 hours between resistance sessions
 * for the same muscle group (as reported by https://www.medicalnewstoday.com/releases/229871 ; the
 * full text could not be opened). Some researchers question that a full 48 hours is needed.
 */
export const RECOVERY_HOURS = 48;

const HOUR = 60 * 60 * 1000;

/** When an exercise was last done: the finish time of the latest workout with a done set of it. */
export type ExerciseLastDone = { exerciseId: string; finishedAt: number };

export type MuscleRecovery = {
  muscle: Muscle;
  /** Null if the muscle was never a main muscle of a done set. */
  lastTrainedAt: number | null;
  /** Hours left until 48 hours have passed; 0 when ready. */
  hoursLeft: number;
  ready: boolean;
};

/** Every muscle group with the time it last was a main muscle of a done exercise. */
export function muscleRecovery(lastDone: ExerciseLastDone[], now: number): MuscleRecovery[] {
  const lastByMuscle = new Map<Muscle, number>();
  for (const { exerciseId, finishedAt } of lastDone) {
    for (const muscle of getExercise(exerciseId)?.primary ?? []) {
      lastByMuscle.set(muscle, Math.max(lastByMuscle.get(muscle) ?? 0, finishedAt));
    }
  }
  return MUSCLE_IDS.map((muscle) => {
    const lastTrainedAt = lastByMuscle.get(muscle) ?? null;
    const hoursSince = lastTrainedAt === null ? Infinity : (now - lastTrainedAt) / HOUR;
    const hoursLeft = Math.max(0, Math.ceil(RECOVERY_HOURS - hoursSince));
    return { muscle, lastTrainedAt, hoursLeft, ready: hoursLeft === 0 };
  });
}

export type TemplateUsage = { id: number; createdAt: number; lastDoneAt: number | null };

/** The template to suggest next: one never done (oldest first), else the one done longest ago. */
export function pickNextTemplate<T extends TemplateUsage>(templates: T[]): T | null {
  const sorted = [...templates].sort((a, b) => {
    if (a.lastDoneAt === null || b.lastDoneAt === null) {
      if (a.lastDoneAt !== b.lastDoneAt) return a.lastDoneAt === null ? -1 : 1;
      return a.createdAt - b.createdAt || a.id - b.id;
    }
    return a.lastDoneAt - b.lastDoneAt;
  });
  return sorted[0] ?? null;
}

/** One common exercise per muscle group for a workout built from rested muscles, big groups first. */
const RESTED_WORKOUT_CHOICES: [Muscle, string][] = [
  ["chest", "pushups"],
  ["back", "one-arm-dumbbell-row"],
  ["quads", "bodyweight-squat"],
  ["shoulders", "dumbbell-shoulder-press"],
  ["hamstrings", "romanian-deadlift"],
  ["glutes", "butt-lift-bridge"],
  ["biceps", "dumbbell-bicep-curl"],
  ["triceps", "bench-dips"],
  ["abs", "crunches"],
  ["calves", "standing-calf-raises"],
];

/** Up to `limit` exercises whose main muscles have all had 48 hours of rest. */
export function restedWorkoutExercises(recovery: MuscleRecovery[], limit = 5): string[] {
  const ready = new Set(recovery.filter((r) => r.ready).map((r) => r.muscle));
  return RESTED_WORKOUT_CHOICES.filter(([muscle, exerciseId]) => {
    const exercise = getExercise(exerciseId);
    return ready.has(muscle) && !!exercise && exercise.primary.every((m) => ready.has(m));
  })
    .slice(0, limit)
    .map(([, exerciseId]) => exerciseId);
}

/** Kilograms typed by the user ("22,5") -> grams, or null if empty; undefined if not a number. */
export function parseWeightKg(text: string): number | null | undefined {
  const normalized = text.replace(",", ".").trim();
  if (normalized === "") return null;
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(normalized)) return undefined;
  return Math.round(parseFloat(normalized) * 1000);
}

/** Grams -> "22,5" for an input field. */
export function formatWeightKg(grams: number | null): string {
  if (grams === null) return "";
  return (grams / 1000).toLocaleString("ru-RU", { maximumFractionDigits: 2, useGrouping: false });
}

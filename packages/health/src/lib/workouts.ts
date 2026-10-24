import { and, asc, desc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import {
  db,
  settingsStorage,
  workoutSessions,
  workoutSets,
  workoutTemplateExercises,
  workoutTemplates,
} from "@ecosystem/db";
import { getExercise } from "./exercises";
import { STARTER_TEMPLATES } from "./starterTemplates";
import type { ExerciseLastDone } from "./training";

export type TemplateExercise = { exerciseId: string; sets: number; reps: number };

export type WorkoutTemplate = {
  id: number;
  name: string;
  createdAt: number;
  /** When a workout started from this template was last finished. */
  lastDoneAt: number | null;
  exercises: TemplateExercise[];
};

const SEEDED_KEY = "health.workouts.seeded";

/** Adds the starter workouts once; if the user deletes them later, they don't come back. */
export async function seedStarterTemplatesOnce(): Promise<void> {
  if (settingsStorage.getItemSync(SEEDED_KEY)) return;
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(workoutTemplates);
  if (count === 0) {
    for (const template of STARTER_TEMPLATES) await saveTemplate(template);
  }
  settingsStorage.setItemSync(SEEDED_KEY, "1");
}

export async function getTemplates(): Promise<WorkoutTemplate[]> {
  const [templates, exercises, lastDone] = await Promise.all([
    db.select().from(workoutTemplates).orderBy(asc(workoutTemplates.createdAt), asc(workoutTemplates.id)),
    db.select().from(workoutTemplateExercises).orderBy(asc(workoutTemplateExercises.position)),
    db
      .select({ templateId: workoutSessions.templateId, at: sql<number>`max(${workoutSessions.finishedAt})` })
      .from(workoutSessions)
      .where(and(isNotNull(workoutSessions.templateId), isNotNull(workoutSessions.finishedAt)))
      .groupBy(workoutSessions.templateId),
  ]);
  const lastByTemplate = new Map(lastDone.map((r) => [r.templateId, r.at]));
  return templates.map((t) => ({
    id: t.id,
    name: t.name,
    createdAt: t.createdAt,
    lastDoneAt: lastByTemplate.get(t.id) ?? null,
    exercises: exercises
      .filter((e) => e.templateId === t.id)
      .map(({ exerciseId, sets, reps }) => ({ exerciseId, sets, reps })),
  }));
}

export async function getTemplate(id: number): Promise<WorkoutTemplate | null> {
  return (await getTemplates()).find((t) => t.id === id) ?? null;
}

/** Creates a template (no id) or replaces the name and exercises of an existing one; returns its id. */
export async function saveTemplate(input: { id?: number; name: string; exercises: TemplateExercise[] }): Promise<number> {
  let id = input.id;
  if (id === undefined) {
    const [row] = await db.insert(workoutTemplates).values({ name: input.name }).returning({ id: workoutTemplates.id });
    id = row.id;
  } else {
    await db.update(workoutTemplates).set({ name: input.name }).where(eq(workoutTemplates.id, id));
    await db.delete(workoutTemplateExercises).where(eq(workoutTemplateExercises.templateId, id));
  }
  if (input.exercises.length > 0) {
    await db
      .insert(workoutTemplateExercises)
      .values(input.exercises.map((e, position) => ({ ...e, templateId: id, position })));
  }
  return id;
}

/** Deletes a template; workouts done from it stay in the history without the link. */
export async function deleteTemplate(id: number): Promise<void> {
  await db.delete(workoutTemplateExercises).where(eq(workoutTemplateExercises.templateId, id));
  await db.update(workoutSessions).set({ templateId: null }).where(eq(workoutSessions.templateId, id));
  await db.delete(workoutTemplates).where(eq(workoutTemplates.id, id));
}

/** The last done weight of each exercise, to prefill a new workout. */
async function lastWeights(exerciseIds: string[]): Promise<Map<string, number | null>> {
  if (exerciseIds.length === 0) return new Map();
  const rows = await db
    .select({ exerciseId: workoutSets.exerciseId, weightGrams: workoutSets.weightGrams })
    .from(workoutSets)
    .innerJoin(workoutSessions, eq(workoutSessions.id, workoutSets.sessionId))
    .where(and(inArray(workoutSets.exerciseId, exerciseIds), eq(workoutSets.done, true), isNotNull(workoutSessions.finishedAt)))
    .orderBy(desc(workoutSessions.finishedAt), desc(workoutSets.position));
  const result = new Map<string, number | null>();
  for (const row of rows) if (!result.has(row.exerciseId)) result.set(row.exerciseId, row.weightGrams);
  return result;
}

/**
 * Starts a workout with every set of every exercise laid out; returns the workout's id.
 * A workout left open is finished first (or dropped if nothing in it was done), so one runs at a time.
 * It may have been left days ago, so it ends when it began: sets don't keep the time they were done,
 * and «now» would make «Отдых мышц» count muscles trained back then as trained today.
 */
export async function startWorkout(input: { name: string; templateId?: number; exercises: TemplateExercise[] }): Promise<number> {
  const open = await db
    .select({ id: workoutSessions.id, startedAt: workoutSessions.startedAt })
    .from(workoutSessions)
    .where(isNull(workoutSessions.finishedAt));
  for (const workout of open) await finishWorkout(workout.id, workout.startedAt);
  const [session] = await db
    .insert(workoutSessions)
    .values({ name: input.name, templateId: input.templateId ?? null, startedAt: Date.now() })
    .returning({ id: workoutSessions.id });
  const weights = await lastWeights(input.exercises.map((e) => e.exerciseId));
  const sets = input.exercises.flatMap((e) =>
    Array.from({ length: e.sets }, () => ({
      sessionId: session.id,
      exerciseId: e.exerciseId,
      weightGrams: getExercise(e.exerciseId)?.equipment === "bodyweight" ? null : (weights.get(e.exerciseId) ?? null),
      reps: e.reps,
    }))
  );
  if (sets.length > 0) await db.insert(workoutSets).values(sets.map((s, position) => ({ ...s, position })));
  return session.id;
}

export type WorkoutSet = typeof workoutSets.$inferSelect;
export type Workout = typeof workoutSessions.$inferSelect & { sets: WorkoutSet[] };

export async function getWorkout(id: number): Promise<Workout | null> {
  const [session] = await db.select().from(workoutSessions).where(eq(workoutSessions.id, id));
  if (!session) return null;
  const sets = await db.select().from(workoutSets).where(eq(workoutSets.sessionId, id)).orderBy(asc(workoutSets.position));
  return { ...session, sets };
}

/** A workout that was started and neither finished nor discarded. */
export async function getUnfinishedWorkout(): Promise<{ id: number; name: string } | null> {
  const [row] = await db
    .select({ id: workoutSessions.id, name: workoutSessions.name })
    .from(workoutSessions)
    .where(isNull(workoutSessions.finishedAt))
    .orderBy(desc(workoutSessions.startedAt))
    .limit(1);
  return row ?? null;
}

export async function updateSet(id: number, change: Partial<Pick<WorkoutSet, "weightGrams" | "reps" | "done">>): Promise<void> {
  await db.update(workoutSets).set(change).where(eq(workoutSets.id, id));
}

/** Adds one more set of an exercise, copying its last set, right after it. */
export async function addSet(workoutId: number, exerciseId: string): Promise<void> {
  const sets = await db.select().from(workoutSets).where(eq(workoutSets.sessionId, workoutId)).orderBy(asc(workoutSets.position));
  const last = [...sets].reverse().find((s) => s.exerciseId === exerciseId);
  const position = last ? last.position + 1 : sets.length;
  // Make room: every later set moves one place down.
  await db
    .update(workoutSets)
    .set({ position: sql`${workoutSets.position} + 1` })
    .where(and(eq(workoutSets.sessionId, workoutId), sql`${workoutSets.position} >= ${position}`));
  await db.insert(workoutSets).values({
    sessionId: workoutId,
    exerciseId,
    position,
    weightGrams: last?.weightGrams ?? null,
    reps: last?.reps ?? null,
  });
}

export async function deleteSet(id: number): Promise<void> {
  await db.delete(workoutSets).where(eq(workoutSets.id, id));
}

/** Finishes a workout at `finishedAt`; one with no done set is discarded instead. Returns whether it was kept. */
export async function finishWorkout(id: number, finishedAt = Date.now()): Promise<boolean> {
  const [{ done }] = await db
    .select({ done: sql<number>`count(*)` })
    .from(workoutSets)
    .where(and(eq(workoutSets.sessionId, id), eq(workoutSets.done, true)));
  if (done === 0) {
    await discardWorkout(id);
    return false;
  }
  await db.delete(workoutSets).where(and(eq(workoutSets.sessionId, id), eq(workoutSets.done, false)));
  await db.update(workoutSessions).set({ finishedAt }).where(eq(workoutSessions.id, id));
  return true;
}

export async function discardWorkout(id: number): Promise<void> {
  await db.delete(workoutSets).where(eq(workoutSets.sessionId, id));
  await db.delete(workoutSessions).where(eq(workoutSessions.id, id));
}

export type FinishedWorkout = { id: number; name: string; finishedAt: number; sets: number; exercises: number };

export async function getRecentWorkouts(limit = 5): Promise<FinishedWorkout[]> {
  const rows = await db
    .select({
      id: workoutSessions.id,
      name: workoutSessions.name,
      finishedAt: workoutSessions.finishedAt,
      sets: sql<number>`count(${workoutSets.id})`,
      exercises: sql<number>`count(distinct ${workoutSets.exerciseId})`,
    })
    .from(workoutSessions)
    .leftJoin(workoutSets, eq(workoutSets.sessionId, workoutSessions.id))
    .where(isNotNull(workoutSessions.finishedAt))
    .groupBy(workoutSessions.id)
    .orderBy(desc(workoutSessions.finishedAt))
    .limit(limit);
  return rows.map((r) => ({ ...r, finishedAt: r.finishedAt! }));
}

/** For recovery: when each exercise was last done in a finished workout. */
export async function getExercisesLastDone(): Promise<ExerciseLastDone[]> {
  return db
    .select({ exerciseId: workoutSets.exerciseId, finishedAt: sql<number>`max(${workoutSessions.finishedAt})` })
    .from(workoutSets)
    .innerJoin(workoutSessions, eq(workoutSessions.id, workoutSets.sessionId))
    .where(and(eq(workoutSets.done, true), isNotNull(workoutSessions.finishedAt)))
    .groupBy(workoutSets.exerciseId);
}

/** The user's done sets of one exercise, newest workout first. */
export async function getExerciseHistory(exerciseId: string, workouts = 5) {
  const rows = await db
    .select({
      workoutId: workoutSessions.id,
      finishedAt: workoutSessions.finishedAt,
      weightGrams: workoutSets.weightGrams,
      reps: workoutSets.reps,
    })
    .from(workoutSets)
    .innerJoin(workoutSessions, eq(workoutSessions.id, workoutSets.sessionId))
    .where(and(eq(workoutSets.exerciseId, exerciseId), eq(workoutSets.done, true), isNotNull(workoutSessions.finishedAt)))
    .orderBy(desc(workoutSessions.finishedAt), asc(workoutSets.position));
  const byWorkout = new Map<number, { finishedAt: number; sets: { weightGrams: number | null; reps: number | null }[] }>();
  for (const r of rows) {
    if (!byWorkout.has(r.workoutId)) {
      if (byWorkout.size === workouts) break;
      byWorkout.set(r.workoutId, { finishedAt: r.finishedAt!, sets: [] });
    }
    byWorkout.get(r.workoutId)!.sets.push({ weightGrams: r.weightGrams, reps: r.reps });
  }
  return [...byWorkout.values()];
}

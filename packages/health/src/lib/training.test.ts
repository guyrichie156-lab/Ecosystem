import { test } from "node:test";
import assert from "node:assert/strict";
import { EXERCISES, alternativesTo, filterExercises, getExercise } from "./exercises";
import { MUSCLE_IDS } from "./muscles";
import {
  formatWeightKg,
  muscleRecovery,
  parseWeightKg,
  pickNextTemplate,
  restedWorkoutExercises,
} from "./training";

const HOUR = 60 * 60 * 1000;
const NOW = Date.UTC(2026, 9, 20, 12);

test("catalog ids are unique and every exercise has a main muscle the app knows", () => {
  assert.equal(new Set(EXERCISES.map((e) => e.id)).size, EXERCISES.length);
  for (const e of EXERCISES) {
    assert.ok(e.primary.length > 0, e.id);
    for (const m of [...e.primary, ...e.secondary]) assert.ok(MUSCLE_IDS.includes(m), `${e.id}: ${m}`);
    assert.ok(!e.secondary.some((m) => e.primary.includes(m)), `${e.id} lists a muscle twice`);
  }
});

test("search ignores case, «ё» and word order; filters by main muscle and equipment", () => {
  assert.ok(filterExercises({ query: "ЛЁЖА жим" }).some((e) => e.id === "dumbbell-bench-press"));
  const chest = filterExercises({ muscle: "chest" });
  assert.ok(chest.length > 0 && chest.every((e) => e.primary.includes("chest")));
  const free = filterExercises({ muscle: "chest", equipment: "bodyweight" });
  assert.ok(free.some((e) => e.id === "pushups"));
  assert.ok(free.every((e) => e.equipment === "bodyweight"));
});

test("alternatives share a main muscle and leave the exercise itself out", () => {
  const pushups = getExercise("pushups")!;
  const alternatives = alternativesTo(pushups);
  assert.ok(alternatives.length > 0);
  assert.ok(alternatives.every((e) => e.id !== "pushups" && e.primary.includes("chest")));
});

test("a muscle is ready 48 hours after the last workout where it was a main muscle", () => {
  const recovery = muscleRecovery([{ exerciseId: "pushups", finishedAt: NOW - 30 * HOUR }], NOW);
  const chest = recovery.find((r) => r.muscle === "chest")!;
  assert.equal(chest.ready, false);
  assert.equal(chest.hoursLeft, 18);
  // Push-ups only help the triceps, so the triceps doesn't wait.
  assert.equal(recovery.find((r) => r.muscle === "triceps")!.ready, true);
  // Never trained: ready, with no date.
  const calves = recovery.find((r) => r.muscle === "calves")!;
  assert.deepEqual([calves.ready, calves.lastTrainedAt], [true, null]);

  const later = muscleRecovery([{ exerciseId: "pushups", finishedAt: NOW - 48 * HOUR }], NOW);
  assert.equal(later.find((r) => r.muscle === "chest")!.ready, true);
});

test("the latest workout of a muscle counts, and unknown exercise ids are ignored", () => {
  const recovery = muscleRecovery(
    [
      { exerciseId: "dumbbell-bench-press", finishedAt: NOW - 100 * HOUR },
      { exerciseId: "pushups", finishedAt: NOW - 10 * HOUR },
      { exerciseId: "removed-from-catalog", finishedAt: NOW },
    ],
    NOW
  );
  assert.equal(recovery.find((r) => r.muscle === "chest")!.lastTrainedAt, NOW - 10 * HOUR);
  assert.equal(recovery.length, MUSCLE_IDS.length);
});

test("next template: never done first (oldest first), then the one done longest ago", () => {
  const templates = [
    { id: 1, createdAt: 1, lastDoneAt: NOW - 1 * HOUR },
    { id: 2, createdAt: 2, lastDoneAt: NOW - 50 * HOUR },
    { id: 3, createdAt: 3, lastDoneAt: null },
  ];
  assert.equal(pickNextTemplate(templates)?.id, 3);
  assert.equal(pickNextTemplate(templates.slice(0, 2))?.id, 2);
  assert.equal(pickNextTemplate([]), null);
});

test("the rested workout skips muscles that still rest and keeps at most five exercises", () => {
  const recovery = muscleRecovery([{ exerciseId: "pushups", finishedAt: NOW - 1 * HOUR }], NOW);
  const ids = restedWorkoutExercises(recovery);
  assert.equal(ids.length, 5);
  assert.ok(!ids.includes("pushups"));
  for (const id of ids) assert.ok(getExercise(id), id);
});

test("weights are typed in kilograms with a comma and stored in grams", () => {
  assert.equal(parseWeightKg("22,5"), 22500);
  assert.equal(parseWeightKg(" "), null);
  assert.equal(parseWeightKg("abc"), undefined);
  assert.equal(parseWeightKg("1000"), undefined);
  assert.equal(formatWeightKg(22500), "22,5");
  assert.equal(formatWeightKg(100000), "100");
  assert.equal(formatWeightKg(null), "");
});

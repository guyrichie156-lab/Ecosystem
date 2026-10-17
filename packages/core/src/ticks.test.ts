import { test } from "node:test";
import assert from "node:assert/strict";
import { niceTicks } from "./ticks";

test("ticks never step finer than the data's precision", () => {
  // 82,0 and 82,1 used to give 82 / 82,05 / 82,1, shown as "82 / 82,1 / 82,1".
  assert.deepEqual(niceTicks(82, 82.1, 0.1), [82, 82.1]);
});

test("ticks cover the data range with round steps", () => {
  assert.deepEqual(niceTicks(81.9, 84, 0.1), [81, 82, 83, 84]);
  assert.deepEqual(niceTicks(87, 96, 0.1), [85, 90, 95, 100]);
  const ticks = niceTicks(82.5, 83.2, 0.1);
  assert.ok(ticks[0] <= 82.5 && ticks[ticks.length - 1] >= 83.2);
});

test("a single value still gets a visible range around it", () => {
  const ticks = niceTicks(80, 80, 0.1);
  assert.ok(ticks[0] < 80 && ticks[ticks.length - 1] > 80);
});

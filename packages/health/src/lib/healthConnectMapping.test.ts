import { test } from "node:test";
import assert from "node:assert/strict";
import {
  FIRST_IMPORT_DAYS,
  fallbackWindowStart,
  importWindowStart,
  latestHeightMm,
  weightToMeasurement,
} from "./healthConnectMapping";

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 9, 17, 12);

test("weight is converted from kilograms to whole grams", () => {
  const m = weightToMeasurement({ time: "2026-10-15T07:30:00Z", weight: { inKilograms: 82.4567 }, metadata: { id: "abc" } });
  assert.deepEqual(m, { kind: "weight", value: 82457, measuredAt: Date.UTC(2026, 9, 15, 7, 30), externalId: "hc:abc" });
});

test("broken records are skipped instead of saved", () => {
  assert.equal(weightToMeasurement({ time: "not a date", weight: { inKilograms: 80 } }), null);
  assert.equal(weightToMeasurement({ time: "2026-10-15T07:30:00Z", weight: { inKilograms: 0 } }), null);
});

test("a record without an id still gets a stable external id", () => {
  const record = { time: "2026-10-15T07:30:00Z", weight: { inKilograms: 80 } };
  assert.equal(weightToMeasurement(record)?.externalId, weightToMeasurement(record)?.externalId);
  assert.match(weightToMeasurement(record)!.externalId, /^hc:weight:/);
});

test("the latest plausible height wins", () => {
  assert.equal(
    latestHeightMm([
      { time: "2026-01-01T00:00:00Z", height: { inMeters: 1.79 } },
      { time: "2026-09-01T00:00:00Z", height: { inMeters: 1.805 } },
    ]),
    1805
  );
  assert.equal(latestHeightMm([]), null);
  assert.equal(latestHeightMm([{ time: "2026-09-01T00:00:00Z", height: { inMeters: 18 } }]), null);
});

test("the first import stays inside Health Connect's 30-day read limit", () => {
  const start = importWindowStart(null, NOW);
  assert.equal(start, NOW - FIRST_IMPORT_DAYS * DAY);
  assert.ok(NOW - start < 30 * DAY);
  assert.equal(fallbackWindowStart(NOW), start);
});

test("later imports re-read one day before the previous import", () => {
  const last = NOW - 3 * DAY;
  assert.equal(importWindowStart(last, NOW), last - DAY);
});

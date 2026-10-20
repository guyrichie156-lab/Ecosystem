import { test } from "node:test";
import assert from "node:assert/strict";
import { getHealthTips, weeklyWeightChangeKg } from "./tips";

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 9, 17);

const ids = (weightSeries: { value: number; measuredAt: number }[] = []) =>
  getHealthTips({ weightSeries }).map((t) => t.id);

test("without weigh-ins every general tip is shown, each with a source", () => {
  const tips = getHealthTips({ weightSeries: [] });
  assert.deepEqual(
    tips.map((t) => t.id),
    ["strength", "activity", "rest", "spot-reduction"]
  );
  assert.ok(tips.every((t) => t.source));
});

test("the WHO tips keep both recommendations: aerobic minutes and strength days", () => {
  const tips = getHealthTips({ weightSeries: [] });
  assert.match(tips.find((t) => t.id === "activity")!.text, /150–300 минут/);
  assert.match(tips.find((t) => t.id === "strength")!.text, /2 дня в неделю/);
});

test("weekly weight change uses two weigh-ins at least a week apart within 4 weeks", () => {
  const series = [
    { value: 90000, measuredAt: NOW - 40 * DAY }, // older than 4 weeks: ignored
    { value: 84000, measuredAt: NOW - 14 * DAY },
    { value: 83000, measuredAt: NOW - 3 * DAY }, // less than a week before the last: not a start
    { value: 82000, measuredAt: NOW },
  ];
  assert.equal(weeklyWeightChangeKg(series), -1); // -2 kg over 2 weeks
  assert.equal(weeklyWeightChangeKg(series.slice(2)), null);
});

test("weight loss faster than 1 kg a week comes first and is flagged, 0.5–1 kg is not", () => {
  const fast = [
    { value: 85000, measuredAt: NOW - 14 * DAY },
    { value: 82000, measuredAt: NOW },
  ];
  const tips = getHealthTips({ weightSeries: fast });
  assert.equal(tips[0].id, "weight-rate");
  assert.equal(tips[0].attention, true);
  assert.match(tips[0].title, /1,5 кг в неделю/);

  const steady = [
    { value: 83500, measuredAt: NOW - 14 * DAY },
    { value: 82000, measuredAt: NOW },
  ];
  assert.equal(getHealthTips({ weightSeries: steady }).find((t) => t.id === "weight-rate")?.attention, false);

  const slow = [
    { value: 82500, measuredAt: NOW - 14 * DAY },
    { value: 82000, measuredAt: NOW },
  ];
  assert.ok(!ids(slow).includes("weight-rate"));
});

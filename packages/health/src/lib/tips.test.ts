import { test } from "node:test";
import assert from "node:assert/strict";
import { getHealthTips, weeklyWeightChangeKg, type TipInput } from "./tips";
import type { LatestMeasurement } from "./measurements";

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 9, 17);

function m(kind: LatestMeasurement["kind"], value: number, previous: number | null = null, count = 1): LatestMeasurement {
  return { kind, value, previous, count, measuredAt: NOW };
}

function input(overrides: Partial<TipInput>): TipInput {
  return { latest: [], weightSeries: [], profile: { heightMm: null, sex: null }, ...overrides };
}

const ids = (i: TipInput) => getHealthTips(i).map((t) => t.id);

test("with no measurements only the general activity tip is shown", () => {
  assert.deepEqual(ids(input({})), ["activity"]);
});

test("waist-to-height ratio follows the NICE bands", () => {
  const height = 1800; // 180 cm
  const tipFor = (waistMm: number) =>
    getHealthTips(input({ latest: [m("waist", waistMm)], profile: { heightMm: height, sex: null } })).find(
      (t) => t.id === "whtr"
    );
  assert.equal(tipFor(800)?.attention, false); // 0.44 healthy
  assert.equal(tipFor(900)?.attention, true); // exactly 0.50: increased risk
  assert.match(tipFor(900)!.text, /0,5–0,59/);
  assert.match(tipFor(1080)!.text, /0,6 и выше/); // 0.60
  assert.equal(tipFor(700), undefined); // 0.39: below the bands, no claim made
});

test("waist-to-height ratio is skipped when BMI is 35 or more", () => {
  // 180 cm, 115 kg -> BMI 35.5
  const tips = getHealthTips(
    input({ latest: [m("waist", 1100), m("weight", 115000)], profile: { heightMm: 1800, sex: null } })
  );
  assert.equal(tips.find((t) => t.id === "whtr"), undefined);
});

test("without height, waist is compared to the WCRF limit for the given sex", () => {
  const male = getHealthTips(input({ latest: [m("waist", 950)], profile: { heightMm: null, sex: "male" } }));
  assert.ok(male.some((t) => t.id === "waist-sex"));
  const maleUnder = getHealthTips(input({ latest: [m("waist", 930)], profile: { heightMm: null, sex: "male" } }));
  assert.ok(!maleUnder.some((t) => t.id === "waist-sex"));
  const female = getHealthTips(input({ latest: [m("waist", 800)], profile: { heightMm: null, sex: "female" } }));
  assert.ok(female.some((t) => t.id === "waist-sex"));
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

test("weight loss faster than 1 kg a week is flagged, 0.5–1 kg is not", () => {
  const fast = [
    { value: 85000, measuredAt: NOW - 14 * DAY },
    { value: 82000, measuredAt: NOW },
  ];
  const fastTip = getHealthTips(input({ weightSeries: fast })).find((t) => t.id === "weight-rate");
  assert.equal(fastTip?.attention, true);
  assert.match(fastTip!.title, /1,5 кг в неделю/);

  const steady = [
    { value: 83500, measuredAt: NOW - 14 * DAY },
    { value: 82000, measuredAt: NOW },
  ];
  assert.equal(getHealthTips(input({ weightSeries: steady })).find((t) => t.id === "weight-rate")?.attention, false);

  const slow = [
    { value: 82500, measuredAt: NOW - 14 * DAY },
    { value: 82000, measuredAt: NOW },
  ];
  assert.equal(getHealthTips(input({ weightSeries: slow })).find((t) => t.id === "weight-rate"), undefined);
});

test("growing waist or belly brings the abdominal-exercise study tip", () => {
  assert.ok(ids(input({ latest: [m("belly", 950, 940, 2)] })).includes("spot-reduction"));
  assert.ok(!ids(input({ latest: [m("belly", 930, 940, 2)] })).includes("spot-reduction"));
});

test("biceps that stopped growing brings the WHO strength tip", () => {
  assert.ok(ids(input({ latest: [m("biceps", 360, 360, 2)] })).includes("strength"));
  assert.ok(!ids(input({ latest: [m("biceps", 365, 360, 2)] })).includes("strength"));
});

test("the how-to-measure tip shows until waist or belly has 3 measurements", () => {
  assert.ok(ids(input({ latest: [m("waist", 900, 905, 2), m("belly", 950, 955, 2)] })).includes("how-to-measure"));
  assert.ok(!ids(input({ latest: [m("waist", 900, 905, 3)] })).includes("how-to-measure"));
  assert.ok(!ids(input({ latest: [m("weight", 80000)] })).includes("how-to-measure"));
});

test("attention tips come first and the profile prompt appears without height", () => {
  const tips = getHealthTips(
    input({
      latest: [m("waist", 950, 940, 2)],
      weightSeries: [
        { value: 85000, measuredAt: NOW - 14 * DAY },
        { value: 82000, measuredAt: NOW },
      ],
    })
  );
  assert.equal(tips[0].attention, true);
  assert.ok(tips.some((t) => t.action === "profile"));
  assert.ok(tips.every((t) => t.action === "profile" || t.source), "every tip except the prompt has a source");
});

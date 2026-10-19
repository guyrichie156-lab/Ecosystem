import { test } from "node:test";
import assert from "node:assert/strict";
import { bucketByMonth, foldCategories, monthStarts, wholePercentages } from "./chartData";

const row = (name: string, amount: number, categoryId: number | null = null) => ({ categoryId, name, amount });

test("up to five categories stay as they are", () => {
  const rows = [row("Еда", 500, 1), row("Транспорт", 300, 2), row("Кафе", 100, 3)];
  assert.deepEqual(
    foldCategories(rows).map((s) => [s.name, s.amount, s.other]),
    [
      ["Еда", 500, false],
      ["Транспорт", 300, false],
      ["Кафе", 100, false],
    ]
  );
});

test("a sixth category keeps its name but is drawn grey: the palette has five colours", () => {
  // The six default expense categories (seed.ts), all with spending in the month.
  const rows = [60, 50, 40, 30, 20, 10].map((a, i) => row(`К${i + 1}`, a, i + 1));
  const segments = foldCategories(rows);
  assert.deepEqual(
    segments.map((s) => [s.name, s.other]),
    [["К1", false], ["К2", false], ["К3", false], ["К4", false], ["К5", false], ["К6", true]]
  );
});

test("past six categories the smallest fold into one «Остальные» slice", () => {
  const rows = [70, 60, 50, 40, 30, 20, 10].map((a, i) => row(`К${i + 1}`, a, i + 1));
  const segments = foldCategories(rows);
  assert.equal(segments.length, 6);
  assert.deepEqual(segments.slice(0, 5).map((s) => s.name), ["К1", "К2", "К3", "К4", "К5"]);
  assert.deepEqual([segments[5].name, segments[5].amount, segments[5].other], ["Остальные (2)", 30, true]);
});

test("every coloured slice has a palette colour, whatever the number of categories", () => {
  for (let n = 1; n <= 9; n++) {
    const rows = Array.from({ length: n }, (_, i) => row(`К${i + 1}`, 100 - i, i + 1));
    const coloured = foldCategories(rows, 5).filter((s) => !s.other).length;
    assert.ok(coloured <= 5, `${n} categories give ${coloured} coloured slices`);
  }
});

test("categories with nothing spent are left out", () => {
  assert.deepEqual(foldCategories([row("Еда", 100, 1), row("Пусто", 0, 2)]).map((s) => s.name), ["Еда"]);
});

test("whole percentages always add up to 100", () => {
  assert.deepEqual(wholePercentages([1, 1, 1]), [34, 33, 33]);
  assert.deepEqual(wholePercentages([500, 300, 100]), [56, 33, 11]); // 55.6 / 33.3 / 11.1
  assert.equal(wholePercentages([7, 13, 29, 51, 3]).reduce((a, b) => a + b, 0), 100);
  assert.deepEqual(wholePercentages([0, 0]), [0, 0]);
});

test("month starts run oldest first and end with the current month", () => {
  const starts = monthStarts(3, new Date(2026, 0, 15)); // 15 January 2026, local time
  assert.deepEqual(
    starts.map((t) => [new Date(t).getFullYear(), new Date(t).getMonth(), new Date(t).getDate()]),
    [
      [2025, 10, 1],
      [2025, 11, 1],
      [2026, 0, 1],
    ]
  );
});

test("expenses go into their calendar month; empty months are zero", () => {
  const starts = monthStarts(3, new Date(2026, 9, 17));
  const end = new Date(2026, 10, 1).getTime();
  const at = (m: number, d: number) => new Date(2026, m, d, 12).getTime();
  const months = bucketByMonth(
    [
      { occurredAt: at(6, 31), amount: 50 }, // July: before the window
      { occurredAt: at(7, 31), amount: 100 }, // August, the oldest of the 3 months
      { occurredAt: at(8, 1), amount: 200 }, // September
      { occurredAt: at(9, 1), amount: 300 }, // October
      { occurredAt: at(9, 31), amount: 400 }, // October
      { occurredAt: at(10, 1), amount: 500 }, // November: after the window
    ],
    starts,
    end
  );
  assert.deepEqual(
    months.map((m) => m.amount),
    [100, 200, 700]
  );
  assert.deepEqual(
    bucketByMonth([{ occurredAt: at(9, 5), amount: 300 }], starts, end).map((m) => m.amount),
    [0, 0, 300]
  );
});

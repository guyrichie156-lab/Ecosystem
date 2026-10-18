import { test } from "node:test";
import assert from "node:assert/strict";
import { groupByDay, monthlyReport, summarize } from "./records";
import { addMonths, calendarWeeks, compareMonths, monthBounds, occurredAtFor } from "./period";

const at = (y: number, m: number, d: number, h = 12) => new Date(y, m, d, h).getTime();
const row = (type: "income" | "expense" | "transfer", amount: number, occurredAt: number) => ({ type, amount, occurredAt });

test("a month's summary leaves transfers out", () => {
  const rows = [row("expense", 1500, at(2026, 7, 4)), row("income", 5000, at(2026, 7, 5)), row("transfer", 900, at(2026, 7, 5))];
  assert.deepEqual(summarize(rows), { income: 5000, expense: 1500, balance: 3500 });
});

test("records group by day with each day's income and expenses", () => {
  const rows = [
    row("expense", 300, at(2026, 7, 5, 18)),
    row("income", 1000, at(2026, 7, 5, 9)),
    row("expense", 1500, at(2026, 7, 4)),
    row("expense", 500, at(2026, 7, 4, 8)),
  ];
  const days = groupByDay(rows);
  assert.equal(days.length, 2);
  assert.deepEqual([days[0].expense, days[0].income, days[0].data.length], [300, 1000, 2]);
  assert.deepEqual([days[1].expense, days[1].income, days[1].data.length], [2000, 0, 2]);
  assert.equal(new Date(days[1].day).getDate(), 4);
});

test("the report has only months with money moving, newest first, by year", () => {
  const rows = [
    row("expense", 60000, at(2025, 9, 5)),
    row("income", 70000, at(2025, 9, 6)),
    row("expense", 40050, at(2026, 6, 10)),
    row("income", 100000, at(2026, 6, 11)),
    row("expense", 1250, at(2026, 7, 2)),
    row("transfer", 5000, at(2026, 5, 1)), // June: transfer only, no row
  ];
  const report = monthlyReport(rows);
  assert.deepEqual(report.map((y) => y.year), [2026, 2025]);
  assert.deepEqual(
    report[0].months.map((m) => [m.month, m.expense, m.income, m.balance]),
    [
      [7, 1250, 0, -1250],
      [6, 40050, 100000, 59950],
    ]
  );
  assert.deepEqual(report[1].months.map((m) => [m.month, m.balance]), [[9, 10000]]);
  // The months' balances add up to the overall balance.
  assert.equal(summarize(rows).balance, -1250 + 59950 + 10000);
});

test("months add across years and compare in order", () => {
  assert.deepEqual(addMonths({ year: 2026, month: 0 }, -1), { year: 2025, month: 11 });
  assert.deepEqual(addMonths({ year: 2025, month: 11 }, 1), { year: 2026, month: 0 });
  assert.ok(compareMonths({ year: 2025, month: 11 }, { year: 2026, month: 0 }) < 0);
  const { start, end } = monthBounds({ year: 2026, month: 1 });
  assert.equal((end - start) / 86400000, 28);
});

test("the calendar starts weeks on Monday", () => {
  // 1 October 2026 is a Thursday.
  const weeks = calendarWeeks({ year: 2026, month: 9 });
  assert.deepEqual(weeks[0], [null, null, null, 1, 2, 3, 4]);
  assert.equal(weeks.flat().filter((d) => d !== null).length, 31);
  assert.ok(weeks.every((w) => w.length === 7));
});

test("a back-dated record is stored at noon, today's at the current time", () => {
  const now = at(2026, 9, 18, 21);
  assert.equal(occurredAtFor(at(2026, 9, 18, 8), now), now);
  assert.equal(occurredAtFor(at(2026, 7, 2, 8), now), at(2026, 7, 2, 12));
});

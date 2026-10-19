/** Pure helpers behind the finance charts (no database), so they can be unit-tested. */

export type CategorySpend = { categoryId: number | null; name: string; amount: number; icon?: string | null };
/** `other`: drawn in the neutral grey instead of a palette colour (the folded tail). */
export type DonutSegment = CategorySpend & { other: boolean };
export type MonthSpend = { monthStart: number; amount: number };

/**
 * At most `colours` coloured slices (the palette size, theme.chart.slots) and one grey slice: a
 * donut stops working past ~6 slices (dataviz skill). The smallest categories fold into one
 * "Остальные (N)" slice — not "Другое", which is a real default category; a single leftover
 * category keeps its own name and is only drawn grey. Input must be sorted largest first.
 */
export function foldCategories(rows: CategorySpend[], colours = 5): DonutSegment[] {
  const positive = rows.filter((r) => r.amount > 0);
  const kept = positive.slice(0, colours).map((r) => ({ ...r, other: false }));
  const tail = positive.slice(colours);
  if (tail.length === 0) return kept;
  if (tail.length === 1) return [...kept, { ...tail[0], other: true }];
  const rest = tail.reduce((sum, r) => sum + r.amount, 0);
  return [...kept, { categoryId: null, name: `Остальные (${tail.length})`, amount: rest, other: true }];
}

/**
 * Whole percentages that add up to exactly 100 (largest remainder method), so the
 * legend never shows 99 % or 101 % in total.
 */
export function wholePercentages(amounts: number[]): number[] {
  const total = amounts.reduce((a, b) => a + b, 0);
  if (total <= 0) return amounts.map(() => 0);
  const exact = amounts.map((a) => (a / total) * 100);
  const floors = exact.map(Math.floor);
  let left = 100 - floors.reduce((a, b) => a + b, 0);
  const byRemainder = exact.map((e, i) => ({ i, r: e - floors[i] })).sort((a, b) => b.r - a.r);
  for (const { i } of byRemainder) {
    if (left === 0) break;
    floors[i] += 1;
    left -= 1;
  }
  return floors;
}

/** Starts of the last `count` calendar months in the device's time zone, oldest first; the last is this month. */
export function monthStarts(count: number, now: Date): number[] {
  return Array.from({ length: count }, (_, i) => new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1).getTime());
}

/** Sums expenses into the months that start at `starts` (oldest first); a month without expenses is 0. */
export function bucketByMonth(rows: { occurredAt: number; amount: number }[], starts: number[], end: number): MonthSpend[] {
  const totals = starts.map((monthStart) => ({ monthStart, amount: 0 }));
  for (const row of rows) {
    if (row.occurredAt < starts[0] || row.occurredAt >= end) continue;
    // The last start that is not after the transaction.
    let i = starts.length - 1;
    while (i > 0 && row.occurredAt < starts[i]) i--;
    totals[i].amount += row.amount;
  }
  return totals;
}
